import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CaseStudy, PodcastEpisode, StudyPack, UserStats } from '../types/study';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId according to skill guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export type AuthErrorCategory =
  | 'domain'
  | 'popup'
  | 'cancelled'
  | 'network'
  | 'config'
  | 'account'
  | 'unknown';

export interface AuthErrorDetails {
  code: string;
  category: AuthErrorCategory;
  message: string;
  retryable: boolean;
  hostname?: string;
}

export function classifyFirebaseAuthError(error: any): AuthErrorDetails {
  const code = String(error?.code || '');
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  switch (code) {
    case 'auth/unauthorized-domain':
      return {
        code,
        category: 'domain',
        hostname,
        retryable: true,
        message: `Domain "${hostname || 'current host'}" is not authorized for Firebase Authentication yet. Add it under Firebase Console → Authentication → Settings → Authorized domains, then retry.`,
      };
    case 'auth/popup-blocked':
      return {
        code,
        category: 'popup',
        hostname,
        retryable: true,
        message:
          'Your browser or preview frame blocked the Google sign-in popup. Allow popups for this site or open the app in a full browser tab.',
      };
    case 'auth/popup-closed-by-user':
      return {
        code,
        category: 'cancelled',
        retryable: true,
        message: 'The Google sign-in window was closed before completing sign-in.',
      };
    case 'auth/cancelled-popup-request':
      return {
        code,
        category: 'cancelled',
        retryable: true,
        message: 'A sign-in popup request was superseded. Please try signing in again.',
      };
    case 'auth/network-request-failed':
    case 'auth/internal-error':
    case 'auth/too-many-requests':
      return {
        code,
        category: 'network',
        retryable: true,
        message:
          code === 'auth/too-many-requests'
            ? 'Too many sign-in attempts in a short window. Please wait a few seconds and retry.'
            : 'Network interruption while reaching Google Authentication. Please check your connection and retry.',
      };
    case 'auth/operation-not-allowed':
      return {
        code,
        category: 'config',
        retryable: false,
        message:
          'Google Sign-In provider is not enabled in Firebase Authentication Console for this project.',
      };
    case 'auth/operation-not-supported-in-this-environment':
      return {
        code,
        category: 'popup',
        hostname,
        retryable: true,
        message:
          'This embedded environment restricts third-party storage or popups. Open the app in a full browser tab to sign in.',
      };
    case 'auth/user-disabled':
    case 'auth/account-exists-with-different-credential':
      return {
        code,
        category: 'account',
        retryable: false,
        message: error?.message || 'This account cannot be used to sign in right now.',
      };
    default:
      return {
        code: code || 'auth/unknown',
        category: 'unknown',
        retryable: true,
        message:
          error?.message ||
          'Google sign-in could not be completed. Please try again.',
      };
  }
}

let persistenceInitialized = false;
async function ensureAuthPersistence(): Promise<void> {
  if (persistenceInitialized) return;
  try {
    await setPersistence(auth, browserLocalPersistence);
    persistenceInitialized = true;
  } catch {
    try {
      await setPersistence(auth, browserSessionPersistence);
      persistenceInitialized = true;
    } catch {
      try {
        await setPersistence(auth, inMemoryPersistence);
        persistenceInitialized = true;
      } catch {
        // Proceed with Firebase default persistence if all overrides fail
      }
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj as Record<string, any>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Connection test on boot (CRITICAL from skill specification)
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}

const TRANSIENT_AUTH_RETRY_CODES = new Set([
  'auth/network-request-failed',
  'auth/internal-error',
]);

let activeSignInPromise: Promise<User | null> | null = null;

// Auth actions (single-flight locked + transient network retry)
export async function signInWithGoogle(options?: {
  onRetryAttempt?: (attempt: number, maxAttempts: number) => void;
}): Promise<User | null> {
  if (activeSignInPromise) {
    return activeSignInPromise;
  }

  activeSignInPromise = (async () => {
    await ensureAuthPersistence();
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      } catch (error: any) {
        const code = String(error?.code || '');
        const shouldRetry =
          attempt < maxAttempts && TRANSIENT_AUTH_RETRY_CODES.has(code);

        if (shouldRetry) {
          options?.onRetryAttempt?.(attempt + 1, maxAttempts);
          await new Promise((resolve) => setTimeout(resolve, 450 * attempt));
          continue;
        }

        console.error('Google Sign-In Error:', code || error?.message);
        throw error;
      }
    }
    return null;
  })();

  try {
    return await activeSignInPromise;
  } finally {
    activeSignInPromise = null;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign Out Error:', error?.message);
  }
}

