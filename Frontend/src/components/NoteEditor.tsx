import { useState, useMemo, useEffect } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import { Loader2, Plus } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { useAuth } from '../context/AuthContext'; // Import useAuth

interface NoteEditorProps {
    submitting: boolean;
    content: string;
    tags: string;
    onContentChange: (value: string) => void;
    onTagsChange: (value: string | ((prevTags: string) => string)) => void; // Updated type for functional updates
    onSubmit: (e: React.FormEvent) => void;
    buttonText: string;
    onCancel?: () => void; // Optional onCancel prop
    isComplete?: boolean; // New: isComplete field
    onIsCompleteChange?: (isComplete: boolean) => void; // New: onIsCompleteChange handler
}

const NoteEditor = ({ submitting, content, tags, onContentChange, onTagsChange, onSubmit, buttonText, onCancel }: NoteEditorProps) => {
    const { theme } = useTheme();
    const { token } = useAuth(); // Use useAuth to get the token
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [allUserTags, setAllUserTags] = useState<string[]>([]); // Moved declaration here

    const editorOptions = useMemo(() => ({
        theme: theme === 'light' ? 'light' : 'dark',
    }), [theme]);

    const tagSuggestions = useMemo(() => {
        const currentTags = tags.split(',').map(t => t.trim());
        const lastTag = currentTags[currentTags.length - 1] || '';
        if (!lastTag) return [];

        return allUserTags.filter((tag: string) =>
            tag.toLowerCase().startsWith(lastTag.toLowerCase()) &&
            !currentTags.includes(tag)
        );
    }, [tags, allUserTags]);

    // Fetch all unique tags for suggestions
    useEffect(() => {
        const fetchAllTags = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'}/api/tags/suggestions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch tags');
                const data = await res.json();
                setAllUserTags(data);
            } catch (error: unknown) { // Use unknown for error type
                console.error('Error fetching all tags:', error);
            }
        };
        fetchAllTags();
    }, [token]);

    return (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                {onIsCompleteChange && (
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="isComplete"
                            checked={isComplete || false}
                            onChange={(e) => onIsCompleteChange(e.target.checked)}
                            className="h-4 w-4 text-blue-600 dark:text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="isComplete" className="text-gray-700 dark:text-gray-300">Mark as Complete</label>
                    </div>
                )}
                <SimpleMDE value={content} onChange={onContentChange} options={editorOptions} />
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Add tags (comma-separated)"
                        value={tags}
                        onChange={(e) => onTagsChange(e.target.value)}
                        onFocus={() => setShowTagSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowTagSuggestions(false), 100)} // Delay hiding to allow click on suggestion
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    {showTagSuggestions && tagSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                            {tagSuggestions.map((tag: string) => (
                                <div
                                    key={tag}
                                    onMouseDown={(e) => { // Use onMouseDown to prevent blur event from input
                                        e.preventDefault();
                                        const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
                                        currentTags.pop(); // Remove the partial tag
                                        onTagsChange([...currentTags, tag].join(', ') + ', ');
                                        setShowTagSuggestions(false);
                                    }}
                                    className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white"
                                >
                                    {tag}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        >
                            Cancel
                        </button>
                    )}
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