import { useContext } from 'react';
import type { ThemeContextType } from './types';
import { ThemeContext } from './theme-context'; // Import ThemeContext from the new theme-context file

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
