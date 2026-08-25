// Firebase Error Handler - Converts Firebase technical errors to user-friendly messages

export const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error.code || error.message;
  
  // Authentication errors
  if (errorCode.includes('auth/configuration-not-found')) {
    return 'Authentication service is not configured. Please contact support.';
  }
  
  if (errorCode.includes('auth/invalid-email')) {
    return 'Invalid email address format.';
  }
  
  if (errorCode.includes('auth/user-disabled')) {
    return 'This account has been disabled. Please contact support.';
  }
  
  if (errorCode.includes('auth/user-not-found')) {
    return 'Email not registered. Please sign up first.';
  }
  
  if (errorCode.includes('auth/wrong-password')) {
    return 'Invalid credentials. Please check your email and password.';
  }
  
  if (errorCode.includes('auth/email-already-in-use')) {
    return 'Email already registered. Please use a different email or login.';
  }
  
  if (errorCode.includes('auth/weak-password')) {
    return 'Password is too weak. Please use a stronger password.';
  }
  
  if (errorCode.includes('auth/invalid-credential')) {
    return 'Invalid credentials. Please check your email and password.';
  }
  
  if (errorCode.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please try again later.';
  }
  
  if (errorCode.includes('auth/popup-closed-by-user')) {
    return 'Authentication was cancelled. Please try again.';
  }
  
  if (errorCode.includes('auth/network-request-failed')) {
    return 'Network error. Please check your internet connection.';
  }
  
  // Firestore errors
  if (errorCode.includes('firestore/permission-denied')) {
    return 'You do not have permission to access this data.';
  }
  
  if (errorCode.includes('firestore/not-found')) {
    return 'Data not found. It may have been deleted.';
  }
  
  if (errorCode.includes('firestore/unavailable')) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  // Storage errors
  if (errorCode.includes('storage/unauthorized')) {
    return 'You do not have permission to access this file.';
  }
  
  if (errorCode.includes('storage/canceled')) {
    return 'Upload was cancelled.';
  }
  
  if (errorCode.includes('storage/unknown')) {
    return 'An unknown error occurred. Please try again.';
  }
  
  // Generic fallback
  if (error.message) {
    // Try to extract a clean message from Firebase errors
    const cleanMessage = error.message
      .replace('Firebase: ', '')
      .replace(/\(auth\/[^)]+\)\.?/g, '')
      .replace(/\(firestore\/[^)]+\)\.?/g, '')
      .replace(/\(storage\/[^)]+\)\.?/g, '')
      .trim();
    
    if (cleanMessage && cleanMessage.length > 0) {
      return cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
    }
  }
  
  return 'An error occurred. Please try again.';
};