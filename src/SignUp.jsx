import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './auth';
import { useTheme } from './theme';
import { validateUsername, validateEmail, validatePassword, passwordStrength } from './validation';

function Signup() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const { theme, toggle } = useTheme();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const pwStrength = passwordStrength(password);
    const confirmMismatch = confirm.length > 0 && password !== confirm;

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Re-run all validations at submit time so a "fresh" submit can't sneak past
        const errs = {};
        const uErr = validateUsername(username);
        if (uErr) errs.username = uErr;
        const eErr = validateEmail(email);
        if (eErr) errs.email = eErr;
        const pErr = validatePassword(password);
        if (pErr) errs.password = pErr;
        if (!confirm) errs.confirm = 'Please confirm your password.';
        else if (password !== confirm) errs.confirm = 'Passwords do not match.';
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoading(true);
        try {
            await signup(username.trim(), email.trim(), password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // On-blur live validation for clearer feedback
    const onUsernameBlur = () => setFieldErrors(f => ({ ...f, username: username ? validateUsername(username) : '' }));
    const onEmailBlur = () => setFieldErrors(f => ({ ...f, email: email ? validateEmail(email) : '' }));
    const onPasswordBlur = () => setFieldErrors(f => ({ ...f, password: password ? validatePassword(password) : '' }));
    const onConfirmBlur = () => {
        let msg = '';
        if (!confirm) msg = 'Please confirm your password.';
        else if (password !== confirm) msg = 'Passwords do not match.';
        setFieldErrors(f => ({ ...f, confirm: msg }));
    };

    // Reject digits from being typed into the username field at all.
    const onUsernameChange = (e) => {
        const filtered = e.target.value.replace(/[0-9]/g, '');
        setUsername(filtered);
        if (fieldErrors.username) setFieldErrors(f => ({ ...f, username: '' }));
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

                <div className="auth-title">Create your account</div>
                <div className="auth-sub">Sign up to start tracking your life.</div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={onSubmit} noValidate>
                    <div className="field mb-md">
                        <label>Username</label>
                        <input
                            className={'input' + (fieldErrors.username ? ' invalid' : '')}
                            type="text"
                            placeholder="Letters, spaces, hyphens, underscores only"
                            value={username}
                            onChange={onUsernameChange}
                            onBlur={onUsernameBlur}
                            required
                            autoComplete="username"
                            maxLength={32}
                        />
                        {fieldErrors.username
                            ? <div className="field-error">⚠ {fieldErrors.username}</div>
                            : <div className="pw-hints">No numbers. Letters, spaces, hyphens, underscores, apostrophes only.</div>
                        }
                    </div>
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
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: '' })); }}
                            onBlur={onPasswordBlur}
                            required
                            autoComplete="new-password"
                        />
                        <div className="pw-strength" data-score={pwStrength.score}>
                            <div className="pw-bars">
                                <span></span><span></span><span></span><span></span>
                            </div>
                            <div className="pw-label">{pwStrength.label}</div>
                        </div>
                        {password.length > 0 && pwStrength.issues.length > 0 && (
                            <div className="pw-hints">Add: {pwStrength.issues.join(', ')}.</div>
                        )}
                        {fieldErrors.password && <div className="field-error">⚠ {fieldErrors.password}</div>}
                    </div>
                    <div className="field mb-md">
                        <label>Confirm password</label>
                        <input
                            className={'input' + ((fieldErrors.confirm || confirmMismatch) ? ' invalid' : '')}
                            type="password"
                            placeholder="Repeat your password"
                            value={confirm}
                            onChange={e => { setConfirm(e.target.value); if (fieldErrors.confirm) setFieldErrors(f => ({ ...f, confirm: '' })); }}
                            onBlur={onConfirmBlur}
                            required
                            autoComplete="new-password"
                        />
                        {fieldErrors.confirm && <div className="field-error">⚠ {fieldErrors.confirm}</div>}
                    </div>
                    <button type="submit" className="btn primary auth-submit" disabled={loading}>
                        {loading ? <><span className="spinner" /> Creating account...</> : 'Create account'}
                    </button>
                </form>

                <div className="auth-switch">
                    Already have an account?
                    <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}

export default Signup;
