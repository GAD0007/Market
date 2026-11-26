import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
}

export const BOOTSTRAPPED_ADMIN_EMAIL = 'ojimbaejike@gmail.com';

function toUser(user: FirebaseUser): User {
  return { uid: user.uid, email: user.email || '', displayName: user.displayName, emailVerified: user.emailVerified };
}

function friendlyAuthError(error: unknown): Error {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/weak-password': 'Use a stronger password with at least 8 characters.',
  };
  return new Error(messages[code] || (error instanceof Error ? error.message : 'Authentication failed.'));
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    return toUser((await signInWithEmailAndPassword(auth, email.trim(), password)).user);
  } catch (error) {
    throw friendlyAuthError(error);
  }
}

export async function registerAccount(displayName: string, email: string, password: string): Promise<User> {
  if (displayName.trim().length < 2) throw new Error('Enter your full name.');
  if (password.length < 8) throw new Error('Password must contain at least 8 characters.');
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(credential.user, { displayName: displayName.trim() });
    await sendEmailVerification(credential.user);
    return toUser(credential.user);
  } catch (error) {
    throw friendlyAuthError(error);
  }
}

export async function signOutUser(): Promise<void> { await signOut(auth); }

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (firebaseUser) => callback(firebaseUser ? toUser(firebaseUser) : null));
}

export async function checkIsAdminUser(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  if (user.emailVerified && user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) return true;
  try { return (await getDoc(doc(db, 'adminGrants', user.uid))).exists(); } catch { return false; }
}

export async function testApiConnection(): Promise<boolean> {
  try { await getDoc(doc(db, 'storefront', 'config')); return true; } catch { return false; }
}
