import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem('pmd_user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState(() => localStorage.getItem('pmd_token'));
    const [loading, setLoading] = useState(true);

    // Validate token on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const { user: fresh } = await authApi.me();
                if (!cancelled) setUser(fresh);
            } catch {
                if (!cancelled) {
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('pmd_token');
                    localStorage.removeItem('pmd_user');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [token]);

    const login = useCallback(async (email, password) => {
        const data = await authApi.login({ email, password });
        localStorage.setItem('pmd_token', data.token);
        localStorage.setItem('pmd_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const signup = useCallback(async (username, email, password) => {
        const data = await authApi.signup({ username, email, password });
        localStorage.setItem('pmd_token', data.token);
        localStorage.setItem('pmd_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('pmd_token');
        localStorage.removeItem('pmd_user');
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
