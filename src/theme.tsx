import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggle: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'pmd_theme';
// Colors for the flash overlay (matches the CSS --bg-0 values in styles.css)
const LIGHT_BG = '#ffffff';
const DARK_BG = '#000000';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Theme;
        return saved || 'dark'; // Default to dark mode
    });

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    // Match body background to current theme immediately (avoids a frame of mismatch)
    useEffect(() => {
        document.body.style.backgroundColor = theme === 'dark' ? DARK_BG : LIGHT_BG;
        return () => { document.body.style.backgroundColor = ''; };
    }, [theme]);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        // Flash the incoming theme color briefly so the switch feels smooth,
        // then author the real theme change synchronously.
        const flash = document.createElement('div');
        flash.style.cssText = [
            'position:fixed;top:0;left:0;width:100%;height:0;',
            'background:', next === 'dark' ? DARK_BG : LIGHT_BG, ';',
            'z-index:9998;pointer-events:none;transition:height 0.35s ease;',
            'will-change:height;',
        ].join('');
        document.body.appendChild(flash);
        // ES2017+; project is configured for it (optional chaining used elsewhere).
        requestAnimationFrame(() => { flash.style.height = '100%'; });
        setTimeout(() => {
            setTheme(next);
            requestAnimationFrame(() => {
                flash.style.height = '0';
                setTimeout(() => {
                    flash.remove();
                }, 400);
            });
        }, 350);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return ctx;
}

