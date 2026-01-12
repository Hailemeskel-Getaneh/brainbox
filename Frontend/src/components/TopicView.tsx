import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Loader2, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CodeBlockLowlight } from '@tiptap/extension-code-block';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

interface Note {
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

  const [topicTitle, setTopicTitle] = useState('Loading...');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editEditorContent, setEditEditorContent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newNoteTags, setNewNoteTags] = useState<string>('');
  const [editingNoteTags, setEditingNoteTags] = useState<string>('');
  const [filterTags, setFilterTags] = useState<string>('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showNewNoteTagSuggestions, setShowNewNoteTagSuggestions] = useState(false);
  const [showEditingNoteTagSuggestions, setShowEditingNoteTagSuggestions] = useState(false);

  const createEditor = (initialContent: string, onUpdateCallback: (editor: any) => void) => useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onUpdateCallback(editor);
    },
  });

  const mainEditor = createEditor('', (editor) => {
    // Main editor's onUpdate logic
  });

  const editEditor = createEditor(editEditorContent, (editor) => {
    setEditEditorContent(editor.getHTML());
  });

  useEffect(() => {
    if (editingNoteId !== null) {
      const noteToEdit = notes.find(note => note.id === editingNoteId);
      if (noteToEdit) {
        editEditor?.commands.setContent(noteToEdit.content);
        setEditEditorContent(noteToEdit.content); // Ensure state is aligned
        setEditingNoteTags(noteToEdit.tags?.join(', ') || ''); // Populate editing tags
      }
    } else {
      editEditor?.commands.clearContent();
      setEditEditorContent('');
      setEditingNoteTags(''); // Clear editing tags
    }
  }, [editingNoteId, notes, editEditor]);

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

      const queryParams = new URLSearchParams();
      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm);
      }
      if (filterTags) {
        queryParams.append('tags', filterTags);
      }

      const queryString = queryParams.toString();
      const notesRes = await fetch(`${API_BASE}/api/notes/${topicId}${queryString ? `?${queryString}` : ''}`, {
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
  }, [topicId, authHeaders, navigate, searchTerm, filterTags]);

  useEffect(() => {
    const controller = new AbortController();
    fetchNotes(controller.signal);
    return () => controller.abort();
  }, [fetchNotes]);

      const handleCreateNote = async (e: React.FormEvent) => {
      e.preventDefault();
      const content = mainEditor?.getHTML();
      if (!content || mainEditor?.isEmpty) return;
      if (!topicId) return;
  
      const tagsArray = newNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  
      try {
        setSubmitting(true);
        setError(null);
  
        // Optimistic UI update
        const optimisticNote: Note = {
          id: Date.now(),
          topic_id: parseInt(topicId),
          content: content,
          created_at: new Date().toISOString(),
          tags: tagsArray, // Include tags in optimistic update
        };
        setNotes((prev) => [...prev, optimisticNote]);
        mainEditor?.commands.clearContent(); // Clear main editor content
        setNewNoteTags(''); // Clear new note tags
  
        const res = await fetch(`${API_BASE}/api/notes/${topicId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({ content, tags: tagsArray }), // Send tags to backend
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
  const handleUpdateNote = async (id: number, content: string, tags?: string[]) => {
    if (!topicId) return; // Should not happen as notes are topic-specific
    try {
      setSubmitting(true); // Indicate submission in progress
      setError(null);

      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ content, tags }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update note');
      }

      setEditingNoteId(null); // Exit editing mode
      setEditEditorContent(''); // Clear the editing content
      await fetchNotes(); // Re-fetch to get updated data
    } catch (err: any) {
      setError(err.message ?? 'Unable to update note');
    } finally {
      setSubmitting(false); // End submission
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

        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search notes in this topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              &times;
            </button>
          )}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Filter by tags (comma-separated)"
            value={filterTags}
            onChange={(e) => setFilterTags(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {filterTags && (
            <button
              onClick={() => setFilterTags('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              &times;
            </button>
          )}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {/* Tag icon or similar */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5.99C17.65 3 21 6.35 21 10c0 4.63-3.37 8-8 8H6c-3.65 0-7-3.35-7-7 0-3.65 3.35-7 7-7zm0 14h10c3.35 0 6-2.65 6-6s-2.65-6-6-6H7C3.35 6 0 8.65 0 12s2.65 6 6 6z" />
            </svg>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow-lg">
          <form onSubmit={handleCreateNote} className="flex flex-col gap-4">
            <EditorContent editor={mainEditor} className="bg-gray-700 rounded-md p-3 min-h-[100px] focus-within:ring-2 focus-within:ring-blue-500 transition" />
            <input
              type="text"
              placeholder="Add tags (comma-separated)"
              value={newNoteTags}
              onChange={(e) => setNewNoteTags(e.target.value)}
              onFocus={() => setShowNewNoteTagSuggestions(true)}
              onBlur={() => setTimeout(() => setShowNewNoteTagSuggestions(false), 100)} // Delay to allow click
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {showNewNoteTagSuggestions && tagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-lg mt-1 max-h-48 overflow-y-auto">
                {tagSuggestions
                  .filter(
                    (tag) =>
                      tag.toLowerCase().includes(newNoteTags.split(',').pop()?.trim().toLowerCase() || '') &&
                      !(newNoteTags.split(',').map(t => t.trim()).includes(tag))
                  )
                  .map((tag) => (
                    <div
                      key={tag}
                      onMouseDown={() => { // Use onMouseDown to prevent onBlur from firing first
                        const currentTags = newNoteTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
                        currentTags.pop(); // Remove partial tag
                        setNewNoteTags([...currentTags, tag].join(', ') + ', ');
                        setShowNewNoteTagSuggestions(false);
                      }}
                      className="p-2 cursor-pointer hover:bg-gray-700"
                    >
                      {tag}
                    </div>
                  ))}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || mainEditor?.isEmpty}
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
                {editingNoteId === note.id ? (
                  // Editing mode
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (editEditor && !editEditor.isEmpty && editingNoteId !== null) {
                      const tagsArray = editingNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                      handleUpdateNote(editingNoteId, editEditor.getHTML(), tagsArray);
                    }
                  }} className="flex flex-col gap-4">
                    <EditorContent
                      editor={editEditor}
                      className="bg-gray-700 rounded-md p-3 min-h-[100px] focus-within:ring-2 focus-within:ring-blue-500 transition"
                    />
                    <input
                      type="text"
                      placeholder="Add tags (comma-separated)"
                      value={editingNoteTags}
                      onChange={(e) => setEditingNoteTags(e.target.value)}
                      onFocus={() => setShowEditingNoteTagSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowEditingNoteTagSuggestions(false), 100)} // Delay to allow click
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    {showEditingNoteTagSuggestions && editingNoteTags && tagSuggestions.length > 0 && (
                      <div className="relative"> {/* Added relative positioning */}
                        <div className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-lg mt-1 max-h-48 overflow-y-auto">
                          {tagSuggestions
                            .filter(
                              (tag) =>
                                tag.toLowerCase().includes(editingNoteTags.split(',').pop()?.trim().toLowerCase() || '') &&
                                !(editingNoteTags.split(',').map(t => t.trim()).includes(tag))
                            )
                            .map((tag) => (
                              <div
                                key={tag}
                                onMouseDown={() => { // Use onMouseDown to prevent onBlur from firing first
                                  const currentTags = editingNoteTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
                                  currentTags.pop(); // Remove partial tag
                                  setEditingNoteTags([...currentTags, tag].join(', ') + ', ');
                                  setShowEditingNoteTagSuggestions(false);
                                }}
                                className="p-2 cursor-pointer hover:bg-gray-700"
                              >
                                {tag}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditEditorContent('');
                          setEditingNoteTags('');
                        }}
                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!editEditor || editEditor.isEmpty}
                        className="bg-green-700 hover:bg-green-500 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  // View mode
                  <>
                    <div
                      className="prose prose-invert max-w-none text-gray-300"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {note.tags.map((tag, index) => (
                          <span key={index} className="bg-blue-600/30 text-blue-300 text-xs px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          aria-label="Delete note"
                          className="text-gray-500 hover:text-red-400 p-1 rounded-full hover:bg-red-400/10"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditEditorContent(note.content);
                          }}
                          aria-label="Edit note"
                          className="text-gray-500 hover:text-blue-400 p-1 rounded-full hover:bg-blue-400/10"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </div>
                  </>
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
