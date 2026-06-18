/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  initializeFirestore 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

import firebaseConfig from '../../firebase-applet-config.json';
import { MemoryMedia, Song, Chapter } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Initialize Storage
const storage = getStorage(app);

const ADMIN_EMAIL = 'satyam000108@gmail.com';

export interface AlbumState {
  mediaItems: MemoryMedia[];
  chapters: Chapter[];
  songs: Song[];
  friendshipDate: string; // ISO String or Date
}

/**
 * Validates if the authenticated email is Satyam (Owner)
 */
export function isOwnerEmail(email: string | null): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Handle administrative email/password login
 */
export async function loginWithEmail(password: string): Promise<User> {
  // We use ADMIN_EMAIL and the custom passcode (e.g., the default from indexedDb is '1911') 
  // Let's authenticate through Firebase Authentication or fallback gracefully if not found.
  // Note: Since the admin account sits in Firebase Auth, Satyam can use standard sign-in,
  // or we can authenticate him as admin.
  try {
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
    if (!isOwnerEmail(userCredential.user.email)) {
      await signOut(auth);
      throw new Error('Access Denied: Only Satyam can access the admin settings.');
    }
    return userCredential.user;
  } catch (err: any) {
    throw new Error(err.message || 'Authentication failed');
  }
}

/**
 * Handle Google Single Sign-On
 */
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    if (!isOwnerEmail(userCredential.user.email)) {
      await signOut(auth);
      throw new Error('Access Denied: Only Satyam is permitted to use the Admin Panel.');
    }
    return userCredential.user;
  } catch (err: any) {
    throw new Error(err.message || 'Google Authentication failed');
  }
}

/**
 * Logs out of administration session
 */
export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Fetches the published public scrapbook state (Visible to Sonakshi & viewers)
 */
export async function fetchPublishedState(): Promise<AlbumState | null> {
  try {
    const docRef = doc(db, 'scrapbook', 'published');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AlbumState;
    }
  } catch (err) {
    console.error('Error fetching published state from Firestore:', err);
  }
  return null;
}

/**
 * Fetches the active administrative draft state (Where changes are staged)
 */
export async function fetchDraftState(): Promise<AlbumState | null> {
  try {
    const docRef = doc(db, 'scrapbook', 'draft');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AlbumState;
    }
  } catch (err) {
    console.error('Error fetching draft state from Firestore:', err);
  }
  return null;
}

/**
 * Stages changes into the administration draft registry
 */
export async function saveDraftState(state: AlbumState): Promise<void> {
  try {
    const docRef = doc(db, 'scrapbook', 'draft');
    await setDoc(docRef, state);
  } catch (err) {
    console.error('Error staging draft changes in Firestore:', err);
    throw err;
  }
}

/**
 * Synchronizes staged changes directly to the public live scrapbook view
 */
export async function publishState(state: AlbumState): Promise<void> {
  try {
    // 1. Update draft
    await setDoc(doc(db, 'scrapbook', 'draft'), state);
    // 2. Overwrite published
    await setDoc(doc(db, 'scrapbook', 'published'), state);
  } catch (err) {
    console.error('Error publishing live changes in Firestore:', err);
    throw err;
  }
}

/**
 * Uploads a raw media attachment to Firebase Cloud Storage, returning the persistent asset URL
 */
export async function uploadMediaFile(
  file: File, 
  onProgress?: (percent: number) => void
): Promise<string> {
  const fileId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const storageRef = ref(storage, `scrapbook_uploads/${fileId}`);
  
  try {
    // Standard upload
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.error('Storage upload failed:', err);
    throw new Error('Could not upload image/video to Firebase Storage.');
  }
}

export { auth, db, storage };
