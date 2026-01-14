import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, LogOut, Loader2, Search, User, Edit, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/useTheme';

interface Topic {
  id: number;
  title: string;
  created_at: string;
  note_count: number;
}

interface SearchResult {
  id: number;
  content: string;
  topic_id: number;
  topic_title: string;
}

const API_BASE = '/api';

const Dashboard = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState({ totalTopics: 0, totalNotes: 0, notesLast7Days: 0 });
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [topicToDeleteId, setTopicToDeleteId] = useState<number | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState('');
  const [topicSearchTerm, setTopicSearchTerm] = useState('');

  const navigate = useNavigate();
  const { token, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    try {
      // No setLoading(true) here as it's handled by overall dashboard loading
      setError(null);
      const res = await fetch(`${API_BASE}/users/dashboard/stats`, {
        headers: authHeaders,
        signal,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load dashboard statistics');
      }
      const data = await res.json();
      setStats(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message ?? 'Something went wrong fetching stats');
      }
    }
  }, [authHeaders]);

  const fetchTopics = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/topics`, {
        headers: authHeaders,
        signal,
      });

      if (!res.ok) throw new Error('Failed to load topics');
      const data = await res.json();
      setTopics(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message ?? 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    const controller = new AbortController();
    if (!searchTerm) {
      fetchTopics(controller.signal);
    }
    return () => controller.abort();
  }, [fetchTopics, searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      try {
        setSearching(true);
        const res = await fetch(`${API_BASE}/notes/search?q=${searchTerm}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setSearchResults(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message ?? 'Something went wrong');
        }
      } finally {
        setSearching(false);
      }
    };

    const debounceSearch = setTimeout(() => {
        search();
    }, 300);

    return () => clearTimeout(debounceSearch);
  }, [searchTerm, authHeaders]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const optimistic: Topic = {
        id: Date.now(),
        title: newTopic,
        created_at: new Date().toISOString(),
        note_count: 0,
      };
      setTopics((prev) => [optimistic, ...prev]);
      setNewTopic('');

      const res = await fetch(`${API_BASE}/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ title: optimistic.title }),
      });

      if (!res.ok) throw new Error('Failed to create topic');
      await fetchTopics();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message ?? 'Unable to create topic');
      }
      fetchTopics(); // rollback optimistic update
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTopicToDeleteId(id);
    setIsConfirmingDelete(true);
  };

  const confirmDelete = async () => {
    if (topicToDeleteId === null) return;

    const id = topicToDeleteId;
    setIsConfirmingDelete(false);
    setTopicToDeleteId(null);

    const prev = topics;
    setTopics((t) => t.filter((x) => x.id !== id));

    try {
      const res = await fetch(`${API_BASE}/topics/${id}`, {        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Delete failed');
    } catch {
      setTopics(prev); // rollback
    }
  };

  const cancelDelete = () => {
    setIsConfirmingDelete(false);
    setTopicToDeleteId(null);
  };

  const handleEditTopic = async (id: number, newTitle: string) => {
    if (!newTitle.trim()) {
      setError('Topic title cannot be empty.');
      return;
    }
    if (!token) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`${API_BASE}/topics/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update topic title');
      }

      setTopics((prevTopics) =>
        prevTopics.map((topic) =>
          topic.id === id ? { ...topic, title: newTitle } : topic
        )
      );
      setEditingTopicId(null);
      setEditingTopicTitle('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message ?? 'Unable to update topic title');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
              My BrainBox
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Welcome back, {user?.username}</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <User size={18} /> Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </header>

        {/* --- Dashboard Statistics --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Topics</h3>
            <p className="text-3xl font-bold text-blue-500 dark:text-blue-400">{stats.totalTopics}</p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Notes</h3>
            <p className="text-3xl font-bold text-purple-500 dark:text-purple-400">{stats.totalNotes}</p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes Last 7 Days</h3>
            <p className="text-3xl font-bold text-green-500 dark:text-green-400">{stats.notesLast7Days}</p>
          </div>
        </div>
        {/* --- End Dashboard Statistics --- */}

        {isConfirmingDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-sm mx-auto text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
              <p className="text-gray-300 mb-6">Are you sure you want to delete this topic permanently? This action cannot be undone.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={cancelDelete}
                  className="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-10 flex gap-4">
          <div className="relative flex-1">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in all notes..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            {searching && <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />}
          </div>
        </div>

        {searchTerm ? (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Search Results</h2>
            {searching && searchResults.length === 0 ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin" size={36} />
                </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((note) => (
                  <div key={note.id} className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p
                      onClick={() => navigate(`/topic/${note.topic_id}`)}
                      className="text-sm text-blue-500 dark:text-blue-400 mb-2 cursor-pointer hover:underline"
                    >
                      in: {note.topic_title}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-10">No results found for "{searchTerm}".</p>
            )}
          </div>
        ) : (
          <>
            <div className="relative mb-10">
              <input
                type="search"
                value={topicSearchTerm}
                onChange={(e) => setTopicSearchTerm(e.target.value)}
                placeholder="Search your topics..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              {topicSearchTerm && (
                <button
                  onClick={() => setTopicSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>

            <form onSubmit={handleCreateTopic} className="mb-10 flex gap-4">
              <input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Create a new topic…"
                aria-label="New topic title"
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={!newTopic.trim() || submitting}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-white"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Add Topic
              </button>
            </form>

            {error && (
              <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-300">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin" size={36} />
              </div>
            ) : topics.length === 0 ? (
              <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                No topics yet. Start by creating your first one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => navigate(`/topic/${topic.id}`)}
                    className="bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 cursor-pointer group transition hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      {editingTopicId === topic.id ? (
                        <input
                          type="text"
                          value={editingTopicTitle}
                          onChange={(e) => setEditingTopicTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditTopic(topic.id, editingTopicTitle);
                            }
                            if (e.key === 'Escape') {
                              setEditingTopicId(null);
                              setEditingTopicTitle('');
                            }
                          }}
                          className="flex-1 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <h2 className="text-lg font-semibold group-hover:text-blue-500 dark:group-hover:text-blue-400">
                          {topic.title}
                        </h2>
                      )}

                      <div className="flex gap-2 items-center">
                        {editingTopicId === topic.id ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTopic(topic.id, editingTopicTitle);
                              }}
                              aria-label="Save topic title"
                              className="px-3 py-1 rounded-lg text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-400/10 text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTopicId(null);
                                setEditingTopicTitle('');
                              }}
                              aria-label="Cancel topic title edit"
                              className="px-3 py-1 rounded-lg text-gray-500 hover:text-gray-400 hover:bg-gray-400/10 text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTopicId(topic.id);
                              setEditingTopicTitle(topic.title);
                            }}
                            aria-label="Edit topic title"
                            className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 p-1 rounded-full hover:bg-blue-400/10"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteTopic(topic.id, e)}
                          aria-label="Delete topic"
                          className="text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-400/10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-400 dark:text-gray-500">
                      <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{topic.note_count} Notes</span>
                      <ArrowRight className="group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition" size={18} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
