import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import 'easymde/dist/easymde.min.css';
import { useTheme } from '../context/useTheme';
import Note from './Note';
import NoteEditor from './NoteEditor';

export interface Note {
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editEditorContent, setEditEditorContent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newNoteTags, setNewNoteTags] = useState<string>('');
  const [editingNoteTags, setEditingNoteTags] = useState<string>('');
  const [filterTags, setFilterTags] = useState<string>('');
    const [tagSuggestions] = useState<string[]>([]);

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
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load notes');
      }
      const notesData = await notesRes.json();
      setNotes(notesData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setError(err.message ?? 'Something went wrong');
          if (err.message === 'Topic not found or access denied') {
            navigate('/dashboard'); // Redirect if topic not found or no access
          }
        }
      } else {
        setError('Something went wrong');
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
    if (!newNoteContent.trim()) return;
    if (!topicId) return;

    const tagsArray = newNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    try {
      setSubmitting(true);
      setError(null);

      const optimisticNote: Note = {
        id: Date.now(),
        content: newNoteContent,
        created_at: new Date().toISOString(),
        tags: tagsArray,
      };
      setNotes((prev) => [...prev, optimisticNote]);
      setNewNoteContent('');
      setNewNoteTags('');

      const res = await fetch(`${API_BASE}/api/notes/${topicId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ content: newNoteContent, tags: tagsArray }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create note');
      }
      // No longer calling fetchNotes() here to prevent clearing existing notes when filters are active.
      // Optimistic update should handle displaying the new note.
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message ?? 'Unable to create note');
      }
      if (topicId) fetchNotes();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async (id: number) => {
    if (!topicId) return;
    const tagsArray = editingNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ content: editEditorContent, tags: tagsArray }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update note');
      }

      setEditingNoteId(null);
      setEditEditorContent('');
      await fetchNotes();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message ?? 'Unable to update note');
      }
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message ?? 'Unable to delete note');
      }
      setNotes(prevNotes);
    }
  };

  const handleExport = (format: 'markdown' | 'text') => {
    if (!notes.length) {
      alert('No notes to export.');
      return;
    }

    let fileContent = '';
    let fileName = `${topicTitle}-notes`;
    let mimeType = '';

    if (format === 'markdown') {
      fileContent = notes
        .map((note) => {
          const date = new Date(note.created_at).toLocaleString();
          const tags = note.tags && note.tags.length > 0 ? `\nTags: ${note.tags.join(', ')}` : '';
          return `## Note on ${date}\n${note.content}${tags}\n---`;
        })
        .join('\n\n');
      fileName += '.md';
      mimeType = 'text/markdown';
    } else {
      // Plain text
      fileContent = notes
        .map((note) => {
          const date = new Date(note.created_at).toLocaleString();
          const tags = note.tags && note.tags.length > 0 ? `\nTags: ${note.tags.join(', ')}` : '';
          // Remove Markdown formatting for plain text
          const plainTextContent = note.content.replace(/##|\*\*|__|\[.*?\]\(.*?\)|\n/g, '').trim();
          return `Note on ${date}:\n${plainTextContent}${tags}\n---`;
        })
        .join('\n\n');
      fileName += '.txt';
      mimeType = 'text/plain';
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-500 text-white rounded-lg transition"
            >
              <Download size={18} /> Export
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={() => handleExport('markdown')}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  Export as Markdown
                </button>
                <button
                  onClick={() => handleExport('text')}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  Export as Plain Text
                </button>
              </div>
            )}
          </div>
        </div>

        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
          {topicTitle}
        </h1>

        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search notes in this topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 pl-10 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
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
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 pl-10 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {filterTags && (
            <button
              onClick={() => setFilterTags('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              &times;
            </button>
          )}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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

        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <NoteEditor
            submitting={submitting}
            content={newNoteContent}
            tags={newNoteTags}
            onContentChange={setNewNoteContent}
            onTagsChange={setNewNoteTags}
            onSubmit={handleCreateNote}
            buttonText="Add Note"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={36} />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            No notes yet. Add your first note above.
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                {editingNoteId === note.id ? (
                  <NoteEditor
                    submitting={submitting}
                    content={editEditorContent}
                    tags={editingNoteTags}
                    onContentChange={setEditEditorContent}
                    onTagsChange={setEditingNoteTags}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editingNoteId !== null) {
                        handleUpdateNote(editingNoteId);
                      }
                    }}
                    buttonText="Save"
                    onCancel={() => {
                      setEditingNoteId(null);
                      setEditEditorContent('');
                      setEditingNoteTags('');
                    }}
                  />
                ) : (
                  <Note
                    note={note}
                    onDelete={handleDeleteNote}
                    onEdit={(id, content, tags) => {
                      setEditingNoteId(id);
                      setEditEditorContent(content);
                      setEditingNoteTags(tags);
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
>>>>>>> 88b8ba9 (refactor(topic): export note type)
