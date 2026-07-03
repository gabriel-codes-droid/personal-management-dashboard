import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './auth';
import { useTheme } from './theme';
import { validateEmail } from './validation';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { theme, toggle } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // block submission if any field is empty or invalid
    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const errs = {};
        const emailErr = validateEmail(email);
        if (emailErr) errs.email = emailErr;
        if (!password) errs.password = 'Password is required.';
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;

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

    // live-validate on blur for nicer UX
    const onEmailBlur = () => {
        const msg = email ? validateEmail(email) : '';
        setFieldErrors(f => ({ ...f, email: msg }));
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

                <form onSubmit={onSubmit} noValidate>
                    <div className="field mb-md">
                        <label>Email</label>
                        <input
                            className={'input' + (fieldErrors.email ? ' invalid' : '')}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(f => ({ ...f, email: '' })); }}
                            onBlur={onEmailBlur}
                            required
                            autoComplete="email"
                        />
                        {fieldErrors.email && <div className="field-error">⚠ {fieldErrors.email}</div>}
                    </div>
                    <div className="field mb-md">
                        <label>Password</label>
                        <input
                            className={'input' + (fieldErrors.password ? ' invalid' : '')}
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: '' })); }}
                            required
                            autoComplete="current-password"
                        />
                        {fieldErrors.password && <div className="field-error">⚠ {fieldErrors.password}</div>}
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
