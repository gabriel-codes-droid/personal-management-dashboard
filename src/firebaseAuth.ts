import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  getAuth
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase
const app = !getApps().length ? initializeApp({
  apiKey: "AIzaSyDd4ROtNet30GT3q--EkWLvrkS5Ozl7lsA",
  authDomain: "personal-management-dash-9b45a.firebaseapp.com",
  projectId: "personal-management-dash-9b45a",
  storageBucket: "personal-management-dash-9b45a.firebasestorage.app",
  messagingSenderId: "307938792813",
  appId: "1:307938792813:web:693ea7372306750002b664",
  measurementId: "G-ZY214MWF8F"
}) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

export interface User {
  uid: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  banned: boolean;
  lastLogin: string;
  createdAt: string;
  profileImage?: string;
}

// Create user document in Firestore
export const createUserDocument = async (user: FirebaseUser, username: string): Promise<User> => {
  const userRef = doc(db, 'users', user.uid);
  const userData: User = {
    uid: user.uid,
    email: user.email!,
    username,
    role: 'user',
    banned: false,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  
  await setDoc(userRef, userData);
  
  // Also create username index for uniqueness check
  const usernameRef = doc(db, 'usernames', username);
  await setDoc(usernameRef, { uid: user.uid });
  
  return userData;
};

// Get user document from Firestore
export const getUserDocument = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as User;
  }
  return null;
};

// Sign up with email and password
export const signUp = async (username: string, email: string, password: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const userData = await createUserDocument(userCredential.user, username);
  
  // Update Firebase auth profile
  await updateProfile(userCredential.user, { displayName: username });
  
  return userData;
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Update last login
  const userRef = doc(db, 'users', userCredential.user.uid);
  await updateDoc(userRef, { lastLogin: new Date().toISOString() });
  
  const userData = await getUserDocument(userCredential.user.uid);
  if (!userData) {
    throw new Error('User document not found');
  }
  
  if (userData.banned) {
    await firebaseSignOut(auth);
    throw new Error('Account banned. Contact support.');
  }
  
  return userData;
};

// Sign out
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Check email availability
export const checkEmailAvailability = async (): Promise<boolean> => {
  // Firebase Auth doesn't have a direct check-email endpoint
  // We'll assume email is available and handle duplicates during signup
  return true;
};

// Check username availability
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  // Query Firestore for existing username in users collection
  try {
    const usernameRef = doc(db, 'usernames', username);
    const userSnap = await getDoc(usernameRef);
    return !userSnap.exists();
  } catch (error) {
    console.error('Error checking username:', error);
    return true; // Default to available on error
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userData = await getUserDocument(firebaseUser.uid);
      callback(userData);
    } else {
      callback(null);
    }
  });
};

// Update profile image
export const updateProfileImage = async (uid: string, profileImage: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { profileImage });
};

// Change password
export const changePassword = async (newPassword: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }
  await updatePassword(currentUser, newPassword);
};

// Send password reset email
export const forgotPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};