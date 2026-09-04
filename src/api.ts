import { mealOperations, Meal } from './firebaseDb';
import { activityOperations, Activity } from './firebaseDb';
import { transactionOperations, Transaction } from './firebaseDb';
import { savingsGoalOperations, SavingsGoal } from './firebaseDb';
import { trashOperations, TrashItem } from './firebaseDb';
import { analyticsOperations } from './firebaseAnalytics';

// Types matching the existing API
export interface User {
    _id: string;
    uid: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    banned: boolean;
    lastLogin: string;
    createdAt: string;
    profileImage?: string;
}

export interface AuthResponse {
    user: User;
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

export type { Meal, Activity, Transaction, SavingsGoal, TrashItem };

export const auth = {
    signup: async () => {
        throw new Error('Use AuthContext.signup instead');
    },
    login: async () => {
        throw new Error('Use AuthContext.login instead');
    },
    me: async () => {
        throw new Error('Use AuthContext instead');
    },
    checkEmail: async () => {
        const { checkEmailAvailability } = await import('./firebaseAuth');
        return await checkEmailAvailability();
    },
    checkUsername: async (username: string) => {
        const { checkUsernameAvailability } = await import('./firebaseAuth');
        return await checkUsernameAvailability(username);
    },
    forgotPassword: async (email: string) => {
        const { forgotPassword } = await import('./firebaseAuth');
        await forgotPassword(email);
    },
    verifyResetCode: async () => {
        throw new Error('Firebase uses email links for password reset');
    },
    resetPassword: async () => {
        throw new Error('Firebase uses email links for password reset');
    },
    updateProfileImage: async () => {
        throw new Error('Use AuthContext.updateProfile instead');
    },
    changePassword: async () => {
        throw new Error('Use AuthContext.updatePassword instead');
    },
};

export const meals = {
    list: async () => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await mealOperations.list(userId);
    },
    create: async (data: any) => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await mealOperations.create({ ...data, userId });
    },
    update: async (id: string, data: any) => {
        return await mealOperations.update(id, data);
    },
    remove: async (id: string) => {
        return await mealOperations.remove(id);
    },
};

export const transactions = {
    list: async () => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await transactionOperations.list(userId);
    },
    create: async (data: any) => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await transactionOperations.create({ ...data, userId });
    },
    update: async (id: string, data: any) => {
        return await transactionOperations.update(id, data);
    },
    remove: async (id: string) => {
        return await transactionOperations.remove(id);
    },
};

export const activities = {
    list: async () => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await activityOperations.list(userId);
    },
    create: async (data: any) => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await activityOperations.create({ ...data, userId });
    },
    update: async (id: string, data: any) => {
        return await activityOperations.update(id, data);
    },
    remove: async (id: string) => {
        return await activityOperations.remove(id);
    },
};

export const savingsGoals = {
    list: async () => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await savingsGoalOperations.list(userId);
    },
    create: async (data: { name: string; target: number; current?: number; deadline?: string }) => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await savingsGoalOperations.create({ 
            ...data, 
            userId,
            current: data.current || 0,
            deletedAt: undefined,
            _id: '', // Will be set by Firebase
        });
    },
    update: async (id: string, data: Partial<{ name: string; target: number; current: number; deadline: string }>) => {
        return await savingsGoalOperations.update(id, data);
    },
    remove: async (id: string) => {
        return await savingsGoalOperations.remove(id);
    },
};

export const trash = {
    list: async () => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await trashOperations.list(userId);
    },
    restore: async (type: TrashItem['itemType'], id: string) => {
        return await trashOperations.restore(type, id);
    },
    remove: async (type: TrashItem['itemType'], id: string) => {
        return await trashOperations.remove(type, id);
    },
    empty: async () => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await trashOperations.empty(userId);
    },
};

export const admin = {
    listUsers: async () => {
        throw new Error('Use client-side Firestore query in Admin component');
    },
    deleteUser: async (_id: string) => {
        throw new Error('Use client-side Firestore operations in Admin component');
    },
    setRole: async (_id: string, _role: 'user' | 'admin') => {
        throw new Error('Use client-side Firestore operations in Admin component');
    },
    banUser: async (_id: string, _banned: boolean) => {
        throw new Error('Use client-side Firestore operations in Admin component');
    },
    getUserStats: async (_id: string) => {
        throw new Error('Use client-side Firestore operations in Admin component');
    },
    getUserActivity: async (_id: string) => {
        throw new Error('Use client-side Firestore operations in Admin component');
    },
    stats: async () => {
        throw new Error('Use client-side Firestore operations in Admin component');
    },
    analytics: async () => {
        throw new Error('Use client-side Firestore operations in Admin component');
    },
};

export const analytics = {
    trackEvent: async (data: { eventType: string; page?: string; action?: string; metadata?: any }) => {
        const userId = localStorage.getItem('currentUserId') || '';
        await analyticsOperations.trackEvent({ ...data, userId });
    },
    getMyStats: async () => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await analyticsOperations.getMyStats(userId);
    },
    getDailyActivity: async (days?: number) => {
        const userId = localStorage.getItem('currentUserId') || '';
        return await analyticsOperations.getDailyActivity(userId, days);
    },
};

export default {};