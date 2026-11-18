import React, { createContext, useContext, useState, useEffect } from 'react';
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
  clearAuthError: () => void;
  // Database & User Auth
  user: User | null;
  isAuthLoading: boolean;
  isDbConnected: boolean;
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

  // User Auth & Database Connection states
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);

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

  // Test Firestore connection on boot (Skill mandate)
  useEffect(() => {
    testDbConnection().then((ok) => {
      setIsDbConnected(ok);
    });
  }, []);

  // Listen to Firebase Auth state & attach real-time Firestore listeners
  useEffect(() => {
    let unsubscribePacks: (() => void) | null = null;
    let unsubscribeCases: (() => void) | null = null;
    let unsubscribePodcasts: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        // Upload local items to cloud if present
        try {
          for (const pack of savedPacks) {
            if (!pack.isDemo) {
              await saveStudyPackToFirestore(currentUser.uid, pack);
            }
          }
          for (const cs of caseStudies) {
            await saveCaseStudyToFirestore(currentUser.uid, cs);
          }
          for (const ep of podcasts) {
            await savePodcastToFirestore(currentUser.uid, ep);
          }
        } catch (e) {
          console.error('Error syncing local items with Firestore:', e);
        }

        // Subscribe to real-time updates for Study Packs
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

        // Subscribe to real-time updates for Case Studies
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

        // Subscribe to real-time updates for Podcasts
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

        // Load stats from Firestore
        try {
          const cloudStats = await loadUserStatsFromFirestore(currentUser.uid);
          if (cloudStats) {
            setStats({ ...INITIAL_STATS, ...cloudStats });
          } else {
            await saveUserStatsToFirestore(currentUser.uid, stats);
          }
        } catch (e) {
          console.error('Error syncing stats with Firestore:', e);
        }
      } else {
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
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribePacks) unsubscribePacks();
      if (unsubscribeCases) unsubscribeCases();
      if (unsubscribePodcasts) unsubscribePodcasts();
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

  // Sync saved packs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PACKS_KEY, JSON.stringify(savedPacks));
    } catch (e) {
      console.error('Failed to persist packs to localStorage', e);
    }
  }, [savedPacks]);

  // Sync case studies to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CASES_KEY, JSON.stringify(caseStudies));
    } catch (e) {
      console.error('Failed to persist case studies to localStorage', e);
    }
  }, [caseStudies]);

  // Sync podcasts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PODCASTS_KEY, JSON.stringify(podcasts));
    } catch (e) {
      console.error('Failed to persist podcasts to localStorage', e);
    }
  }, [podcasts]);

  // Sync stats
  useEffect(() => {
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

  const clearAuthError = () => setAuthError(null);

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const loggedUser = await signInWithGoogle();
      setIsAuthLoading(false);
      return Boolean(loggedUser);
    } catch (err: any) {
      console.error('Google Login Error:', err);
      setIsAuthLoading(false);
      let message = 'Google sign-in could not be completed. Please try again.';
      if (err?.code === 'auth/popup-closed-by-user') {
        message = 'The Google sign-in window was closed before completing.';
      } else if (err?.code === 'auth/popup-blocked') {
        message = 'The sign-in popup was blocked. Please allow popups for this page in your browser.';
      } else if (err?.code === 'auth/cancelled-popup-request') {
        message = 'Previous sign-in request was cancelled.';
      } else if (err?.message) {
        message = err.message;
      }
      setAuthError(message);
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
        saveUserStatsToFirestore(user.uid, updated).catch(console.error);
      }
      return updated;
    });

    if (user && !pack.isDemo) {
      saveStudyPackToFirestore(user.uid, pack).catch(console.error);
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
      deleteStudyPackFromFirestore(user.uid, id).catch(console.error);
    }
  };

  const toggleFavorite = (id: string) => {
    setSavedPacks((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
      const targetPack = updated.find((p) => p.id === id);
      if (user && targetPack && !targetPack.isDemo) {
        saveStudyPackToFirestore(user.uid, targetPack).catch(console.error);
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
        saveUserStatsToFirestore(user.uid, next).catch(console.error);
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
        saveUserStatsToFirestore(user.uid, newStats).catch(console.error);
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
        if (user) saveUserStatsToFirestore(user.uid, nextStats).catch(console.error);
        return nextStats;
      });
    }

    if (user) {
      saveCaseStudyToFirestore(user.uid, stamped).catch(console.error);
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
      deleteCaseStudyFromFirestore(user.uid, id).catch(console.error);
    }
  };

  const toggleCaseBookmark = (id: string) => {
    setCaseStudies((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, isBookmarked: !c.isBookmarked, updatedAt: new Date().toISOString() };
        if (activeCaseStudy?.id === id) setActiveCaseStudy(updated);
        if (user) saveCaseStudyToFirestore(user.uid, updated).catch(console.error);
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
      if (user) saveUserStatsToFirestore(user.uid, nextStats).catch(console.error);
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
        if (user) saveUserStatsToFirestore(user.uid, nextStats).catch(console.error);
        return nextStats;
      });
    }

    if (user) {
      savePodcastToFirestore(user.uid, stamped).catch(console.error);
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
      deletePodcastFromFirestore(user.uid, id).catch(console.error);
    }
  };

  const togglePodcastBookmark = (id: string) => {
    setPodcasts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, isBookmarked: !p.isBookmarked, updatedAt: new Date().toISOString() };
        if (activePodcast?.id === id) setActivePodcast(updated);
        if (user) savePodcastToFirestore(user.uid, updated).catch(console.error);
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
        if (user) savePodcastToFirestore(user.uid, updated).catch(console.error);
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
        if (user) saveUserStatsToFirestore(user.uid, nextStats).catch(console.error);
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
        clearAuthError,
        user,
        isAuthLoading,
        isDbConnected,
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
