import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completion.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    default:
      return 'Authentication failed. Please try again.';
  }
}

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    const friendlyMsg = getFriendlyAuthErrorMessage(error.code || '');
    throw new Error(friendlyMsg);
  }
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && displayName.trim()) {
      await updateProfile(result.user, {
        displayName: displayName.trim(),
      }).catch(() => {});
    }
    return result.user;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    const friendlyMsg = getFriendlyAuthErrorMessage(error.code || '');
    throw new Error(friendlyMsg);
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    const friendlyMsg = getFriendlyAuthErrorMessage(error.code || '');
    throw new Error(friendlyMsg);
  }
}

export async function sendResetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    const friendlyMsg = getFriendlyAuthErrorMessage(error.code || '');
    throw new Error(friendlyMsg);
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Error signing out:', err);
    throw err;
  }
}
