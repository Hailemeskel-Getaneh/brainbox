import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { describe, it, expect } from 'vitest';

describe('Footer', () => {
    it('should render the footer with the current year', () => {
        render(<Footer />);
        const currentYear = new Date().getFullYear();
        expect(screen.getByText(`© ${currentYear} BrainBox. All rights reserved.`)).toBeInTheDocument();
    });
});
