import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Topic {
  id: number;
  title: string;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const Dashboard = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { token, logout, user } = useAuth();

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const fetchTopics = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/topics`, {
        headers: authHeaders,
        signal,
      });
      if (!res.ok) throw new Error('Failed to load topics');
      const data = await res.json();
      setTopics(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTopics(controller.signal);
    return () => controller.abort();
  }, [fetchTopics]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      // Optimistic UI
      const optimistic: Topic = {
        id: Date.now(),
        title: newTopic,
        created_at: new Date().toISOString(),
      };
      setTopics((prev) => [optimistic, ...prev]);
      setNewTopic('');

      const res = await fetch(`${API_BASE}/api/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ title: optimistic.title }),
      });

      if (!res.ok) throw new Error('Failed to create topic');
      await fetchTopics();
    } catch (err: any) {
      setError(err.message ?? 'Unable to create topic');
      fetchTopics(); // rollback optimistic update
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this topic permanently?')) return;

    const prev = topics;
    setTopics((t) => t.filter((x) => x.id !== id));

    try {
      const res = await fetch(`${API_BASE}/api/topics/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Delete failed');
    } catch {
      setTopics(prev); // rollback
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
              My BrainBox
            </h1>
            <p className="text-gray-400">Welcome back, {user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </header>

        <form onSubmit={handleCreateTopic} className="mb-10 flex gap-4">
          <input
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Create a new topic…"
            aria-label="New topic title"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newTopic.trim() || submitting}
            className="bg-blue-700 hover:bg-blue-500 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
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
          <div className="text-center py-20 text-gray-400">
            No topics yet. Start by creating your first one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/topic/${topic.id}`)}
                className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl p-6 cursor-pointer group transition hover:scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-semibold group-hover:text-blue-400">
                    {topic.title}
                  </h2>
                  <button
                    onClick={(e) => handleDeleteTopic(topic.id, e)}
                    aria-label="Delete topic"
                    className="text-gray-500 hover:text-red-400 p-1 rounded-full hover:bg-red-400/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                  <ArrowRight className="group-hover:text-blue-400 group-hover:translate-x-1 transition" size={18} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
