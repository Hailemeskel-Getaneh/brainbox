import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from './ConfirmationModal';
import { describe, it, expect, vi } from 'vitest';

describe('ConfirmationModal', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    it('should not render when isOpen is false', () => {
        render(
            <ConfirmationModal
                isOpen={false}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                title="Confirm"
                message="Are you sure?"
            />
        );
        expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                title="Confirm"
                message="Are you sure?"
            />
        );
        expect(screen.getByText('Confirm')).toBeInTheDocument();
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('should call onClose when the cancel button is clicked', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                title="Confirm"
                message="Are you sure?"
            />
        );
        fireEvent.click(screen.getByText('Cancel'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when the delete button is clicked', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                title="Confirm"
                message="Are you sure?"
            />
        );
        fireEvent.click(screen.getByText('Delete'));
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
});
