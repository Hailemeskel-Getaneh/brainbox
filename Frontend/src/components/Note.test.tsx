import { render, screen, fireEvent } from '@testing-library/react';
import Note from './Note';
import { describe, it, expect, vi } from 'vitest';
import { NoteType } from './TopicView';

describe('Note', () => {
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnToggleComplete = vi.fn();

    const note: NoteType = {
        id: 1,
        content: 'Test note',
        tags: ['tag1', 'tag2'],
        is_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        topic_id: 1,
    };

    it('should render the note content', () => {
        render(<Note note={note} onDelete={mockOnDelete} onEdit={mockOnEdit} onToggleComplete={mockOnToggleComplete} />);
        expect(screen.getByText('Test note')).toBeInTheDocument();
        expect(screen.getByText('tag1')).toBeInTheDocument();
        expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('should call onDelete when the delete button is clicked', () => {
        render(<Note note={note} onDelete={mockOnDelete} onEdit={mockOnEdit} onToggleComplete={mockOnToggleComplete} />);
        fireEvent.click(screen.getByLabelText('Delete note'));
        expect(mockOnDelete).toHaveBeenCalledWith(1);
    });

    it('should call onEdit when the edit button is clicked', () => {
        render(<Note note={note} onDelete={mockOnDelete} onEdit={mockOnEdit} onToggleComplete={mockOnToggleComplete} />);
        fireEvent.click(screen.getByLabelText('Edit note'));
        expect(mockOnEdit).toHaveBeenCalledWith(1, 'Test note', 'tag1, tag2', false);
    });

    it('should call onToggleComplete when the checkbox is clicked', () => {
        render(<Note note={note} onDelete={mockOnDelete} onEdit={mockOnEdit} onToggleComplete={mockOnToggleComplete} />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(mockOnToggleComplete).toHaveBeenCalledWith(1, true);
    });

    it('should have opacity and line-through when the note is complete', () => {
        const completedNote = { ...note, is_complete: true };
        const { container } = render(<Note note={completedNote} onDelete={mockOnDelete} onEdit={mockOnEdit} onToggleComplete={mockOnToggleComplete} />);
        expect(container.firstChild).toHaveClass('opacity-70');
        expect(screen.getByText('Test note').parentElement).toHaveClass('line-through');
    });
});
