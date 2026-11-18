import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
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

// Auth actions
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error?.message);
    throw error;
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
