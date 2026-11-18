import React, { useMemo, useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { LearningRecommendation } from '../types/study';
import { getLearningRecommendationsApi } from '../services/api';
import { LearningLoopTracker } from '../components/learning/LearningLoopTracker';
import {
  FileEdit,
  Network,
  HelpCircle,
  Lightbulb,
  Youtube,
  Calendar,
  Upload,
  Sparkles,
  ArrowRight,
  Star,
  Clock,
  BookOpen,
  Award,
  Flame,
  FileText,
  X,
  Briefcase,
  Headphones,
  RefreshCw,
  Loader2,
  Compass,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    setActiveTab,
    savedPacks,
    currentPack,
    selectPackById,
    toggleFavorite,
    setIsUploadModalOpen,
    setIsAuthModalOpen,
    user,
    stats,
    caseStudies,
    podcasts,
    openPodcastForContext,
    openCaseStudyForContext,
    settings,
  } = useStudy();

  const [inputTopic, setInputTopic] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<LearningRecommendation[] | null>(
    null
  );
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleStartTopic = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadModalOpen(true);
  };

  const quickActions = [
    {
      title: 'Generate Notes',
      desc: 'Handwritten revision notes',
      icon: <FileEdit className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      action: () => setActiveTab('notes'),
    },
    {
      title: 'Create Mind Map',
      desc: 'Interactive concept graph',
      icon: <Network className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bg: 'bg-purple-50 dark:bg-purple-950/60',
      action: () => setActiveTab('mindmap'),
    },
    {
      title: 'Listen & Learn',
      desc: 'AI educational podcasts',
      icon: <Headphones className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      action: () => setActiveTab('podcast'),
    },
    {
      title: 'Case Study Lab',
      desc: 'Real-world problem solving',
      icon: <Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      bg: 'bg-teal-50 dark:bg-teal-950/60',
      action: () => setActiveTab('casestudy'),
    },
    {
      title: 'Create Quiz',
      desc: 'MCQs, case drills & review',
      icon: <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      action: () => setActiveTab('quiz'),
    },
    {
      title: 'Important Concepts',
      desc: 'Deep dives with examples',
      icon: <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      action: () => setActiveTab('concepts'),
    },
    {
      title: 'Find Videos',
      desc: 'Curated YouTube lectures',
      icon: <Youtube className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      action: () => setActiveTab('youtube'),
    },
    {
      title: 'Exam Preparation',
      desc: 'Revision plan & test prep',
      icon: <Calendar className="w-5 h-5 text-slate-700 dark:text-slate-300" />,
      bg: 'bg-slate-100 dark:bg-slate-800',
      action: () => setActiveTab('exam'),
    },
  ];

  const quizAverage =
    stats.totalQuizQuestionsSum > 0
      ? Math.round((stats.totalQuizScoreSum / stats.totalQuizQuestionsSum) * 100)
      : 0;

  const completedCases = caseStudies.filter((c) => c.status === 'completed');
  const inProgressCase = caseStudies.find((c) => c.status === 'in_progress');
  const unfinishedPodcast = podcasts.find(
    (p) => !p.isCompleted && p.playbackProgressSec > 0
  );

  const avgCaseScore =
    completedCases.length > 0
      ? Math.round(
          completedCases.reduce((sum, c) => sum + (c.latestScore || 0), 0) /
            completedCases.length
        )
      : null;

  // Strictly grounded deterministic recommendations computed from real user state
  const groundedRecommendations = useMemo<LearningRecommendation[]>(() => {
    const recs: LearningRecommendation[] = [];

    if (stats.weakTopics.length > 0) {
      const targetWeak = stats.weakTopics[0];
      recs.push({
        id: 'rec-weak-podcast',
        stage: 'improve',
        title: `Turn "${targetWeak}" into a 3-min revision podcast`,
        reason: 'Flagged as a weak area in your recent quiz history.',
        actionLabel: 'Create Revision Audio',
        targetTab: 'podcast',
        topic: targetWeak,
        priority: 'high',
      });
    }

    if (inProgressCase) {
      recs.push({
        id: 'rec-resume-case',
        stage: 'apply',
        title: `Resume case: ${inProgressCase.title}`,
        reason: 'You have an unfinished case draft waiting for submission.',
        actionLabel: 'Resume Case',
        targetTab: 'casestudy',
        topic: inProgressCase.topic,
        priority: 'high',
      });
    } else if (
      !caseStudies.some((c) =>
        c.topic.toLowerCase().includes(currentPack.title.toLowerCase())
      )
    ) {
      recs.push({
        id: 'rec-new-case',
        stage: 'apply',
        title: `Apply ${currentPack.title} in a real-world case study`,
        reason: 'No case study completed yet for your active study pack.',
        actionLabel: 'Open Case Lab',
        targetTab: 'casestudy',
        topic: currentPack.title,
        priority: 'medium',
      });
    }

    if (unfinishedPodcast) {
      recs.push({
        id: 'rec-resume-pod',
        stage: 'listen',
        title: `Continue listening: ${unfinishedPodcast.title}`,
        reason: 'Pick up audio playback right where you paused.',
        actionLabel: 'Resume Episode',
        targetTab: 'podcast',
        topic: unfinishedPodcast.topic,
        priority: 'medium',
      });
    } else if (podcasts.length === 0) {
      recs.push({
        id: 'rec-first-pod',
        stage: 'listen',
        title: `Listen to ${currentPack.title} as a two-host podcast`,
        reason: 'Audio dialogue strengthens concept recall after reading notes.',
        actionLabel: 'Generate Podcast',
        targetTab: 'podcast',
        topic: currentPack.title,
        priority: 'normal',
      });
    }

    if (recs.length < 3) {
      recs.push({
        id: 'rec-test-quiz',
        stage: 'test',
        title: `Test recall on ${currentPack.title}`,
        reason: 'Verify mastery with mixed-difficulty exam questions.',
        actionLabel: 'Start Quiz',
        targetTab: 'quiz',
        topic: currentPack.title,
        priority: 'normal',
      });
    }

    return recs.slice(0, 3);
  }, [stats.weakTopics, inProgressCase, unfinishedPodcast, caseStudies, podcasts, currentPack]);

  const activeRecommendations =
    aiRecommendations && aiRecommendations.length > 0
      ? aiRecommendations
      : groundedRecommendations;

  const handleRefreshAiRecs = async () => {
    setIsLoadingRecs(true);
    const res = await getLearningRecommendationsApi({
      currentTopic: currentPack.title,
      stats: {
        packsCreated: stats.packsCreated,
        quizzesCompleted: stats.quizzesCompleted,
        quizAverage,
        weakTopics: stats.weakTopics,
        strongTopics: stats.strongTopics || [],
        caseStudiesCompleted: completedCases.length,
        avgCaseScore,
        podcastsCreated: podcasts.length,
      },
      packs: savedPacks.slice(0, 6).map((p) => ({ title: p.title, subject: p.subject })),
      caseStudies: caseStudies.slice(0, 6).map((c) => ({
        title: c.title,
        topic: c.topic,
        status: c.status,
        latestScore: c.latestScore,
      })),
      podcasts: podcasts.slice(0, 6).map((p) => ({
        title: p.title,
        topic: p.topic,
        isCompleted: p.isCompleted,
        targetDurationMinutes: p.targetDurationMinutes,
      })),
    });
    setIsLoadingRecs(false);
    if (res.success && res.recommendations.length > 0) {
      setAiRecommendations(res.recommendations);
    }
  };

  const handleRecommendationClick = (rec: LearningRecommendation) => {
    if (rec.targetTab === 'podcast') {
      openPodcastForContext({
        topic: rec.topic || currentPack.title,
        subject: currentPack.subject,
        sourceType: rec.stage === 'improve' || rec.stage === 'revise' ? 'weak_topics' : 'pack_notes',
      });
    } else if (rec.targetTab === 'casestudy') {
      openCaseStudyForContext({
        topic: rec.topic || currentPack.title,
        subject: currentPack.subject,
      });
    } else {
      setActiveTab(rec.targetTab);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            {user ? `${getGreeting()}, ${user.displayName?.split(' ')[0] || 'Scholar'}` : getGreeting()}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
            Learn visually, listen on the go, solve real cases, and close your knowledge gaps.
          </p>
        </div>

        {/* Quick Streak & Stats Badges */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-xs font-bold tabular-nums">
            <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
            <span>{stats.studyStreakDays} Day Streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold tabular-nums">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{quizAverage}% Quiz Avg</span>
          </div>
        </div>
      </div>

      {/* Optional Google Sign-In Sync Card for Guest Users */}
      {!user && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-blue-200/70 dark:border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Back up your study packs, cases & podcasts to Google Cloud
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Sign in with Google to sync notes, mind maps, case scores, and podcast progress across devices.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shrink-0"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      )}

      {/* Large Hero Input Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-800/40">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="text-xs font-semibold text-indigo-200 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Study Companion</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Enter a topic or upload your study material
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
            Upload PDFs, lecture slides, documents, or type any academic topic. Turn any concept into handwritten notes, mind maps, podcasts, case studies, and quizzes.
          </p>

          <form onSubmit={handleStartTopic} className="space-y-3.5 pt-2">
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none text-indigo-300">
                <BookOpen className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inputTopic}
                onChange={(e) => setInputTopic(e.target.value)}
                placeholder="Enter a topic (e.g. Porter's Five Forces, DuPont Analysis, Quantum Mechanics)..."
                className="w-full py-3.5 pl-11 pr-10 rounded-2xl bg-white/10 dark:bg-slate-950/50 border border-white/20 text-white placeholder:text-indigo-200/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              />
              {inputTopic && (
                <button
                  type="button"
                  onClick={() => setInputTopic('')}
                  className="absolute right-3.5 p-1 rounded-full text-indigo-300 hover:text-white transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-4 h-4 text-indigo-200 shrink-0" />
                <span className="truncate">Upload File</span>
              </button>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <FileText className="w-4 h-4 text-indigo-200 shrink-0" />
                <span className="truncate">Enter Topic</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
                <span className="truncate">Generate Study Pack</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Personalized 6-Stage Learning Loop */}
      <LearningLoopTracker />

      {/* AI Recommendation Engine + Real Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Recommendations */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Recommended Next Steps</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grounded in your real study packs, quiz performance, cases, and listening history
              </p>
            </div>
            {settings.geminiConnected && (
              <button
                type="button"
                onClick={handleRefreshAiRecs}
                disabled={isLoadingRecs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isLoadingRecs ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Ask AI Coach</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {rec.stage}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {rec.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {rec.reason}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRecommendationClick(rec)}
                  className="self-start inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <span>{rec.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Real Activity & Metrics Summary */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Learning Snapshot
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('progress')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Full Analytics
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs tabular-nums">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500 dark:text-slate-400">Study Packs</div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {savedPacks.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500 dark:text-slate-400">Podcasts</div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {podcasts.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500 dark:text-slate-400">Cases Solved</div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {completedCases.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500 dark:text-slate-400">Case Avg Score</div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {avgCaseScore !== null ? `${avgCaseScore}/100` : '—'}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Recent Activity
            </div>
            {stats.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {stats.recentActivities.slice(0, 4).map((act) => (
                  <div key={act.id} className="text-xs flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {act.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {act.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete a quiz, podcast, or case study to build your activity feed.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid (8 Study Tools) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Study Studio Tools
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Active Topic:{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {currentPack.title}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((qa) => (
            <button
              key={qa.title}
              onClick={qa.action}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[116px]"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 shrink-0 ${qa.bg}`}
              >
                {qa.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {qa.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {qa.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Study Packs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Recent Study Packs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pick up where you left off or switch your active study workspace
            </p>
          </div>
          <button
            onClick={() => setActiveTab('packs')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>View All ({savedPacks.length})</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {savedPacks.map((pack) => {
            const isCurrent = pack.id === currentPack.id;
            const resourceCount =
              (pack.handwrittenNotes?.length || 0) +
              (pack.definitions?.length || 0) +
              (pack.concepts?.length || 0) +
              (pack.quiz?.length || 0) +
              (pack.vivaQuestions?.length || 0) +
              (pack.youtubeResources?.length || 0);

            return (
              <div
                key={pack.id}
                className={`relative p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{pack.subject || 'General'}</span>
                      {pack.isDemo && (
                        <>
                          <span className="text-slate-400">·</span>
                          <span className="text-amber-600 dark:text-amber-400 shrink-0">
                            Demo Pack
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => toggleFavorite(pack.id)}
                      className="p-1 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer shrink-0"
                      title={pack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          pack.isFavorite
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 mb-1.5">
                    {pack.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {pack.summary?.quickRevision?.[0] ||
                      'Comprehensive study pack with notes, mind maps, quizzes, and viva prep.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] min-w-0 truncate tabular-nums">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {new Date(pack.createdAt).toLocaleDateString()}
                    </span>
                    <span>·</span>
                    <span className="truncate">{resourceCount} items</span>
                  </div>

                  <button
                    onClick={() => selectPackById(pack.id)}
                    className="shrink-0 flex items-center gap-1 font-semibold text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer ml-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

