import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggle: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'pmd_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Theme;
        return saved || 'dark'; // Default to dark mode
    });

    useEffect(() => {
        console.log('Setting theme:', theme);
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    // Ensure theme is set on mount
    useEffect(() => {
        if (!document.documentElement.dataset.theme) {
            console.log('No theme found, setting to:', theme);
            document.documentElement.dataset.theme = theme;
        }
    }, [theme]);

    const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = (): ThemeContextType => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
    return ctx;
};
