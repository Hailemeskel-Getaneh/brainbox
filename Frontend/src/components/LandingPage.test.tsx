import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from './LandingPage';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LandingPage', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'ok' }),
        });
    });

    it('should render the landing page and show online status', async () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        const heading = screen.getByRole('heading', { name: /BrainBox/i });
        expect(heading).toBeInTheDocument();
        expect(screen.getByText('The next generation of cognitive computing.')).toBeInTheDocument();
        expect(screen.getByText('Get Started')).toBeInTheDocument();
        expect(screen.getByText('Learn More')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('ONLINE')).toBeInTheDocument();
        });
    });
});
