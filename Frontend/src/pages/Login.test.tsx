import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { describe, it, expect, vi } from 'vitest';

// Mock the entire AuthContext module
vi.mock('../context/AuthContext', () => ({
    AuthContext: {
        Provider: ({ children }) => children, // Render children directly
    },
    useAuth: () => ({
        user: null,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        isAuthenticated: false,
    }),
}));

// Mock the entire ThemeContext module
vi.mock('../context/ThemeContext', () => ({
    ThemeContext: {
        Provider: ({ children }) => children, // Render children directly
    },
    useTheme: () => ({
        theme: 'light',
        toggleTheme: vi.fn(),
    }),
}));


describe('Login', () => {
    it('should render the login form with email and password fields', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByTestId('login-form')).toBeInTheDocument();
        expect(screen.getByTestId('create-account-link')).toBeInTheDocument();
    });
});
