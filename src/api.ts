import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    timeout: 15000,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('pmd_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        // 401 = expired/invalid token, 403 = banned mid-session (authRequired
        // rejects every request for a banned user) — both mean "kick to login".
        // A hard redirect (not just clearing storage) is needed here because
        // this interceptor runs outside the AuthContext component tree, so it
        // has no way to update the React `user`/`token` state directly —
        // without this, the UI would keep silently re-erroring forever.
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('pmd_token');
            localStorage.removeItem('pmd_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(err);
    }
);

// Types
export interface User {
    _id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    banned?: boolean;
    lastLogin?: string;
    createdAt: string;
    profileImage?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface Transaction {
    _id: string;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    createdAt: string;
    updatedAt: string;
}

export interface Meal {
    _id: string;
    title: string;
    calories: number;
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    source: 'manual' | 'api' | 'dish';
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugars?: number;
    sodium?: number;
    barcode?: string;
    brand?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Activity {
    _id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    done?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AppNotification {
    type: 'success' | 'warning' | 'danger' | 'info';
    icon: string;
    message: string;
    timestamp: string;
    read: boolean;
}

export interface AdminStats {
    totalUsers: number;
    totalTransactions: number;
    totalMeals: number;
    totalActivities: number;
}

export interface SavingsGoal {
    _id: string;
    name: string;
    target: number;
    current: number;
    deadline?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TrashItem {
    id: string;
    itemType: 'transaction' | 'meal' | 'activity';
    title: string;
    details?: string;
    deletedAt: string;
}

// API Methods
export const auth = {
    signup: (data: { username: string; email: string; password: string }) => 
        api.post<AuthResponse>('/auth/signup', data).then(r => r.data),
    login: (data: { email: string; password: string }) => 
        api.post<AuthResponse>('/auth/login', data).then(r => r.data),
    me: () => api.get<{ user: User }>('/auth/me').then(r => r.data),
    checkEmail: (email: string) => 
        api.get<{ available: boolean }>('/auth/check-email', { params: { email } }).then(r => r.data),
    checkUsername: (username: string) => 
        api.get<{ available: boolean }>('/auth/check-username', { params: { username } }).then(r => r.data),
    forgotPassword: (email: string) => 
        api.post('/auth/forgot-password', { email }).then(r => r.data),
    verifyResetCode: (email: string, code: string) => 
        api.post('/auth/verify-reset-code', { email, code }).then(r => r.data),
    resetPassword: (email: string, code: string, newPassword: string) => 
        api.post('/auth/reset-password', { email, code, newPassword }).then(r => r.data),
    updateProfileImage: (profileImage: string) => 
        api.put<{ user: User }>('/auth/profile-image', { profileImage }).then(r => r.data),
    changePassword: (currentPassword: string, newPassword: string) => 
        api.put('/auth/change-password', { currentPassword, newPassword }).then(r => r.data),
};

export const meals = {
    list: () => api.get<Meal[]>('/meals').then(r => r.data),
    create: (data: Omit<Meal, '_id' | 'createdAt' | 'updatedAt'>) => 
        api.post<Meal>('/meals', data).then(r => r.data),
    update: (id: string, data: Partial<Meal>) => 
        api.put<Meal>(`/meals/${id}`, data).then(r => r.data),
    remove: (id: string) => api.delete(`/meals/${id}`).then(r => r.data),
};

export const transactions = {
    list: () => api.get<Transaction[]>('/finances').then(r => r.data),
    create: (data: Omit<Transaction, '_id' | 'createdAt' | 'updatedAt'>) => 
        api.post<Transaction>('/finances', data).then(r => r.data),
    update: (id: string, data: Partial<Transaction>) => 
        api.put<Transaction>(`/finances/${id}`, data).then(r => r.data),
    remove: (id: string) => api.delete(`/finances/${id}`).then(r => r.data),
};

export const activities = {
    list: () => api.get<Activity[]>('/activities').then(r => r.data),
    create: (data: Omit<Activity, '_id' | 'createdAt' | 'updatedAt'>) => 
        api.post<Activity>('/activities', data).then(r => r.data),
    update: (id: string, data: Partial<Activity>) => 
        api.put<Activity>(`/activities/${id}`, data).then(r => r.data),
    remove: (id: string) => api.delete(`/activities/${id}`).then(r => r.data),
};

export const savingsGoals = {
    list: () => api.get<SavingsGoal[]>('/savings').then(r => r.data),
    create: (data: { name: string; target: number; current?: number; deadline?: string }) =>
        api.post<SavingsGoal>('/savings', data).then(r => r.data),
    update: (id: string, data: Partial<{ name: string; target: number; current: number; deadline: string }>) =>
        api.put<SavingsGoal>(`/savings/${id}`, data).then(r => r.data),
    remove: (id: string) => api.delete(`/savings/${id}`).then(r => r.data),
};

export const trash = {
    list: () => api.get<TrashItem[]>('/trash').then(r => r.data),
    restore: (type: TrashItem['itemType'], id: string) =>
        api.post(`/trash/${type}/${id}/restore`).then(r => r.data),
    remove: (type: TrashItem['itemType'], id: string) =>
        api.delete(`/trash/${type}/${id}`).then(r => r.data),
    empty: () => api.delete('/trash').then(r => r.data),
};

export const admin = {
    listUsers: () => api.get<User[]>('/admin/users').then(r => r.data),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then(r => r.data),
    setRole: (id: string, role: 'user' | 'admin') => 
        api.put(`/admin/users/${id}/role`, { role }).then(r => r.data),
    banUser: (id: string, banned: boolean) => 
        api.put(`/admin/users/${id}/ban`, { banned }).then(r => r.data),
    getUserStats: (id: string) => api.get(`/admin/users/${id}/stats`).then(r => r.data),
    getUserActivity: (id: string) => api.get(`/admin/users/${id}/activity`).then(r => r.data),
    stats: () => api.get<AdminStats>('/admin/stats').then(r => r.data),
    analytics: () => api.get('/admin/analytics').then(r => r.data),
};

export const analytics = {
    trackEvent: (data: { eventType: string; page?: string; action?: string; metadata?: any }) => 
        api.post('/analytics/track', data).then(r => r.data),
    getMyStats: () => api.get('/analytics/my-stats').then(r => r.data),
    getDailyActivity: (days?: number) => api.get(`/analytics/daily-activity?days=${days || 7}`).then(r => r.data),
};

export default api;
