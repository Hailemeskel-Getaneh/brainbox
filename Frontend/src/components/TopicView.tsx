import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

interface Note {
    id: number;
    content: string;
    created_at: string;
}

const TopicView = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        fetchNotes();
    }, [topicId]);

    const fetchNotes = async () => {
        const res = await fetch(`http://localhost:5000/api/notes/${topicId}`);
        if (res.ok) {
            const data = await res.json();
            setNotes(data);
        }
    };

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        const res = await fetch(`http://localhost:5000/api/notes/${topicId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newNote }),
        });

        if (res.ok) {
            setNewNote('');
            fetchNotes();
        }
    };

    const handleDeleteNote = async (id: number) => {
        const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            fetchNotes();
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50 min-h-[600px] flex flex-col">
                    <div className="flex-1 space-y-4 mb-6 overflow-y-auto custom-scrollbar">
                        {notes.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500 italic">
                                No notes yet. Start typing below!
                            </div>
                        ) : (
                            notes.map((note) => (
                                <div key={note.id} className="group flex gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all">
                                    <div className="flex-1 whitespace-pre-wrap">{note.content}</div>
                                    <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleCreateNote} className="relative">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCreateNote(e);
                                }
                            }}
                            placeholder="Type a note..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                        />
                        <button
                            type="submit"
                            disabled={!newNote.trim()}
                            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TopicView;
