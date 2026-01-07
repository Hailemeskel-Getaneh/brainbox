import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Topic {
    id: number;
    title: string;
    created_at: string;
}

const Dashboard = () => {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [newTopic, setNewTopic] = useState('');
    const navigate = useNavigate();
    const { token, logout, user } = useAuth();

    const fetchTopics = useCallback(async () => {
        const res = await fetch('http://localhost:5000/api/topics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            setTopics(data);
        }
    }, [token]);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    const handleCreateTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTopic.trim()) return;

        const res = await fetch('http://localhost:5000/api/topics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: newTopic }),
        });

        if (res.ok) {
            setNewTopic('');
            fetchTopics();
        }
    };

    const handleDeleteTopic = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const res = await fetch(`http://localhost:5000/api/topics/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) {
            fetchTopics();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
                            My BrainBox
                        </h1>
                        <p className="text-gray-400">Welcome back, {user?.username}!</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </header>

                <form onSubmit={handleCreateTopic} className="mb-12 flex gap-4">
                    <input
                        type="text"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="Create a new topic..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newTopic.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all"
                    >
                        <Plus size={20} />
                        Add Topic
                    </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topics.map((topic) => (
                        <div
                            key={topic.id}
                            onClick={() => navigate(`/topic/${topic.id}`)}
                            className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl p-6 cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">
                                    {topic.title}
                                </h2>
                                <button
                                    onClick={(e) => handleDeleteTopic(topic.id, e)}
                                    className="text-gray-500 hover:text-red-400 p-1 rounded-full hover:bg-red-400/10 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="flex justify-end">
                                <ArrowRight className="text-gray-600 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
