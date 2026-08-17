import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, User } from './api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    signup: (username: string, email: string, password: string) => Promise<User>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const raw = localStorage.getItem('pmd_user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('pmd_token'));
    const [loading, setLoading] = useState(true);

    // Validate token on mount
    useEffect(() => {
        let cancelled = false;
        // Safety timeout: never show loading spinner longer than 4s
        const maxLoad = setTimeout(() => { if (!cancelled) setLoading(false); }, 4000);
        (async () => {
            if (!token) {
                clearTimeout(maxLoad);
                setLoading(false);
                return;
            }
            try {
                const { user: fresh } = await authApi.me();
                if (!cancelled) setUser(fresh);
            } catch (error) {
                console.error('Auth validation failed:', error);
                if (!cancelled) {
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('pmd_token');
                    localStorage.removeItem('pmd_user');
                }
            } finally {
                clearTimeout(maxLoad);
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; clearTimeout(maxLoad); };
    }, [token]);

    const login = useCallback(async (email: string, password: string) => {
        const data = await authApi.login({ email, password });
        localStorage.setItem('pmd_token', data.token);
        localStorage.setItem('pmd_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const signup = useCallback(async (username: string, email: string, password: string) => {
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

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
