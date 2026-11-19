import { CaseStudy, PodcastEpisode, StudyPack, UserStats } from '../types/study';

const DB_NAME = 'ai_studymate_offline_v1';
const DB_VERSION = 1;

const STORES = {
  PACKS: 'study_packs',
  CASES: 'case_studies',
  PODCASTS: 'podcasts',
  META: 'metadata',
} as const;

export interface QueuedSyncOp {
  id: string;
  userId: string;
  type:
    | 'upsert_pack'
    | 'delete_pack'
    | 'upsert_case'
    | 'delete_case'
    | 'upsert_podcast'
    | 'delete_podcast'
    | 'save_stats';
  payload: any;
  queuedAt: string;
}

export interface OfflineSnapshot {
  packs: StudyPack[];
  caseStudies: CaseStudy[];
  podcasts: PodcastEpisode[];
  stats: UserStats | null;
  lastCachedAt: string | null;
  pendingOps: QueuedSyncOp[];
}

export function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.indexedDB);
}

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.PACKS)) {
        db.createObjectStore(STORES.PACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CASES)) {
        db.createObjectStore(STORES.CASES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PODCASTS)) {
        db.createObjectStore(STORES.PODCASTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open offline IndexedDB'));
  });
}

async function replaceStoreItems<T extends { id: string }>(
  storeName: string,
  items: T[]
): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  let db: IDBDatabase | null = null;
  try {
    db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db!.transaction([storeName, STORES.META], 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      for (const item of items) {
        if (item && item.id) {
          store.put(item);
        }
      }
      tx.objectStore(STORES.META).put({
        key: 'last_cached_at',
        value: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`Failed syncing store "${storeName}" to IndexedDB:`, err);
  } finally {
    db?.close();
  }
}

async function readAllFromStore<T>(storeName: string): Promise<T[]> {
  if (!isIndexedDbAvailable()) return [];
  let db: IDBDatabase | null = null;
  try {
    db = await openOfflineDb();
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db!.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Failed reading store "${storeName}" from IndexedDB:`, err);
    return [];
  } finally {
    db?.close();
  }
}

async function writeMetaValue(key: string, value: any): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  let db: IDBDatabase | null = null;
  try {
    db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db!.transaction(STORES.META, 'readwrite');
      tx.objectStore(STORES.META).put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`Failed writing metadata key "${key}" to IndexedDB:`, err);
  } finally {
    db?.close();
  }
}

async function readMetaValue<T = any>(key: string): Promise<T | null> {
  if (!isIndexedDbAvailable()) return null;
  let db: IDBDatabase | null = null;
  try {
    db = await openOfflineDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db!.transaction(STORES.META, 'readonly');
      const req = tx.objectStore(STORES.META).get(key);
      req.onsuccess = () => resolve(req.result ? (req.result.value as T) : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  } finally {
    db?.close();
  }
}

export async function saveAllStudyPacksToIdb(packs: StudyPack[]): Promise<void> {
  await replaceStoreItems(STORES.PACKS, packs);
}

export async function saveAllCaseStudiesToIdb(cases: CaseStudy[]): Promise<void> {
  await replaceStoreItems(STORES.CASES, cases);
}

export async function saveAllPodcastsToIdb(episodes: PodcastEpisode[]): Promise<void> {
  await replaceStoreItems(STORES.PODCASTS, episodes);
}

export async function saveStatsToIdb(stats: UserStats): Promise<void> {
  await writeMetaValue('user_stats', stats);
}

export async function enqueuePendingSyncOp(op: Omit<QueuedSyncOp, 'id' | 'queuedAt'>): Promise<QueuedSyncOp[]> {
  const existing = (await readMetaValue<QueuedSyncOp[]>('pending_cloud_sync')) || [];
  // Deduplicate identical entity operations so only latest mutation is queued
  const opTargetKey = `${op.userId}:${op.type}:${op.payload?.id || ''}`;
  const filtered = existing.filter((item) => {
    const itemKey = `${item.userId}:${item.type}:${item.payload?.id || ''}`;
    return itemKey !== opTargetKey;
  });
  const next: QueuedSyncOp[] = [
    ...filtered,
    {
      ...op,
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      queuedAt: new Date().toISOString(),
    },
  ];
  await writeMetaValue('pending_cloud_sync', next);
  return next;
}

export async function setPendingSyncOps(ops: QueuedSyncOp[]): Promise<void> {
  await writeMetaValue('pending_cloud_sync', ops);
}

export async function loadOfflineCacheSnapshot(): Promise<OfflineSnapshot> {
  if (!isIndexedDbAvailable()) {
    return {
      packs: [],
      caseStudies: [],
      podcasts: [],
      stats: null,
      lastCachedAt: null,
      pendingOps: [],
    };
  }

  const [packs, caseStudies, podcasts, stats, lastCachedAt, pendingOps] = await Promise.all([
    readAllFromStore<StudyPack>(STORES.PACKS),
    readAllFromStore<CaseStudy>(STORES.CASES),
    readAllFromStore<PodcastEpisode>(STORES.PODCASTS),
    readMetaValue<UserStats>('user_stats'),
    readMetaValue<string>('last_cached_at'),
    readMetaValue<QueuedSyncOp[]>('pending_cloud_sync'),
  ]);

  packs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  caseStudies.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  podcasts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return {
    packs,
    caseStudies,
    podcasts,
    stats,
    lastCachedAt,
    pendingOps: Array.isArray(pendingOps) ? pendingOps : [],
  };
}
