import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './api';
import { useTheme } from './theme';
import { validateEmail, validatePassword, passwordStrength } from './validation';

type Step = 'email' | 'code' | 'password' | 'done';

function ForgotPassword() {
    const navigate = useNavigate();
    const { theme, toggle } = useTheme();

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const strength = passwordStrength(password);

    const submitEmail = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const emailErr = validateEmail(email);
        if (emailErr) return setError(emailErr);

        setLoading(true);
        try {
            await auth.forgotPassword(email.trim());
            // Deliberately generic either way — the backend doesn't reveal
            // whether the email exists, so neither should this UI.
            setStep('code');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const submitCode = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (code.trim().length !== 6) {
            return setError('Enter the 6-digit code from your email.');
        }

        setLoading(true);
        try {
            await auth.verifyResetCode(email.trim(), code.trim());
            setStep('password');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired code.');
        } finally {
            setLoading(false);
        }
    };

    const submitPassword = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const passErr = validatePassword(password);
        if (passErr) return setError(passErr);
        if (password !== confirmPassword) return setError('Passwords do not match.');

        setLoading(true);
        try {
            await auth.resetPassword(email.trim(), code.trim(), password);
            setStep('done');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
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

                {step === 'email' && (
                    <>
                        <div className="auth-title">Reset your password</div>
                        <div className="auth-sub">Enter your account email and we'll send you a reset code.</div>
                        {error && <div className="auth-error">{error}</div>}
                        <form onSubmit={submitEmail} noValidate>
                            <div className="field mb-md">
                                <label>Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                    autoFocus
                                    required
                                />
                            </div>
                            <button type="submit" className="btn primary auth-submit" disabled={loading}>
                                {loading ? <><span className="spinner" /> Sending...</> : 'Send reset code'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'code' && (
                    <>
                        <div className="auth-title">Check your email</div>
                        <div className="auth-sub">
                            If an account exists for <strong>{email}</strong>, a 6-digit code was sent. It expires in 15 minutes.
                        </div>
                        {error && <div className="auth-error">{error}</div>}
                        <form onSubmit={submitCode} noValidate>
                            <div className="field mb-md">
                                <label>Reset code</label>
                                <input
                                    className="input"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="123456"
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                    autoFocus
                                    required
                                    style={{ letterSpacing: 4, fontSize: 20, textAlign: 'center' }}
                                />
                            </div>
                            <button type="submit" className="btn primary auth-submit" disabled={loading}>
                                {loading ? <><span className="spinner" /> Verifying...</> : 'Verify code'}
                            </button>
                        </form>
                        <div className="auth-switch">
                            <button type="button" className="btn ghost sm" onClick={() => setStep('email')}>
                                ← Use a different email
                            </button>
                        </div>
                    </>
                )}

                {step === 'password' && (
                    <>
                        <div className="auth-title">Set a new password</div>
                        <div className="auth-sub">Choose a new password for your account.</div>
                        {error && <div className="auth-error">{error}</div>}
                        <form onSubmit={submitPassword} noValidate>
                            <div className="field mb-md">
                                <label>New password</label>
                                <div className="input-wrap">
                                    <input
                                        className="input"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        autoFocus
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="input-suffix"
                                        onClick={() => setShowPassword(s => !s)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? '🙈' : '👁'}
                                    </button>
                                </div>
                                {password && (
                                    <div className="pw-strength" data-score={strength.score}>
                                        <div className="pw-bars">
                                            <span></span><span></span><span></span><span></span>
                                        </div>
                                        <div className="pw-label">{strength.label}</div>
                                    </div>
                                )}
                            </div>
                            <div className="field mb-md">
                                <label>Confirm new password</label>
                                <input
                                    className="input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn primary auth-submit" disabled={loading}>
                                {loading ? <><span className="spinner" /> Resetting...</> : 'Reset password'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'done' && (
                    <>
                        <div className="auth-title">Password updated</div>
                        <div className="auth-sub">Your password has been reset. You can now sign in with your new password.</div>
                        <button className="btn primary auth-submit" onClick={() => navigate('/login', { replace: true })}>
                            Go to sign in
                        </button>
                    </>
                )}

                {step !== 'done' && (
                    <div className="auth-switch">
                        Remembered your password?
                        <Link to="/login">Sign in</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
