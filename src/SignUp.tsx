import { useState, useEffect, FormEvent, type ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './auth';
import { useTheme } from './theme';
import { auth as authApi } from './api';
import { validateUsername, validateEmail, validatePassword, passwordStrength, PasswordStrength } from './validation';

type AvailabilityStatus = 'unknown' | 'checking' | 'available' | 'taken';

function Signup() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const { theme, toggle } = useTheme();

    const [usernameRaw, setUsernameRaw] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // availability: 'unknown' | 'checking' | 'available' | 'taken'
    const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>('unknown');
    const [usernameStatus, setUsernameStatus] = useState<AvailabilityStatus>('unknown');

    const pwStrength: PasswordStrength = passwordStrength(password);
    const confirmMismatch = confirm.length > 0 && password !== confirm;

    // Username: only letters and numbers allowed. Strip anything else,
    // and show a warning hint when the value contains invalid chars.
    const hasInvalidChars = usernameRaw.length > 0 && !/^[A-Za-z0-9]+$/.test(usernameRaw);
    const username = usernameRaw.replace(/[^A-Za-z0-9]/g, '');

    // Debounced live check for email availability
    useEffect(() => {
        const trimmed = email.trim();
        // reset if the field is empty or has a syntax problem
        if (!trimmed || !validateEmail(trimmed)) {
            setEmailStatus('unknown');
            return;
        }
        setEmailStatus('checking');
        const t = setTimeout(async () => {
            try {
                const { available } = await authApi.checkEmail(trimmed);
                setEmailStatus(available ? 'available' : 'taken');
            } catch {
                setEmailStatus('unknown');
            }
        }, 500);
        return () => clearTimeout(t);
    }, [email]);

    // Debounced live check for username availability
    useEffect(() => {
        const trimmed = username.trim();
        if (!trimmed || !validateUsername(trimmed)) {
            setUsernameStatus('unknown');
            return;
        }
        setUsernameStatus('checking');
        const t = setTimeout(async () => {
            try {
                const { available } = await authApi.checkUsername(trimmed);
                setUsernameStatus(available ? 'available' : 'taken');
            } catch {
                setUsernameStatus('unknown');
            }
        }, 500);
        return () => clearTimeout(t);
    }, [username]);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        // Re-run all validations at submit time so a "fresh" submit can't sneak past
        const errs: Record<string, string> = {};
        const uErr = validateUsername(username);
        if (uErr) errs.username = uErr;
        else if (usernameStatus === 'taken') errs.username = 'That username is already taken.';
        const eErr = validateEmail(email);
        if (eErr) errs.email = eErr;
        else if (emailStatus === 'taken') errs.email = 'This email is already registered. Try signing in instead.';
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
        } catch (err: any) {
            // Surface the backend's reason. axios error shape: err.response.data.message
            const serverMsg = err.response?.data?.message;
            const reason = serverMsg || err.message || 'Signup failed. Please try again.';
            setError(reason);
            // If the server pinpoints a field, mark it inline too
            const field = err.response?.data?.field;
            if (field === 'email' || field === 'username') {
                setFieldErrors(f => ({ ...f, [field]: reason }));
                if (field === 'email') setEmailStatus('taken');
                if (field === 'username') setUsernameStatus('taken');
            }
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

    const onUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsernameRaw(e.target.value);
        setFieldErrors(f => ({ ...f, username: '' }));
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

                {error && (
                    <div className="auth-error" role="alert">
                        <strong>Signup failed:</strong> {error}
                    </div>
                )}

                <form onSubmit={onSubmit} noValidate>
                    <div className="field mb-md">
                        <label>Username</label>
                        <input
                            className={'input' + (fieldErrors.username || usernameStatus === 'taken' ? ' invalid' : '')}
                            type="text"
                            placeholder="Letters and numbers only"
                            value={usernameRaw}
                            onChange={onUsernameChange}
                            onBlur={onUsernameBlur}
                            required
                            autoComplete="username"
                            maxLength={32}
                        />
                        {fieldErrors.username
                            ? <div className="field-error">⚠ {fieldErrors.username}</div>
                            : usernameStatus === 'taken'
                                ? <div className="field-error">⚠ That username is already taken.</div>
                                : usernameStatus === 'available'
                                    ? <div className="field-hint ok">✓ Username is available</div>
                                    : usernameStatus === 'checking'
                                        ? <div className="field-hint">Checking…</div>
                                        : hasInvalidChars
                                            ? <div className="field-hint warn">⚠ Only letters and numbers allowed.</div>
                                            : null
                        }
                    </div>
                    <div className="field mb-md">
                        <label>Email</label>
                        <input
                            className={'input' + (fieldErrors.email || emailStatus === 'taken' ? ' invalid' : '')}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(f => ({ ...f, email: '' })); }}
                            onBlur={onEmailBlur}
                            required
                            autoComplete="email"
                        />
                        {fieldErrors.email
                            ? <div className="field-error">⚠ {fieldErrors.email}</div>
                            : emailStatus === 'taken'
                                ? <div className="field-error">⚠ This email is already registered. <Link to="/login">Sign in?</Link></div>
                                : emailStatus === 'available'
                                    ? <div className="field-hint ok">✓ Email is available</div>
                                    : emailStatus === 'checking'
                                        ? <div className="field-hint">Checking…</div>
                                        : null
                        }
                    </div>
                    <div className="field mb-md">
                        <label>Password</label>
                        <div className="input-wrap">
                            <input
                                className={'input' + (fieldErrors.password ? ' invalid' : '')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: '' })); }}
                                onBlur={onPasswordBlur}
                                required
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="input-suffix"
                                onClick={() => setShowPassword(s => !s)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '🙈' : '👁'}
                            </button>
                        </div>
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
                        <div className="input-wrap">
                            <input
                                className={'input' + ((fieldErrors.confirm || confirmMismatch) ? ' invalid' : '')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Repeat your password"
                                value={confirm}
                                onChange={e => { setConfirm(e.target.value); if (fieldErrors.confirm) setFieldErrors(f => ({ ...f, confirm: '' })); }}
                                onBlur={onConfirmBlur}
                                required
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="input-suffix"
                                onClick={() => setShowPassword(s => !s)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '🙈' : '👁'}
                            </button>
                        </div>
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
