import React from 'react';
import { useStudy } from '../context/StudyContext';
import {
  BarChart3,
  Award,
  Flame,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Headphones,
} from 'lucide-react';

export const ProgressDashboardView: React.FC = () => {
  const {
    stats,
    savedPacks,
    caseStudies,
    podcasts,
    setActiveTab,
    openPodcastForContext,
    openCaseStudyForContext,
  } = useStudy();

  const averageScore =
    stats.totalQuizQuestionsSum > 0
      ? Math.round((stats.totalQuizScoreSum / stats.totalQuizQuestionsSum) * 100)
      : 0;

  const completedCases = caseStudies.filter((c) => c.status === 'completed');
  const avgCaseScore =
    completedCases.length > 0
      ? Math.round(
          completedCases.reduce((sum, c) => sum + (c.latestScore || 0), 0) /
            completedCases.length
        )
      : null;

  const completedPodcasts = podcasts.filter((p) => p.isCompleted).length;

  const statCards = [
    {
      title: 'Study Packs',
      value: savedPacks.length,
      subtitle: `${stats.topicsStudied.length} topics covered`,
      icon: <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      title: 'Quiz Accuracy',
      value: `${averageScore}%`,
      subtitle: `${stats.quizzesCompleted} quizzes · ${stats.totalQuizQuestionsSum} Qs`,
      icon: <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      title: 'Case Study Lab',
      value: avgCaseScore !== null ? `${avgCaseScore}/100` : `${completedCases.length}`,
      subtitle: `${completedCases.length} solved · ${caseStudies.length} total cases`,
      icon: <Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      bg: 'bg-teal-50 dark:bg-teal-950/40',
    },
    {
      title: 'Listen & Learn',
      value: `${podcasts.length}`,
      subtitle: `${completedPodcasts} completed · ${stats.studyStreakDays}d streak`,
      icon: <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Academic Performance & Mastery</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real metrics across study packs, audio podcasts, case studies, and retention quizzes
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-300 tabular-nums">
          <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
          <span>{stats.studyStreakDays} Day Study Streak</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.bg}`}>{card.icon}</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {card.value}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Section: Topics Studied vs Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics Studied & Strong Areas */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Topics Studied ({stats.topicsStudied.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Curriculum Coverage</span>
          </div>

          <div className="space-y-2.5">
            {stats.topicsStudied.map((topic, idx) => {
              const isStrong = (stats.strongTopics || []).includes(topic);
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 font-medium text-slate-800 dark:text-slate-200 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                      ✓
                    </span>
                    <span className="truncate">{topic}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {isStrong ? 'Strong Mastery' : 'Covered'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openCaseStudyForContext({ topic })}
                      className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      Practice Case
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak Topics & Revision Actions */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Identified Focus Areas ({stats.weakTopics.length})</span>
            </h3>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              Action Needed
            </span>
          </div>

          {stats.weakTopics.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Great job! No weak topics identified in recent quizzes or cases.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.weakTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-amber-900 dark:text-amber-200 block truncate">
                      {topic}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Recommended for audio revision or targeted quiz drill
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        openPodcastForContext({
                          topic,
                          sourceType: 'weak_topics',
                          sourceContent: `Focused revision on weak topic: ${topic}`,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Revision Podcast
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('quiz')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Drill Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

