import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  onAuthStateChange, 
  signIn, 
  signUp, 
  signOut, 
  User,
  updateProfileImage,
  changePassword,
  forgotPassword,
  checkEmailAvailability,
  checkUsernameAvailability
} from './firebaseAuth';

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    signup: (username: string, email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
    updateProfile: (profileImage: string) => Promise<void>;
    updatePassword: (newPassword: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    checkEmail: (email: string) => Promise<boolean>;
    checkUsername: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const unsubscribe = onAuthStateChange(async (userData) => {
            if (!cancelled) {
                setUser(userData);
                setFirebaseUser(userData ? { uid: userData.uid, email: userData.email } as FirebaseUser : null);
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const userData = await signIn(email, password);
        setUser(userData);
        return userData;
    }, []);

    const signup = useCallback(async (username: string, email: string, password: string) => {
        const userData = await signUp(username, email, password);
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(async () => {
        await signOut();
        setUser(null);
        setFirebaseUser(null);
    }, []);

    const updateProfile = useCallback(async (profileImage: string) => {
        if (!user) throw new Error('No authenticated user');
        await updateProfileImage(user.uid, profileImage);
        setUser({ ...user, profileImage });
    }, [user]);

    const updatePassword = useCallback(async (newPassword: string) => {
        await changePassword(newPassword);
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        await forgotPassword(email);
    }, []);

    const checkEmail = useCallback(async (email: string) => {
        return await checkEmailAvailability(email);
    }, []);

    const checkUsername = useCallback(async (username: string) => {
        return await checkUsernameAvailability(username);
    }, []);

    return (
        <AuthContext.Provider value={{ 
            user, 
            firebaseUser,
            loading, 
            login, 
            signup, 
            logout,
            updateProfile,
            updatePassword,
            resetPassword,
            checkEmail,
            checkUsername
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};