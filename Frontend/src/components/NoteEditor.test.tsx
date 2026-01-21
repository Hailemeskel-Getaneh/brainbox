import { render, screen, fireEvent } from '@testing-library/react';
import NoteEditor from './NoteEditor';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

vi.mock('react-simplemde-editor', () => ({
    __esModule: true,
    default: (props: any) => {
        return <textarea data-testid="mock-simple-mde" value={props.value} onChange={(e) => props.onChange(e.target.value)} />;
    },
}));

describe('NoteEditor', () => {
    const mockOnSubmit = vi.fn((e) => e.preventDefault());
    const mockOnContentChange = vi.fn();
    const mockOnTagsChange = vi.fn();

    const renderEditor = (props: Partial<React.ComponentProps<typeof NoteEditor>> = {}) => {
        return render(
            <AuthProvider>
                <ThemeProvider>
                    <NoteEditor
                        submitting={false}
                        content=""
                        tags=""
                        onContentChange={mockOnContentChange}
                        onTagsChange={mockOnTagsChange}
                        onSubmit={mockOnSubmit}
                        buttonText="Submit"
                        {...props}
                    />
                </ThemeProvider>
            </AuthProvider>
        );
    };

    it('should render the editor and form elements', () => {
        renderEditor();
        expect(screen.getByText('Submit')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Add tags (comma-separated)')).toBeInTheDocument();
        expect(screen.getByTestId('mock-simple-mde')).toBeInTheDocument();
    });

    it('should call onContentChange when the content changes', () => {
        renderEditor();
        const editor = screen.getByTestId('mock-simple-mde');
        fireEvent.change(editor, { target: { value: 'new content' } });
        expect(mockOnContentChange).toHaveBeenCalledWith('new content');
    });

    it('should call onTagsChange when the tags input changes', () => {
        renderEditor();
        const tagsInput = screen.getByPlaceholderText('Add tags (comma-separated)');
        fireEvent.change(tagsInput, { target: { value: 'new, tags' } });
        expect(mockOnTagsChange).toHaveBeenCalledWith('new, tags');
    });

    it('should call onSubmit when the form is submitted', () => {
        renderEditor({ content: 'Test content' });
        fireEvent.click(screen.getByText('Submit'));
        expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should disable the submit button when content is empty', () => {
        renderEditor({ content: '' });
        expect(screen.getByText('Submit')).toBeDisabled();
    });

    it('should disable the submit button when submitting', () => {
        renderEditor({ submitting: true });
        expect(screen.getByText('Submit')).toBeDisabled();
    });
});
