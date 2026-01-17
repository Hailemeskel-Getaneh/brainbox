import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Trash2, Pencil } from 'lucide-react';
import type { NoteType } from './TopicView';

interface NoteProps {
    note: NoteType;
    onDelete: (id: number) => void;
    onEdit: (id: number, content: string, tags: string) => void;
}

const Note = ({ note, onDelete, onEdit }: NoteProps) => {
    return (
        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {note.content}
            </ReactMarkdown>
            <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Tags:</p>
                {note.tags && note.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {note.tags.map((tag: string, index: number) => (
                            <span key={index} className="bg-blue-500 text-white dark:bg-blue-600 text-xs px-3 py-1 rounded-full hover:ring-2 hover:ring-blue-400 transition cursor-default">
                                {tag}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No tags.</p>
                )}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-400 dark:text-gray-500 mt-2">
                <span>{new Date(note.created_at).toLocaleString()}</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => onDelete(note.id)}
                        aria-label="Delete note"
                        className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-400/10"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        onClick={() => onEdit(note.id, note.content, note.tags?.join(', ') || '')}
                        aria-label="Edit note"
                        className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 p-1 rounded-full hover:bg-blue-400/10"
                    >
                        <Pencil size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Note;