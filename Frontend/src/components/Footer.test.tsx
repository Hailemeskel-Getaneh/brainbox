import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { describe, it, expect } from 'vitest';

describe('Footer', () => {
    it('should render the footer with the current year and a link to the repository', () => {
        render(<Footer />);
        const currentYear = new Date().getFullYear();
        expect(screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'p' && content.startsWith(`© ${currentYear} BrainBox. All rights reserved.`)
        })).toBeInTheDocument();

        const link = screen.getByRole('link', { name: /GitHub/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://github.com/gemini-testing/brainbox');
    });

    it('should have a link that opens in a new tab', () => {
        render(<Footer />);
        const link = screen.getByRole('link', { name: /GitHub/i });
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
});
