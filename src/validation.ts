// Shared form validation helpers for Login + Signup.
// Keep this file dependency-free so it can be used in either component.

// Email: simple, pragmatic — local@domain.tld with at least one dot in the domain.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Username: letters and numbers only. No spaces, no symbols, no hyphens.
// Min 2 chars, max 32.
const USERNAME_RE = /^[A-Za-z0-9]{2,32}$/;

export interface PasswordStrength {
    score: number;
    label: string;
    issues: string[];
}

export function validateUsername(value: string): string {
    const v = (value || '').trim();
    if (v.length === 0) return 'Username is required.';
    if (v.length < 2) return 'Username must be at least 2 characters.';
    if (!USERNAME_RE.test(v)) return 'Username can only contain letters and numbers.';
    return '';
}

export function validateEmail(value: string): string {
    const v = (value || '').trim();
    if (v.length === 0) return 'Email is required.';
    if (!EMAIL_RE.test(v)) return 'Enter a valid email address (e.g. you@example.com).';
    return '';
}

// Password strength scoring: 0-4
// 1 = weak, 2 = fair, 3 = good, 4 = strong
// Rules: length, lowercase, uppercase, digit, symbol
export function passwordStrength(value: string): PasswordStrength {
    const v = value || '';
    if (v.length === 0) return { score: 0, label: '—', issues: [] };
    const issues: string[] = [];
    let score = 0;
    if (v.length >= 8) score++; else issues.push('at least 8 characters');
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++; else issues.push('uppercase and lowercase');
    if (/\d/.test(v)) score++; else issues.push('a number');
    if (/[^A-Za-z0-9]/.test(v)) score++; else issues.push('a symbol');
    // penalize too short even if it has variety
    if (v.length < 6) score = Math.max(0, score - 2);
    const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return { score, label: labels[score], issues };
}

export function validatePassword(value: string): string {
    const v = value || '';
    if (v.length === 0) return 'Password is required.';
    if (v.length < 6) return 'Password must be at least 6 characters.';
    return '';
}
