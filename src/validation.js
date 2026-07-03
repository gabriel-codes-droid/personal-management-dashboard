// Shared form validation helpers for Login + Signup.
// Keep this file dependency-free so it can be used in either component.

// Email: simple, pragmatic — local@domain.tld with at least one dot in the domain.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Username: letters, spaces, hyphens, underscores, apostrophes. No digits, no symbols.
// Min 2 chars, max 32. Must start with a letter.
const USERNAME_RE = /^[A-Za-z][A-Za-z\s\-_']{1,31}$/;

export function validateUsername(value) {
    const v = (value || '').trim();
    if (v.length === 0) return 'Username is required.';
    if (v.length < 2) return 'Username must be at least 2 characters.';
    if (/\d/.test(v)) return 'Username cannot contain numbers.';
    if (!USERNAME_RE.test(v)) return 'Username can only contain letters, spaces, hyphens, underscores, and apostrophes.';
    return '';
}

export function validateEmail(value) {
    const v = (value || '').trim();
    if (v.length === 0) return 'Email is required.';
    if (!EMAIL_RE.test(v)) return 'Enter a valid email address (e.g. you@example.com).';
    return '';
}

// Password strength scoring: 0-4
// 1 = weak, 2 = fair, 3 = good, 4 = strong
// Rules: length, lowercase, uppercase, digit, symbol
export function passwordStrength(value) {
    const v = value || '';
    if (v.length === 0) return { score: 0, label: '—', issues: [] };
    const issues = [];
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

export function validatePassword(value) {
    const v = value || '';
    if (v.length === 0) return 'Password is required.';
    if (v.length < 6) return 'Password must be at least 6 characters.';
    return '';
}
