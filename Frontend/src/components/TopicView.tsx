import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import 'easymde/dist/easymde.min.css';
import Note from './Note';
import NoteEditor from './NoteEditor';

export interface NoteType {
  id: number;
  content: string;
  created_at: string;
  tags?: string[];
  is_complete?: boolean; // New: is_complete field
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const TopicView = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [topicTitle, setTopicTitle] = useState('Loading...');
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [topicTags, setTopicTags] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'content'>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');

  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editIsComplete, setEditIsComplete] = useState<boolean>(false); // New state variable

  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isConfirmingDeleteNote, setIsConfirmingDeleteNote] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<number | null>(null);

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
        if (selectedTag) params.append('tags', selectedTag); // Add selectedTag to filter
        params.append('sortBy', sortBy); // Add sortBy
        params.append('sortOrder', sortOrder); // Add sortOrder

        const notesRes = await fetch(
          `${API_BASE}/api/notes/${topicId}${params.toString() ? `?${params}` : ''}`,
          { headers: authHeaders, signal }
        );
        if (!notesRes.ok) throw new Error('Failed to load notes');
        setNotes(await notesRes.json());
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name !== 'AbortError') {
            setError(err.message || 'Something went wrong');
            if (err.message === 'Topic not found or access denied') {
              navigate('/dashboard');
            }
          }
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    },
    [topicId, authHeaders, navigate, searchTerm, filterTags, selectedTag, sortBy, sortOrder] // Add sortBy, sortOrder to dependencies
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchNotes(controller.signal);
    return () => controller.abort();
  }, [fetchNotes]);

  const fetchTopicTags = useCallback(async (signal?: AbortSignal) => {
    if (!token || !topicId) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/tags/suggestions?topicId=${topicId}`, {
        headers: authHeaders,
        signal,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load topic tags');
      }
      const data = await res.json();
      setTopicTags(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message ?? 'Something went wrong fetching topic tags');
      }
    }
  }, [authHeaders, token, topicId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTopicTags(controller.signal);
    return () => controller.abort();
  }, [fetchTopicTags]);

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
      is_complete: false, // Default to false for new notes
    };

    setNotes(prev => [...prev, optimistic]);
    setNewNoteContent('');
    setNewNoteTags('');

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/notes/${topicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ content: optimistic.content, tags, is_complete: false }), // Send is_complete
      });
      if (!res.ok) throw new Error('Failed to create note');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during note creation.');
      }
      fetchNotes();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async (id: number, is_complete_status?: boolean) => { // Accept optional is_complete_status
    if (!topicId) return;
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);

    // Find the current note to get its is_complete status if not provided
    const currentNote = notes.find(note => note.id === id);
    const finalIsComplete = is_complete_status !== undefined ? is_complete_status : (currentNote?.is_complete || false);

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ content: editContent, tags, is_complete: finalIsComplete }), // Send is_complete
      });
      if (!res.ok) throw new Error('Failed to update note');
      setEditingNoteId(null);
      setEditContent('');
      setEditTags('');
      fetchNotes();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during note update.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (id: number, is_complete: boolean) => {
    const originalNotes = [...notes];
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, is_complete } : note
      )
    );

    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ is_complete }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle note completion status');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while toggling note completion.');
      }
      setNotes(originalNotes); // Rollback optimistic update
    }
  };

  const handleDeleteNote = (id: number) => {
    setNoteToDeleteId(id);
    setIsConfirmingDeleteNote(true);
  };

  const confirmDeleteNote = async () => {
    if (noteToDeleteId === null) return;

    const id = noteToDeleteId;
    setIsConfirmingDeleteNote(false);
    setNoteToDeleteId(null);

    const snapshot = notes;
    setNotes(prev => prev.filter(n => n.id !== id));

    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to delete note');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
      else {
        setError('An unknown error occurred during note deletion.');
      }
      setNotes(snapshot);
    }
  };

  const cancelDeleteNote = () => {
    setIsConfirmingDeleteNote(false);
    setNoteToDeleteId(null);
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
        <ConfirmationModal
          isOpen={isConfirmingDeleteNote}
          onClose={cancelDeleteNote}
          onConfirm={confirmDeleteNote}
          title="Confirm Note Deletion"
          message="Are you sure you want to delete this note permanently? This action cannot be undone."
        />
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
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 112 8z"
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

        <div className="flex items-center gap-4 mb-6">
            <label htmlFor="sort-by" className="text-gray-700 dark:text-gray-300">Sort by:</label>
            <div className="relative">
                <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'created_at' | 'updated_at' | 'content')}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                >
                    <option value="created_at">Creation Date</option>
                    <option value="updated_at">Last Updated</option>
                    <option value="content">Content</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    {sortOrder === 'ASC' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setSortOrder('ASC')}
                    className={`px-3 py-2 rounded-lg text-sm transition flex items-center gap-1 ${sortOrder === 'ASC' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                    ASC {sortOrder === 'ASC' ? <ChevronUp size={16} /> : null}
                </button>
                <button
                    onClick={() => setSortOrder('DESC')}
                    className={`px-3 py-2 rounded-lg text-sm transition flex items-center gap-1 ${sortOrder === 'DESC' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                    DESC {sortOrder === 'DESC' ? <ChevronDown size={16} /> : null}
                </button>
            </div>
        </div>

        {/* --- Topic Tags Section --- */}
        {topicTags.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Tags in this Topic</h2>
            <div className="flex flex-wrap gap-2">
              {topicTags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`bg-blue-500/10 text-blue-500 dark:bg-blue-600/30 dark:text-blue-300 text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-blue-500/20 dark:hover:bg-blue-600/40 transition ${selectedTag === tag ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                >
                  {tag}
                </span>
              ))}
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-sm px-3 py-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Clear Tag Filter
                </button>
              )}
            </div>
          </div>
        )}
        {/* --- End Topic Tags Section --- */}

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
                    isComplete={editIsComplete}
                    onIsCompleteChange={setEditIsComplete}
                  />
                ) : (
                  <Note
                    note={note}
                    onDelete={handleDeleteNote}
                    onEdit={(id, content, tags, is_complete) => { // Added is_complete
                      setEditingNoteId(id);
                      setEditContent(content);
                      setEditTags(tags);
                      setEditIsComplete(is_complete); // Use is_complete here
                    }}
                    onToggleComplete={handleToggleComplete} // Pass the new handler
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
