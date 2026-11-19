import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  StudyPack,
  UserStats,
  AppSettings,
  CaseStudy,
  PodcastEpisode,
  PodcastSourceType,
  RecentActivityItem,
} from '../types/study';
import { DEMO_STUDY_PACK } from '../data/demoStudyPack';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  AuthErrorDetails,
  classifyFirebaseAuthError,
  testConnection as testDbConnection,
  signInWithGoogle,
  signOutUser,
  saveStudyPackToFirestore,
  deleteStudyPackFromFirestore,
  subscribeToStudyPacks,
  saveCaseStudyToFirestore,
  deleteCaseStudyFromFirestore,
  subscribeToCaseStudies,
  savePodcastToFirestore,
  deletePodcastFromFirestore,
  subscribeToPodcasts,
  saveUserStatsToFirestore,
  loadUserStatsFromFirestore,
} from '../services/firebase';
import { deletePodcastAudioBlob } from '../services/audioCache';
import {
  enqueuePendingSyncOp,
  isIndexedDbAvailable,
  loadOfflineCacheSnapshot,
  QueuedSyncOp,
  saveAllCaseStudiesToIdb,
  saveAllPodcastsToIdb,
  saveAllStudyPacksToIdb,
  saveStatsToIdb,
  setPendingSyncOps,
} from '../services/offlineCache';
import {
  getStoredGeminiKey,
  saveStoredGeminiKey,
  removeStoredGeminiKey,
  getStoredYouTubeKey,
  saveStoredYouTubeKey,
  removeStoredYouTubeKey,
  testGeminiConnection,
  getGeminiStatusApi,
} from '../services/api';

export type NavigationTab =
  | 'dashboard'
  | 'packs'
  | 'notes'
  | 'mindmap'
  | 'summary'
  | 'definitions'
  | 'concepts'
  | 'casestudy'
  | 'podcast'
  | 'quiz'
  | 'viva'
  | 'exam'
  | 'youtube'
  | 'progress'
  | 'settings';

export interface PodcastPrefillContext {
  topic?: string;
  subject?: string;
  sourceType?: PodcastSourceType;
  sourceContent?: string;
  sourceBranchLabel?: string;
}

export interface CaseStudyPrefillContext {
  topic?: string;
  subject?: string;
  learningObjective?: string;
}

interface StudyContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentPack: StudyPack;
  setCurrentPack: (pack: StudyPack) => void;
  savedPacks: StudyPack[];
  savePack: (pack: StudyPack) => void;
  deletePack: (id: string) => void;
  toggleFavorite: (id: string) => void;
  selectPackById: (id: string) => void;
  stats: UserStats;
  recordQuizResult: (score: number, totalQuestions: number, weakTopics: string[], topic: string) => void;
  recordActivity: (type: RecentActivityItem['type'], title: string, detail: string) => void;
  // Case Study Lab state & actions
  caseStudies: CaseStudy[];
  activeCaseStudy: CaseStudy | null;
  setActiveCaseStudy: (cs: CaseStudy | null) => void;
  saveCaseStudy: (cs: CaseStudy, opts?: { countAsCreated?: boolean }) => void;
  deleteCaseStudy: (id: string) => void;
  toggleCaseBookmark: (id: string) => void;
  recordCaseStudyEvaluation: (cs: CaseStudy, score: number, isFirstCompletion: boolean) => void;
  caseStudyPrefill: CaseStudyPrefillContext | null;
  clearCaseStudyPrefill: () => void;
  openCaseStudyForContext: (prefill: CaseStudyPrefillContext) => void;
  // Listen & Learn Podcast state & actions
  podcasts: PodcastEpisode[];
  activePodcast: PodcastEpisode | null;
  setActivePodcast: (ep: PodcastEpisode | null) => void;
  savePodcast: (ep: PodcastEpisode, opts?: { countAsCreated?: boolean }) => void;
  deletePodcast: (id: string) => void;
  togglePodcastBookmark: (id: string) => void;
  updatePodcastProgress: (id: string, progressSec: number, isCompleted?: boolean) => void;
  podcastPrefill: PodcastPrefillContext | null;
  clearPodcastPrefill: () => void;
  openPodcastForContext: (prefill: PodcastPrefillContext) => void;
  // Settings & Modals
  settings: AppSettings;
  updateGeminiKey: (key: string) => void;
  deleteGeminiKey: () => void;
  updateYouTubeKey: (key: string) => void;
  deleteYouTubeKey: () => void;
  checkConnection: (keyOverride?: string) => Promise<boolean>;
  toggleTheme: () => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  isExportPdfModalOpen: boolean;
  setIsExportPdfModalOpen: (open: boolean) => void;
  isApiKeyModalOpen: boolean;
  setIsApiKeyModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authError: string | null;
  authErrorDetails: AuthErrorDetails | null;
  authRetryStatus: string | null;
  clearAuthError: () => void;
  // Database & User Auth & Offline Cache
  user: User | null;
  isAuthLoading: boolean;
  isDbConnected: boolean;
  isOnline: boolean;
  isOfflineCacheReady: boolean;
  lastOfflineCachedAt: string | null;
  pendingOfflineSyncCount: number;
  syncOfflineCacheNow: () => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const LOCAL_STORAGE_PACKS_KEY = 'ai_studymate_saved_packs_v1';
