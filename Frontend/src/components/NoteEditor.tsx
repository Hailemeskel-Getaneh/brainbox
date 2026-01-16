import { useState, useMemo } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import { Loader2, Plus } from 'lucide-react';
import { useTheme } from '../context/useTheme';

interface NoteEditorProps {
    submitting: boolean;
    content: string;
    tags: string;
    onContentChange: (value: string) => void;
    onTagsChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    buttonText: string;
}

const NoteEditor = ({ submitting, content, tags, onContentChange, onTagsChange, onSubmit, buttonText }: NoteEditorProps) => {
    const { theme } = useTheme();
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [tagSuggestions] = useState<string[]>([]);

    const editorOptions = useMemo(() => ({
        theme: theme === 'light' ? 'light' : 'dark',
    }), [theme]);

    return (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <SimpleMDE value={content} onChange={onContentChange} options={editorOptions} />
                <input
                    type="text"
                    placeholder="Add tags (comma-separated)"
                    value={tags}
                    onChange={(e) => onTagsChange(e.target.value)}
                    onFocus={() => setShowTagSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 100)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 max-h-48 overflow-y-auto">
                        {tagSuggestions
                            .filter(
                                (tag) =>
                                    tag.toLowerCase().includes(tags.split(',').pop()?.trim().toLowerCase() || '') &&
                                    !(tags.split(',').map(t => t.trim()).includes(tag))
                            )
                            .map((tag) => (
                                <div
                                    key={tag}
                                    onMouseDown={() => {
                                        const currentTags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
                                        currentTags.pop();
                                        onTagsChange([...currentTags, tag].join(', ') + ', ');
                                        setShowTagSuggestions(false);
                                    }}
                                    className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    {tag}
                                </div>
                            ))}
                    </div>
                )}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting || !content.trim()}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-white"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        {buttonText}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default NoteEditor;