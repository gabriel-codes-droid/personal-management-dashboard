import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './auth';
import { useTheme } from './theme';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { theme, toggle } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email.trim(), password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <button className="theme-btn auth-theme-toggle" onClick={toggle} aria-label="Toggle theme" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? '☀' : '☾'}
            </button>
            <div className="auth-card">
                <div className="auth-brand">
                    <div className="logo">PMD</div>
                    <div className="name">
                        PMD
                        <span>Personal Management Dashboard</span>
                    </div>
                </div>

                <div className="auth-title">Welcome back</div>
                <div className="auth-sub">Sign in to access your dashboard.</div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={onSubmit}>
                    <div className="field mb-md">
                        <label>Email</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="field mb-md">
                        <label>Password</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="btn primary auth-submit" disabled={loading}>
                        {loading ? <><span className="spinner" /> Signing in...</> : 'Sign in'}
                    </button>
                </form>

                <div className="auth-switch">
                    No account?
                    <Link to="/signup">Create one</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