const LOCAL_STORAGE_STATS_KEY = 'ai_studymate_user_stats_v1';
const LOCAL_STORAGE_CASES_KEY = 'ai_studymate_case_studies_v1';
const LOCAL_STORAGE_PODCASTS_KEY = 'ai_studymate_podcasts_v1';
const LOCAL_STORAGE_THEME_KEY = 'ai_studymate_theme';

const INITIAL_STATS: UserStats = {
  packsCreated: 1,
  quizzesCompleted: 1,
  totalQuizScoreSum: 4,
  totalQuizQuestionsSum: 5,
  topicsStudied: ['Ansoff Matrix (Strategic Growth Grid)'],
  weakTopics: ['Conglomerate Diversification Synergies'],
  studyStreakDays: 3,
  lastStudyDate: new Date().toISOString().split('T')[0],
  caseStudiesAttempted: 0,
  caseStudiesCompleted: 0,
  caseStudyScoreSum: 0,
  podcastsCreated: 0,
  podcastsCompleted: 0,
  strongTopics: [],
  pendingRevisions: [],
  recentActivities: [],
};

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorDetails, setAuthErrorDetails] = useState<AuthErrorDetails | null>(null);
  const [authRetryStatus, setAuthRetryStatus] = useState<string | null>(null);

  // User Auth & Database Connection & Offline Cache states
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isOfflineCacheReady, setIsOfflineCacheReady] = useState<boolean>(() =>
    !isIndexedDbAvailable()
  );
  const [lastOfflineCachedAt, setLastOfflineCachedAt] = useState<string | null>(null);
  const [pendingOfflineSyncCount, setPendingOfflineSyncCount] = useState<number>(0);

  // Settings
  const [geminiKey, setGeminiKey] = useState<string>(() => getStoredGeminiKey());
  const [youtubeKey, setYouTubeKey] = useState<string>(() => getStoredYouTubeKey());
  const [geminiConnected, setGeminiConnected] = useState<boolean | null>(true);
  const [youtubeConnected, setYoutubeConnected] = useState<boolean | null>(null);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Saved packs
  const [savedPacks, setSavedPacks] = useState<StudyPack[]>(() => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_PACKS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved packs', e);
    }
    return [DEMO_STUDY_PACK];
  });

  // Current active pack
  const [currentPack, setCurrentPack] = useState<StudyPack>(() => {
    return savedPacks[0] || DEMO_STUDY_PACK;
  });

  // Stats
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_STATS_KEY);
      if (data) return { ...INITIAL_STATS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Error loading stats', e);
    }
    return INITIAL_STATS;
  });

  // Case Studies
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>(() => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_CASES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading case studies', e);
    }
    return [];
  });
  const [activeCaseStudy, setActiveCaseStudy] = useState<CaseStudy | null>(() => {
    return caseStudies[0] || null;
  });
  const [caseStudyPrefill, setCaseStudyPrefill] = useState<CaseStudyPrefillContext | null>(null);

  // Podcasts
  const [podcasts, setPodcasts] = useState<PodcastEpisode[]>(() => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_PODCASTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading podcasts', e);
    }
    return [];
  });
  const [activePodcast, setActivePodcast] = useState<PodcastEpisode | null>(() => {
    return podcasts[0] || null;
  });
  const [podcastPrefill, setPodcastPrefill] = useState<PodcastPrefillContext | null>(null);

  // Keep refs synchronized so onAuthStateChanged always syncs the latest guest items (no stale closure)
  const savedPacksRef = useRef(savedPacks);
  const caseStudiesRef = useRef(caseStudies);
  const podcastsRef = useRef(podcasts);
  const statsRef = useRef(stats);
  const authEventSeqRef = useRef(0);
  const idbHydratedRef = useRef(false);

  useEffect(() => {
    savedPacksRef.current = savedPacks;
  }, [savedPacks]);
  useEffect(() => {
    caseStudiesRef.current = caseStudies;
  }, [caseStudies]);
  useEffect(() => {
    podcastsRef.current = podcasts;
  }, [podcasts]);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Execute a queued cloud op against Firestore
  const executeCloudOp = async (op: Omit<QueuedSyncOp, 'id' | 'queuedAt'>): Promise<void> => {
    switch (op.type) {
      case 'upsert_pack':
        await saveStudyPackToFirestore(op.userId, op.payload as StudyPack);
        return;
      case 'delete_pack':
        await deleteStudyPackFromFirestore(op.userId, String(op.payload.id));
        return;
      case 'upsert_case':
        await saveCaseStudyToFirestore(op.userId, op.payload as CaseStudy);
        return;
      case 'delete_case':
        await deleteCaseStudyFromFirestore(op.userId, String(op.payload.id));
        return;
      case 'upsert_podcast':
        await savePodcastToFirestore(op.userId, op.payload as PodcastEpisode);
        return;
      case 'delete_podcast':
        await deletePodcastFromFirestore(op.userId, String(op.payload.id));
        return;
      case 'save_stats':
        await saveUserStatsToFirestore(op.userId, op.payload as UserStats);
        return;
    }
  };

  const syncCloudOrQueue = (op: Omit<QueuedSyncOp, 'id' | 'queuedAt'>) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueuePendingSyncOp(op).then((next) => setPendingOfflineSyncCount(next.length));
      return;
    }
    executeCloudOp(op).catch((err) => {
      console.warn('Firestore write deferred to offline sync queue:', err?.message || err);
      enqueuePendingSyncOp(op).then((next) => setPendingOfflineSyncCount(next.length));
    });
  };

  const flushPendingSyncQueue = async (targetUserId: string) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const snapshot = await loadOfflineCacheSnapshot();
    const pending = snapshot.pendingOps;
    if (pending.length === 0) {
      setPendingOfflineSyncCount(0);
      return;
    }

    const remaining: QueuedSyncOp[] = [];
    for (const op of pending) {
      if (op.userId !== targetUserId) {
        remaining.push(op);
        continue;
      }
      try {
        await executeCloudOp(op);
      } catch {
        remaining.push(op);
      }
    }

    await setPendingSyncOps(remaining);
    setPendingOfflineSyncCount(remaining.length);
  };

  const syncOfflineCacheNow = async () => {
    await Promise.all([
      saveAllStudyPacksToIdb(savedPacksRef.current),
      saveAllCaseStudiesToIdb(caseStudiesRef.current),
      saveAllPodcastsToIdb(podcastsRef.current),
      saveStatsToIdb(statsRef.current),
    ]);
    setLastOfflineCachedAt(new Date().toISOString());
    if (user && (typeof navigator === 'undefined' || navigator.onLine)) {
      await flushPendingSyncQueue(user.uid);
    }
  };

  // Monitor browser online/offline transitions
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      testDbConnection().then((ok) => setIsDbConnected(ok));
      if (auth.currentUser) {
        flushPendingSyncQueue(auth.currentUser.uid).catch(() => {});
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Hydrate study packs, case studies, podcasts, and stats from IndexedDB on boot
  useEffect(() => {
    let active = true;
    loadOfflineCacheSnapshot()
      .then(async (snap) => {
        if (!active) return;

        if (snap.packs.length > 0) {
          const map = new Map<string, StudyPack>();
          snap.packs.forEach((p) => map.set(p.id, p));
          savedPacksRef.current.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          const mergedPacks = Array.from(map.values());
          setSavedPacks(mergedPacks);
          setCurrentPack((prev) => {
            if (!prev || prev.isDemo) {
              return mergedPacks.find((p) => !p.isDemo) || mergedPacks[0] || prev;
            }
            return mergedPacks.find((p) => p.id === prev.id) || prev;
          });
        } else {
          await saveAllStudyPacksToIdb(savedPacksRef.current);
        }

        if (snap.caseStudies.length > 0) {
          const map = new Map<string, CaseStudy>();
          snap.caseStudies.forEach((c) => map.set(c.id, c));
          caseStudiesRef.current.forEach((c) => {
            if (!map.has(c.id)) map.set(c.id, c);
          });
          const mergedCases = Array.from(map.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setCaseStudies(mergedCases);
          setActiveCaseStudy((prev) => prev || mergedCases[0] || null);
        } else if (caseStudiesRef.current.length > 0) {
          await saveAllCaseStudiesToIdb(caseStudiesRef.current);
        }

        if (snap.podcasts.length > 0) {
          const map = new Map<string, PodcastEpisode>();
          snap.podcasts.forEach((ep) => map.set(ep.id, ep));
          podcastsRef.current.forEach((ep) => {
            if (!map.has(ep.id)) map.set(ep.id, ep);
          });
          const mergedPods = Array.from(map.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setPodcasts(mergedPods);
          setActivePodcast((prev) => prev || mergedPods[0] || null);
        } else if (podcastsRef.current.length > 0) {
          await saveAllPodcastsToIdb(podcastsRef.current);
        }

        if (snap.stats) {
          setStats((prev) => ({
            ...INITIAL_STATS,
            ...prev,
            ...snap.stats,
            packsCreated: Math.max(prev.packsCreated || 0, snap.stats?.packsCreated || 0),
            quizzesCompleted: Math.max(
              prev.quizzesCompleted || 0,
              snap.stats?.quizzesCompleted || 0
            ),
            caseStudiesCompleted: Math.max(
              prev.caseStudiesCompleted || 0,
              snap.stats?.caseStudiesCompleted || 0
            ),
            podcastsCreated: Math.max(
              prev.podcastsCreated || 0,
              snap.stats?.podcastsCreated || 0
            ),
          }));
        } else {
          await saveStatsToIdb(statsRef.current);
        }

        setPendingOfflineSyncCount(snap.pendingOps.length);
        setLastOfflineCachedAt(snap.lastCachedAt || new Date().toISOString());
        idbHydratedRef.current = true;
        setIsOfflineCacheReady(true);
      })
      .catch((err) => {
        console.warn('IndexedDB hydration skipped:', err);
        idbHydratedRef.current = true;
        setIsOfflineCacheReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  // Test Firestore connection on boot (Skill mandate)
  useEffect(() => {
    testDbConnection().then((ok) => {
      setIsDbConnected(ok);
    });
  }, []);

  // Listen to Firebase Auth state & attach real-time Firestore listeners
  useEffect(() => {
    let isMounted = true;
    let unsubscribePacks: (() => void) | null = null;
    let unsubscribeCases: (() => void) | null = null;
    let unsubscribePodcasts: (() => void) | null = null;

    const cleanupListeners = () => {
      if (unsubscribePacks) {
        unsubscribePacks();
        unsubscribePacks = null;
      }
      if (unsubscribeCases) {
        unsubscribeCases();
        unsubscribeCases = null;
      }
      if (unsubscribePodcasts) {
        unsubscribePodcasts();
        unsubscribePodcasts = null;
      }
    };

    // Safety guard so initial button spinner never hangs if auth SDK stalls offline
    const authBootTimeout = window.setTimeout(() => {
      if (isMounted) {
        setIsAuthLoading(false);
      }
    }, 4000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      window.clearTimeout(authBootTimeout);
      const eventSeq = ++authEventSeqRef.current;

      if (!isMounted) return;

      // Always tear down previous user's listeners immediately before re-attaching
      cleanupListeners();

      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        setAuthError(null);
        setAuthErrorDetails(null);
        setAuthRetryStatus(null);

        // Attach real-time Firestore listeners immediately (merge safely with local state)
        unsubscribePacks = subscribeToStudyPacks(
          currentUser.uid,
          (cloudPacks) => {
            if (cloudPacks && cloudPacks.length > 0) {
              setSavedPacks((prev) => {
                const map = new Map<string, StudyPack>();
                map.set(DEMO_STUDY_PACK.id, DEMO_STUDY_PACK);
                prev.forEach((p) => map.set(p.id, p));
                cloudPacks.forEach((p) => map.set(p.id, p));
                return Array.from(map.values());
              });
            }
          },
          (err) => console.error('StudyPacks snapshot error:', err)
        );

        unsubscribeCases = subscribeToCaseStudies(
          currentUser.uid,
          (cloudCases) => {
            if (cloudCases && cloudCases.length > 0) {
              setCaseStudies((prev) => {
                const map = new Map<string, CaseStudy>();
                prev.forEach((c) => map.set(c.id, c));
                cloudCases.forEach((c) => map.set(c.id, c));
                return Array.from(map.values()).sort(
                  (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
              });
            }
          },
          (err) => console.error('CaseStudies snapshot error:', err)
        );

        unsubscribePodcasts = subscribeToPodcasts(
          currentUser.uid,
          (cloudEpisodes) => {
            if (cloudEpisodes && cloudEpisodes.length > 0) {
              setPodcasts((prev) => {
                const map = new Map<string, PodcastEpisode>();
                prev.forEach((ep) => map.set(ep.id, ep));
                cloudEpisodes.forEach((ep) => map.set(ep.id, ep));
                return Array.from(map.values()).sort(
                  (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
              });
            }
          },
          (err) => console.error('Podcasts snapshot error:', err)
        );

        // Upload latest local guest items in resilient parallel batch without blocking listeners
        const syncTasks: Promise<void>[] = [
          ...savedPacksRef.current
            .filter((pack) => !pack.isDemo)
            .map((pack) => saveStudyPackToFirestore(currentUser.uid, pack)),
          ...caseStudiesRef.current.map((cs) => saveCaseStudyToFirestore(currentUser.uid, cs)),
          ...podcastsRef.current.map((ep) => savePodcastToFirestore(currentUser.uid, ep)),
        ];

        Promise.allSettled(syncTasks).then((results) => {
          const rejected = results.filter((r) => r.status === 'rejected');
          if (rejected.length > 0) {
            console.warn(`${rejected.length} local study item(s) could not sync to Firestore.`);
          }
        });

        // Also flush any queued offline mutations created while disconnected
        flushPendingSyncQueue(currentUser.uid).catch(() => {});

        // Sync stats without overwriting newer cloud stats
        try {
          const cloudStats = await loadUserStatsFromFirestore(currentUser.uid);
          if (!isMounted || authEventSeqRef.current !== eventSeq) return;
          if (cloudStats) {
            setStats({ ...INITIAL_STATS, ...cloudStats });
          } else {
            await saveUserStatsToFirestore(currentUser.uid, statsRef.current);
          }
        } catch (e) {
          console.error('Error syncing stats with Firestore:', e);
        }
      }
    });

    return () => {
      isMounted = false;
      window.clearTimeout(authBootTimeout);
      cleanupListeners();
      unsubscribeAuth();
    };
  }, []);

  // Sync theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
    } catch {}
  }, [theme]);

  // Sync saved packs to IndexedDB (primary offline storage) + localStorage fallback
  useEffect(() => {
    if (idbHydratedRef.current) {
      saveAllStudyPacksToIdb(savedPacks).then(() => {
        setLastOfflineCachedAt(new Date().toISOString());
      });
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_PACKS_KEY, JSON.stringify(savedPacks));
    } catch (e) {
      console.warn('localStorage pack quota reached; cached safely in IndexedDB.', e);
    }
  }, [savedPacks]);

  // Sync case studies to IndexedDB + localStorage fallback
  useEffect(() => {
    if (idbHydratedRef.current) {
      saveAllCaseStudiesToIdb(caseStudies).then(() => {
        setLastOfflineCachedAt(new Date().toISOString());
      });
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_CASES_KEY, JSON.stringify(caseStudies));
    } catch (e) {
      console.warn('localStorage case study quota reached; cached safely in IndexedDB.', e);
    }
  }, [caseStudies]);

  // Sync podcasts to IndexedDB + localStorage fallback
  useEffect(() => {
    if (idbHydratedRef.current) {
      saveAllPodcastsToIdb(podcasts).then(() => {
        setLastOfflineCachedAt(new Date().toISOString());
      });
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_PODCASTS_KEY, JSON.stringify(podcasts));
    } catch (e) {
      console.warn('localStorage podcast quota reached; cached safely in IndexedDB.', e);
    }
  }, [podcasts]);

  // Sync stats to IndexedDB + localStorage
  useEffect(() => {
    if (idbHydratedRef.current) {
      saveStatsToIdb(stats);
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to persist stats', e);
    }
  }, [stats]);

  // Initial connection check on mount (checks stored key or server environment key)
  useEffect(() => {
    getGeminiStatusApi().then((status) => {
      setHasServerGeminiKey(status.hasEnvKey);
      testGeminiConnection(geminiKey || undefined).then((res) => {
        setGeminiConnected(res.success);
      });
    });
  }, [geminiKey]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const updateGeminiKey = (key: string) => {
    setGeminiKey(key);
    saveStoredGeminiKey(key);
    testGeminiConnection(key.trim() || undefined).then((res) => {
      setGeminiConnected(res.success);
    });
  };

  const deleteGeminiKey = () => {
    setGeminiKey('');
    removeStoredGeminiKey();
    testGeminiConnection(undefined).then((res) => {
      setGeminiConnected(res.success);
    });
  };

  const updateYouTubeKey = (key: string) => {
    setYouTubeKey(key);
    saveStoredYouTubeKey(key);
    setYoutubeConnected(Boolean(key.trim()));
  };

  const deleteYouTubeKey = () => {
    setYouTubeKey('');
    removeStoredYouTubeKey();
    setYoutubeConnected(false);
  };

  const checkConnection = async (keyOverride?: string): Promise<boolean> => {
    const keyToTest = keyOverride !== undefined ? (keyOverride.trim() || undefined) : (geminiKey.trim() || undefined);
    const res = await testGeminiConnection(keyToTest);
    setGeminiConnected(res.success);
    return res.success;
  };

  const clearAuthError = () => {
    setAuthError(null);
    setAuthErrorDetails(null);
    setAuthRetryStatus(null);
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsAuthLoading(true);
    setAuthError(null);
    setAuthErrorDetails(null);
    setAuthRetryStatus(null);
    try {
      const loggedUser = await signInWithGoogle({
        onRetryAttempt: (attempt, maxAttempts) => {
          setAuthRetryStatus(
            `Temporary connection hiccup — retrying (${attempt}/${maxAttempts})...`
          );
        },
      });
      setAuthRetryStatus(null);
      setIsAuthLoading(false);
      return Boolean(loggedUser);
    } catch (err: any) {
      const details = classifyFirebaseAuthError(err);
      console.error('Google Login Error:', details.code, err);
      setAuthRetryStatus(null);
      setIsAuthLoading(false);
      setAuthError(details.message);
      setAuthErrorDetails(details);
      return false;
    }
  };

  const logout = async () => {
    setIsAuthLoading(true);
    try {
      await signOutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const savePack = (pack: StudyPack) => {
    setSavedPacks((prev) => {
      const idx = prev.findIndex((p) => p.id === pack.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = pack;
        return next;
      }
      return [pack, ...prev];
    });
    setCurrentPack(pack);
    setStats((prev) => {
      const updated = {
        ...prev,
        packsCreated: prev.packsCreated + 1,
        topicsStudied: prev.topicsStudied.includes(pack.title)
          ? prev.topicsStudied
          : [pack.title, ...prev.topicsStudied],
      };
      if (user) {
        syncCloudOrQueue({ userId: user.uid, type: 'save_stats', payload: updated });
      }
      return updated;
    });

    if (user && !pack.isDemo) {
      syncCloudOrQueue({ userId: user.uid, type: 'upsert_pack', payload: pack });
    }
  };

  const deletePack = (id: string) => {
    setSavedPacks((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (currentPack.id === id) {
        setCurrentPack(filtered[0] || DEMO_STUDY_PACK);
      }
      return filtered;
    });

    if (user) {
      syncCloudOrQueue({ userId: user.uid, type: 'delete_pack', payload: { id } });
    }
  };

  const toggleFavorite = (id: string) => {
    setSavedPacks((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
      const targetPack = updated.find((p) => p.id === id);
      if (user && targetPack && !targetPack.isDemo) {
        syncCloudOrQueue({ userId: user.uid, type: 'upsert_pack', payload: targetPack });
      }
      return updated;
    });
    if (currentPack.id === id) {
      setCurrentPack((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
    }
  };

  const selectPackById = (id: string) => {
    const found = savedPacks.find((p) => p.id === id);
    if (found) {
      setCurrentPack(found);
      setActiveTab('notes');
    }
  };

  const recordActivity = (
    type: RecentActivityItem['type'],
    title: string,
    detail: string
  ) => {
    const entry: RecentActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      detail,
      timestamp: new Date().toISOString(),
    };
    setStats((prev) => {
      const next: UserStats = {
        ...prev,
        recentActivities: [entry, ...(prev.recentActivities || [])].slice(0, 15),
      };
      if (user) {
        syncCloudOrQueue({ userId: user.uid, type: 'save_stats', payload: next });
      }
      return next;
    });
  };

  const recordQuizResult = (
    score: number,
    totalQuestions: number,
    weakTopics: string[],
    topic: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    setStats((prev) => {
      let streak = prev.studyStreakDays;
      if (prev.lastStudyDate) {
        const last = new Date(prev.lastStudyDate).getTime();
        const now = new Date(today).getTime();
        const diffDays = Math.round((now - last) / (1000 * 3600 * 24));
        if (diffDays === 1) streak += 1;
        else if (diffDays > 1) streak = 1;
      } else {
        streak = 1;
      }

      const mergedWeakTopics = Array.from(new Set([...weakTopics, ...prev.weakTopics])).slice(0, 8);
      const mergedTopics = prev.topicsStudied.includes(topic)
        ? prev.topicsStudied
        : [topic, ...prev.topicsStudied];
      const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
      const strongTopics =
        pct >= 75
          ? Array.from(new Set([topic, ...(prev.strongTopics || [])])).slice(0, 10)
          : prev.strongTopics || [];
      const pendingRevisions =
        weakTopics.length > 0
          ? Array.from(new Set([...weakTopics, ...(prev.pendingRevisions || [])])).slice(0, 8)
          : prev.pendingRevisions || [];

      const activity: RecentActivityItem = {
        id: `act-${Date.now()}`,
        type: 'quiz',
        title: `Quiz: ${topic}`,
        detail: `Scored ${score}/${totalQuestions} (${pct}%)`,
        timestamp: new Date().toISOString(),
      };

      const newStats: UserStats = {
        ...prev,
        quizzesCompleted: prev.quizzesCompleted + 1,
        totalQuizScoreSum: prev.totalQuizScoreSum + score,
        totalQuizQuestionsSum: prev.totalQuizQuestionsSum + totalQuestions,
        topicsStudied: mergedTopics,
        weakTopics: mergedWeakTopics,
        strongTopics,
        pendingRevisions,
        studyStreakDays: streak,
        lastStudyDate: today,
        recentActivities: [activity, ...(prev.recentActivities || [])].slice(0, 15),
      };

      if (user) {
        syncCloudOrQueue({ userId: user.uid, type: 'save_stats', payload: newStats });
      }

      return newStats;
    });
  };

  // Case Study CRUD & Tracking
  const saveCaseStudy = (cs: CaseStudy, opts?: { countAsCreated?: boolean }) => {
    const stamped: CaseStudy = { ...cs, updatedAt: new Date().toISOString() };
    setCaseStudies((prev) => {
      const idx = prev.findIndex((item) => item.id === stamped.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = stamped;
        return next;
      }
      return [stamped, ...prev];
    });
    setActiveCaseStudy((prev) => (prev?.id === stamped.id || !prev ? stamped : prev));

    if (opts?.countAsCreated) {
      setStats((prev) => {
        const mergedTopics = prev.topicsStudied.includes(stamped.topic)
          ? prev.topicsStudied
          : [stamped.topic, ...prev.topicsStudied];
        const nextStats: UserStats = {
          ...prev,
          topicsStudied: mergedTopics,
          recentActivities: [
            {
              id: `act-${Date.now()}`,
              type: 'case_study' as const,
              title: stamped.title,
              detail: `Created ${stamped.difficulty} ${stamped.caseType} case study`,
              timestamp: new Date().toISOString(),
            },
            ...(prev.recentActivities || []),
          ].slice(0, 15),
        };
        if (user) {
          syncCloudOrQueue({ userId: user.uid, type: 'save_stats', payload: nextStats });
        }
        return nextStats;
      });
    }

    if (user) {
      syncCloudOrQueue({ userId: user.uid, type: 'upsert_case', payload: stamped });
    }
  };

  const deleteCaseStudy = (id: string) => {
    setCaseStudies((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeCaseStudy?.id === id) {
        setActiveCaseStudy(next[0] || null);
      }
      return next;
    });
    if (user) {
      syncCloudOrQueue({ userId: user.uid, type: 'delete_case', payload: { id } });
    }
  };

  const toggleCaseBookmark = (id: string) => {
    setCaseStudies((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, isBookmarked: !c.isBookmarked, updatedAt: new Date().toISOString() };
        if (activeCaseStudy?.id === id) setActiveCaseStudy(updated);
        if (user) {
          syncCloudOrQueue({ userId: user.uid, type: 'upsert_case', payload: updated });
        }
        return updated;
      })
    );
  };

  const recordCaseStudyEvaluation = (
    cs: CaseStudy,
    score: number,
    isFirstCompletion: boolean
  ) => {
    setStats((prev) => {
      const attempted = (prev.caseStudiesAttempted || 0) + 1;
      const completed = (prev.caseStudiesCompleted || 0) + (isFirstCompletion ? 1 : 0);
      const scoreSum = (prev.caseStudyScoreSum || 0) + score;
      const strongTopics =
        score >= 80
          ? Array.from(new Set([cs.topic, ...(prev.strongTopics || [])])).slice(0, 10)
          : prev.strongTopics || [];
      const pendingRevisions =
        score < 65
          ? Array.from(new Set([cs.topic, ...(prev.pendingRevisions || [])])).slice(0, 8)
          : prev.pendingRevisions || [];

      const nextStats: UserStats = {
        ...prev,
        caseStudiesAttempted: attempted,
        caseStudiesCompleted: completed,
        caseStudyScoreSum: scoreSum,
        strongTopics,
        pendingRevisions,
        recentActivities: [
          {
            id: `act-${Date.now()}`,
            type: 'case_study' as const,
            title: cs.title,
            detail: `Evaluated solution: ${score}/100`,
            timestamp: new Date().toISOString(),
          },
          ...(prev.recentActivities || []),
        ].slice(0, 15),
      };
      if (user) {
        syncCloudOrQueue({ userId: user.uid, type: 'save_stats', payload: nextStats });
      }
      return nextStats;
    });
  };

  const openCaseStudyForContext = (prefill: CaseStudyPrefillContext) => {
    setCaseStudyPrefill(prefill);
    setActiveTab('casestudy');
  };

  const clearCaseStudyPrefill = () => setCaseStudyPrefill(null);

  // Podcast CRUD & Progress Tracking
  const savePodcast = (ep: PodcastEpisode, opts?: { countAsCreated?: boolean }) => {
    const stamped: PodcastEpisode = { ...ep, updatedAt: new Date().toISOString() };
    setPodcasts((prev) => {
      const idx = prev.findIndex((item) => item.id === stamped.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = stamped;
        return next;
      }
      return [stamped, ...prev];
    });
    setActivePodcast((prev) => (prev?.id === stamped.id || !prev ? stamped : prev));

    if (opts?.countAsCreated) {
      setStats((prev) => {
        const mergedTopics = prev.topicsStudied.includes(stamped.topic)
          ? prev.topicsStudied
          : [stamped.topic, ...prev.topicsStudied];
        const nextStats: UserStats = {
          ...prev,
          podcastsCreated: (prev.podcastsCreated || 0) + 1,
          topicsStudied: mergedTopics,
          recentActivities: [
            {
              id: `act-${Date.now()}`,
              type: 'podcast' as const,
              title: stamped.title,
              detail: `${stamped.targetDurationMinutes} min ${stamped.language} podcast (${stamped.format.replace('_', ' ')})`,
              timestamp: new Date().toISOString(),
            },
            ...(prev.recentActivities || []),
          ].slice(0, 15),
        };
        if (user) {
          syncCloudOrQueue({ userId: user.uid, type: 'save_stats', payload: nextStats });
        }
        return nextStats;
      });
    }

    if (user) {
      syncCloudOrQueue({ userId: user.uid, type: 'upsert_podcast', payload: stamped });
    }
  };

  const deletePodcast = (id: string) => {
    setPodcasts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (activePodcast?.id === id) {
        setActivePodcast(next[0] || null);
      }
      return next;
    });
    deletePodcastAudioBlob(id).catch(() => {});
    if (user) {
      syncCloudOrQueue({ userId: user.uid, type: 'delete_podcast', payload: { id } });
    }
  };

  const togglePodcastBookmark = (id: string) => {
    setPodcasts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, isBookmarked: !p.isBookmarked, updatedAt: new Date().toISOString() };
        if (activePodcast?.id === id) setActivePodcast(updated);
        if (user) {
          syncCloudOrQueue({ userId: user.uid, type: 'upsert_podcast', payload: updated });
        }
        return updated;
      })
    );
  };

  const updatePodcastProgress = (id: string, progressSec: number, isCompleted?: boolean) => {
    let newlyCompletedTopic: string | null = null;
    setPodcasts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const completed = isCompleted ?? p.isCompleted;
        if (completed && !p.isCompleted) {
          newlyCompletedTopic = p.title;
        }
        const updated: PodcastEpisode = {
          ...p,
          playbackProgressSec: Math.max(0, Math.round(progressSec)),
          isCompleted: completed,
          updatedAt: new Date().toISOString(),
        };
        if (activePodcast?.id === id) setActivePodcast(updated);
        if (user) {
          syncCloudOrQueue({ userId: user.uid, type: 'upsert_podcast', payload: updated });
        }
        return updated;
      })
    );

    if (newlyCompletedTopic) {
      setStats((prev) => {
        const nextStats: UserStats = {
          ...prev,
          podcastsCompleted: (prev.podcastsCompleted || 0) + 1,
          recentActivities: [
            {
              id: `act-${Date.now()}`,
              type: 'podcast' as const,
              title: newlyCompletedTopic!,
              detail: 'Completed listening to podcast episode',
              timestamp: new Date().toISOString(),
            },
            ...(prev.recentActivities || []),
          ].slice(0, 15),
        };
        if (user) {
          syncCloudOrQueue({ userId: user.uid, type: 'save_stats', payload: nextStats });
        }
        return nextStats;
      });
    }
  };

  const openPodcastForContext = (prefill: PodcastPrefillContext) => {
    setPodcastPrefill(prefill);
    setActiveTab('podcast');
  };

  const clearPodcastPrefill = () => setPodcastPrefill(null);

  return (
    <StudyContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentPack,
        setCurrentPack,
        savedPacks,
        savePack,
        deletePack,
        toggleFavorite,
        selectPackById,
        stats,
        recordQuizResult,
        recordActivity,
        caseStudies,
        activeCaseStudy,
        setActiveCaseStudy,
        saveCaseStudy,
        deleteCaseStudy,
        toggleCaseBookmark,
        recordCaseStudyEvaluation,
        caseStudyPrefill,
        clearCaseStudyPrefill,
        openCaseStudyForContext,
        podcasts,
        activePodcast,
        setActivePodcast,
        savePodcast,
        deletePodcast,
        togglePodcastBookmark,
        updatePodcastProgress,
        podcastPrefill,
        clearPodcastPrefill,
        openPodcastForContext,
        settings: {
          geminiApiKey: geminiKey,
          youtubeApiKey: youtubeKey,
          theme,
          geminiConnected,
          youtubeConnected,
          hasServerGeminiKey,
        },
        updateGeminiKey,
        deleteGeminiKey,
        updateYouTubeKey,
        deleteYouTubeKey,
        checkConnection,
        toggleTheme,
        isSearchOpen,
        setIsSearchOpen,
        isUploadModalOpen,
        setIsUploadModalOpen,
        isExportPdfModalOpen,
        setIsExportPdfModalOpen,
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authError,
        authErrorDetails,
        authRetryStatus,
        clearAuthError,
        user,
        isAuthLoading,
        isDbConnected,
        isOnline,
        isOfflineCacheReady,
        lastOfflineCachedAt,
        pendingOfflineSyncCount,
        syncOfflineCacheNow,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export function useStudy(): StudyContextType {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
