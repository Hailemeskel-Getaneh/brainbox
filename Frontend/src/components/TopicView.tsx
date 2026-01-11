import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface Note {
  id: number;
  content: string;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const TopicView = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [topicTitle, setTopicTitle] = useState('Loading...');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // You can add debounced saving here if needed,
      // but for now, we'll get content on submit
    },
  });

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const fetchNotes = useCallback(async (signal?: AbortSignal) => {
    if (!topicId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/topics/${topicId}`, {
        headers: authHeaders,
        signal,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load topic');
      }
      const topicData = await res.json();
      setTopicTitle(topicData.title);

      const notesRes = await fetch(`${API_BASE}/api/notes/${topicId}`, {
        headers: authHeaders,
        signal,
      });
      if (!notesRes.ok) {
        const errData = await notesRes.json();
        throw new Error(errData.error || 'Failed to load notes');
      }
      const notesData = await notesRes.json();
      setNotes(notesData);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Something went wrong');
        if (err.message === 'Topic not found or access denied') {
          navigate('/dashboard'); // Redirect if topic not found or no access
        }
      }
    } finally {
      setLoading(false);
    }
  }, [topicId, authHeaders, navigate]);

  useEffect(() => {
    const controller = new AbortController();
    fetchNotes(controller.signal);
    return () => controller.abort();
  }, [fetchNotes]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = editor?.getHTML();
    if (!content || editor?.isEmpty) return;
    if (!topicId) return;

    try {
      setSubmitting(true);
      setError(null);

      // Optimistic UI update
      const optimisticNote: Note = {
        id: Date.now(),
        topic_id: parseInt(topicId),
        content: content,
        created_at: new Date().toISOString(),
      };
      setNotes((prev) => [...prev, optimisticNote]);
      editor?.commands.clearContent();

      const res = await fetch(`${API_BASE}/api/notes/${topicId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create note');
      }
      await fetchNotes(); // Re-fetch to get accurate data and ID
    } catch (err: any) {
      setError(err.message ?? 'Unable to create note');
      // Rollback optimistic update on error
      if (topicId) fetchNotes();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm('Delete this note permanently?')) return;
    if (!topicId) return;

    const prevNotes = notes;
    setNotes((prev) => prev.filter((note) => note.id !== id));

    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete note');
      }
    } catch (err: any) {
      setError(err.message ?? 'Unable to delete note');
      setNotes(prevNotes); // Rollback
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition mb-6"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
          {topicTitle}
        </h1>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow-lg">
          <form onSubmit={handleCreateNote} className="flex flex-col gap-4">
            <EditorContent editor={editor} className="bg-gray-700 rounded-md p-3 min-h-[100px] focus-within:ring-2 focus-within:ring-blue-500 transition" />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || editor?.isEmpty}
                className="bg-blue-700 hover:bg-blue-500 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Add Note
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={36} />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No notes yet. Add your first note above.
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div
                  className="prose prose-invert max-w-none text-gray-300"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
                <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    aria-label="Delete note"
                    className="text-gray-500 hover:text-red-400 p-1 rounded-full hover:bg-red-400/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicView;
