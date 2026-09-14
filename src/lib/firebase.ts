import { getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInAnonymously,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA0ZP-w2Ma7IfgvwOF1d3R9fqLkRA4nQBI',
  authDomain: 'rozvrh-zop.firebaseapp.com',
  projectId: 'rozvrh-zop',
  messagingSenderId: '39586136448',
  appId: '1:39586136448:web:c765d32af1e23fcf978165',
  measurementId: 'G-4V8RXV8S5Q',
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function getFirebaseUserId() {
  const auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence);
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser.uid;
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

export async function initializeAnalytics() {
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    if (await isSupported()) getAnalytics(app);
  } catch {
    // Analytics is optional and unavailable in some privacy-focused browsers.
  }
}