// Database Actions for StudyPacks
export async function saveStudyPackToFirestore(userId: string, pack: StudyPack): Promise<void> {
  const docPath = `users/${userId}/studyPacks/${pack.id}`;
  try {
    const dataToSave = stripUndefined({
      ...pack,
      ownerId: userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', userId, 'studyPacks', pack.id), dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteStudyPackFromFirestore(userId: string, packId: string): Promise<void> {
  const docPath = `users/${userId}/studyPacks/${packId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'studyPacks', packId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function loadStudyPacksFromFirestore(userId: string): Promise<StudyPack[]> {
  const colPath = `users/${userId}/studyPacks`;
  try {
    const snapshot = await getDocs(collection(db, 'users', userId, 'studyPacks'));
    const packs: StudyPack[] = [];
    snapshot.forEach((d) => {
      packs.push(d.data() as StudyPack);
    });
    return packs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

// Real-time Firestore subscription with mandatory error handling
export function subscribeToStudyPacks(
  userId: string,
  onUpdate: (packs: StudyPack[]) => void,
  onError?: (error: unknown) => void
) {
  const colPath = `users/${userId}/studyPacks`;
  return onSnapshot(
    collection(db, 'users', userId, 'studyPacks'),
    (snapshot) => {
      const packs: StudyPack[] = [];
      snapshot.forEach((d) => {
        packs.push(d.data() as StudyPack);
      });
      onUpdate(packs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, colPath);
      } catch (err) {
        if (onError) onError(err);
      }
    }
  );
}

// Database Actions for Case Studies
export async function saveCaseStudyToFirestore(userId: string, cs: CaseStudy): Promise<void> {
  const docPath = `users/${userId}/caseStudies/${cs.id}`;
  try {
    const dataToSave = stripUndefined({
      ...cs,
      ownerId: userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', userId, 'caseStudies', cs.id), dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteCaseStudyFromFirestore(userId: string, caseId: string): Promise<void> {
  const docPath = `users/${userId}/caseStudies/${caseId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'caseStudies', caseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export function subscribeToCaseStudies(
  userId: string,
  onUpdate: (cases: CaseStudy[]) => void,
  onError?: (error: unknown) => void
) {
  const colPath = `users/${userId}/caseStudies`;
  return onSnapshot(
    collection(db, 'users', userId, 'caseStudies'),
    (snapshot) => {
      const items: CaseStudy[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as CaseStudy);
      });
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, colPath);
      } catch (err) {
        if (onError) onError(err);
      }
    }
  );
}

// Database Actions for Podcasts
export async function savePodcastToFirestore(
  userId: string,
  podcast: PodcastEpisode
): Promise<void> {
  const docPath = `users/${userId}/podcasts/${podcast.id}`;
  try {
    const dataToSave = stripUndefined({
      ...podcast,
      ownerId: userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', userId, 'podcasts', podcast.id), dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deletePodcastFromFirestore(
  userId: string,
  podcastId: string
): Promise<void> {
  const docPath = `users/${userId}/podcasts/${podcastId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'podcasts', podcastId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export function subscribeToPodcasts(
  userId: string,
  onUpdate: (episodes: PodcastEpisode[]) => void,
  onError?: (error: unknown) => void
) {
  const colPath = `users/${userId}/podcasts`;
  return onSnapshot(
    collection(db, 'users', userId, 'podcasts'),
    (snapshot) => {
      const items: PodcastEpisode[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as PodcastEpisode);
      });
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, colPath);
      } catch (err) {
        if (onError) onError(err);
      }
    }
  );
}

// Database Actions for UserStats
export async function saveUserStatsToFirestore(userId: string, stats: UserStats): Promise<void> {
  const docPath = `users/${userId}/stats/overview`;
  try {
    await setDoc(doc(db, 'users', userId, 'stats', 'overview'), stripUndefined(stats));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function loadUserStatsFromFirestore(userId: string): Promise<UserStats | null> {
  const docPath = `users/${userId}/stats/overview`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'stats', 'overview'));
    if (snap.exists()) {
      return snap.data() as UserStats;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}
