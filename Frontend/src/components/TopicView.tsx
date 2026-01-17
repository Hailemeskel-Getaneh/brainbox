import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/useTheme';
import 'easymde/dist/easymde.min.css';
import Note from './Note';
import NoteEditor from './NoteEditor';

export interface NoteType {
  id: number;
  content: string;
  created_at: string;
  tags?: string[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const TopicView = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { theme } = useTheme();

  const [topicTitle, setTopicTitle] = useState('Loading...');
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState('');

  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');

  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  const [showExportOptions, setShowExportOptions] = useState(false);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const fetchNotes = useCallback(
    async (signal?: AbortSignal) => {
      if (!topicId) return;
      try {
        setLoading(true);
        setError(null);

        const topicRes = await fetch(`${API_BASE}/api/topics/${topicId}`, {
          headers: authHeaders,
          signal,
        });
        if (!topicRes.ok) throw new Error('Failed to load topic');
        const topic = await topicRes.json();
        setTopicTitle(topic.title);

        const params = new URLSearchParams();
        if (searchTerm) params.append('searchTerm', searchTerm);
        if (filterTags) params.append('tags', filterTags);

        const notesRes = await fetch(
          `${API_BASE}/api/notes/${topicId}${params.toString() ? `?${params}` : ''}`,
          { headers: authHeaders, signal }
        );
        if (!notesRes.ok) throw new Error('Failed to load notes');
        setNotes(await notesRes.json());
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Something went wrong');
          if (err.message === 'Topic not found or access denied') {
            navigate('/dashboard');
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [topicId, authHeaders, navigate, searchTerm, filterTags]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchNotes(controller.signal);
    return () => controller.abort();
  }, [fetchNotes]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId || !newNoteContent.trim()) return;

    const tags = newNoteTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const optimistic: NoteType = {
      id: Date.now(),
      content: newNoteContent,
      created_at: new Date().toISOString(),
      tags,
    };

    setNotes(prev => [...prev, optimistic]);
    setNewNoteContent('');
    setNewNoteTags('');

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/notes/${topicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ content: optimistic.content, tags }),
      });
      if (!res.ok) throw new Error('Failed to create note');
    } catch (err: any) {
      setError(err.message);
      fetchNotes();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async (id: number) => {
    if (!topicId) return;
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ content: editContent, tags }),
      });
      if (!res.ok) throw new Error('Failed to update note');
      setEditingNoteId(null);
      setEditContent('');
      setEditTags('');
      fetchNotes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm('Delete this note permanently?')) return;
    const snapshot = notes;
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to delete note');
    } catch (err: any) {
      setError(err.message);
      setNotes(snapshot);
    }
  };

  const handleExport = (format: 'markdown' | 'text') => {
    if (!notes.length) return alert('No notes to export');

    const content = notes
      .map(n => {
        const date = new Date(n.created_at).toLocaleString();
        const tags = n.tags?.length ? `\nTags: ${n.tags.join(', ')}` : '';
        if (format === 'markdown') {
          return `## Note on ${date}\n${n.content}${tags}\n---`;
        }
        const plain = n.content.replace(/[#*_`>|\n]/g, ' ').trim();
        return `Note on ${date}:\n${plain}${tags}\n---`;
      })
      .join('\n\n');

    const blob = new Blob([content], {
      type: format === 'markdown' ? 'text/markdown' : 'text/plain',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topicTitle}-notes.${format === 'markdown' ? 'md' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 text-gray-900 dark:text-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              <Download size={18} /> Export
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded shadow">
                <button className="block px-4 py-2" onClick={() => handleExport('markdown')}>
                  Markdown
                </button>
                <button className="block px-4 py-2" onClick={() => handleExport('text')}>
                  Plain text
                </button>
              </div>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6">{topicTitle}</h1>

        <NoteEditor
          submitting={submitting}
          content={newNoteContent}
          tags={newNoteTags}
          onContentChange={setNewNoteContent}
          onTagsChange={setNewNoteTags}
          onSubmit={handleCreateNote}
          buttonText="Add Note"
        />

        {error && <div className="mt-4 text-red-400">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : notes.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No notes yet</div>
        ) : (
          <div className="mt-6 space-y-4">
            {notes.map(note => (
              <div key={note.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                {editingNoteId === note.id ? (
                  <NoteEditor
                    submitting={submitting}
                    content={editContent}
                    tags={editTags}
                    onContentChange={setEditContent}
                    onTagsChange={setEditTags}
                    onSubmit={() => handleUpdateNote(note.id)}
                    onCancel={() => setEditingNoteId(null)}
                    buttonText="Save"
                  />
                ) : (
                  <Note
                    note={note}
                    onDelete={handleDeleteNote}
                    onEdit={(id, content, tags) => {
                      setEditingNoteId(id);
                      setEditContent(content);
                      setEditTags(tags);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicView;
