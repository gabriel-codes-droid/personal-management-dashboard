import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './auth';
import { useTheme } from './theme';
import { validateEmail } from './validation';
import { getFirebaseErrorMessage } from './firebaseErrorHandler';
import {
  Eye,
  EyeOff,
  AlertTriangle,
  Loader,
  Sun,
  Moon,
} from 'lucide-react';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { theme, toggle } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (!email.trim()) errors.email = 'Email is required';
        else if (!validateEmail(email.trim())) errors.email = 'Enter a valid email address';
        if (!password) errors.password = 'Password is required';
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await login(email.trim(), password);
            navigate('/');
        } catch (err: any) {
            setFieldErrors({ form: getFirebaseErrorMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <button className="theme-btn auth-theme-toggle" onClick={toggle} aria-label="Toggle theme" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
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
                <div className="auth-sub">Sign in to your account to continue</div>

                {fieldErrors.form && <div className="auth-error">{fieldErrors.form}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="field mb-md">
                        <label>Email</label>
                        <input
                            className={'input' + (fieldErrors.email ? ' invalid' : '')}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(f => ({ ...f, email: '' })); }}
                            required
                            autoComplete="email"
                        />
                        {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
                    </div>

                    <div className="field mb-md">
                        <label>Password</label>
                        <div className="input-wrap">
                            <input
                                className={'input' + (fieldErrors.password ? ' invalid' : '')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: '' })); }}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="input-suffix"
                                onClick={() => setShowPassword(s => !s)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {fieldErrors.password && <div className="field-error"><AlertTriangle size={14} className="inline mr-1" /> {fieldErrors.password}</div>}
                    </div>

                    <button type="submit" className="btn primary auth-submit" disabled={loading}>
                        {loading ? <><Loader size={14} className="inline mr-1 animate-spin" /> Signing in...</> : 'Sign in'}
                    </button>
                </form>

                <div className="auth-footer">
                    <span className="auth-link-muted">Don't have an account? </span>
                    <Link to="/signup" className="auth-link">Sign up</Link>
                    <span className="auth-link-muted"> | </span>
                    <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
