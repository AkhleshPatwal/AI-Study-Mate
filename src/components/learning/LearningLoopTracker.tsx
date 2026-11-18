import React from 'react';
import { useStudy, NavigationTab } from '../../context/StudyContext';
import {
  FileEdit,
  Headphones,
  Briefcase,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface LoopStep {
  id: string;
  label: string;
  subtitle: string;
  tab: NavigationTab;
  completed: boolean;
  icon: React.ReactNode;
  onAction: () => void;
}

export const LearningLoopTracker: React.FC = () => {
  const {
    currentPack,
    podcasts,
    caseStudies,
    stats,
    setActiveTab,
    openPodcastForContext,
    openCaseStudyForContext,
  } = useStudy();

  const normalizedTopic = currentPack.title.toLowerCase();

  const hasNotesAndMap =
    (currentPack.handwrittenNotes?.length || 0) > 0 && Boolean(currentPack.mindMap);

  const topicPodcasts = podcasts.filter(
    (p) =>
      p.studyPackId === currentPack.id ||
      p.topic.toLowerCase().includes(normalizedTopic) ||
      normalizedTopic.includes(p.topic.toLowerCase())
  );
  const hasPodcast = topicPodcasts.length > 0;
  const hasCompletedPodcast = topicPodcasts.some((p) => p.isCompleted);

  const topicCases = caseStudies.filter(
    (c) =>
      c.studyPackId === currentPack.id ||
      c.topic.toLowerCase().includes(normalizedTopic) ||
      normalizedTopic.includes(c.topic.toLowerCase())
  );
  const hasCaseCompleted = topicCases.some((c) => c.status === 'completed');

  const hasTestedQuiz = stats.quizzesCompleted > 0 && stats.topicsStudied.includes(currentPack.title);
  const hasWeakToImprove = (stats.weakTopics?.length || 0) > 0;

  const steps: LoopStep[] = [
    {
      id: 'learn',
      label: '1. Learn',
      subtitle: 'Notes & Mind Map',
      tab: 'notes',
      completed: hasNotesAndMap,
      icon: <FileEdit className="w-4 h-4" />,
      onAction: () => setActiveTab('notes'),
    },
    {
      id: 'listen',
      label: '2. Listen',
      subtitle: hasPodcast ? `${topicPodcasts.length} episode` : 'AI Podcast',
      tab: 'podcast',
      completed: hasCompletedPodcast || hasPodcast,
      icon: <Headphones className="w-4 h-4" />,
      onAction: () =>
        openPodcastForContext({
          topic: currentPack.title,
          subject: currentPack.subject,
          sourceType: 'pack_notes',
          sourceContent: [
            currentPack.summary?.examNotes || '',
            ...(currentPack.handwrittenNotes || []).map((n) => `${n.heading}: ${n.content}`),
          ]
            .filter(Boolean)
            .join('\n\n'),
        }),
    },
    {
      id: 'apply',
      label: '3. Apply',
      subtitle: hasCaseCompleted ? 'Case solved' : 'Case Study Lab',
      tab: 'casestudy',
      completed: hasCaseCompleted,
      icon: <Briefcase className="w-4 h-4" />,
      onAction: () =>
        openCaseStudyForContext({
          topic: currentPack.title,
          subject: currentPack.subject,
        }),
    },
    {
      id: 'test',
      label: '4. Test',
      subtitle: 'Quiz & Viva',
      tab: 'quiz',
      completed: hasTestedQuiz,
      icon: <HelpCircle className="w-4 h-4" />,
      onAction: () => setActiveTab('quiz'),
    },
    {
      id: 'improve',
      label: '5. Improve',
      subtitle: hasWeakToImprove ? `${stats.weakTopics.length} focus areas` : 'Gap review',
      tab: 'progress',
      completed: !hasWeakToImprove && hasTestedQuiz,
      icon: <TrendingUp className="w-4 h-4" />,
      onAction: () => setActiveTab('progress'),
    },
    {
      id: 'revise',
      label: '6. Revise',
      subtitle: '3-min revision',
      tab: 'summary',
      completed: hasCompletedPodcast && hasCaseCompleted,
      icon: <RotateCcw className="w-4 h-4" />,
      onAction: () =>
        openPodcastForContext({
          topic: currentPack.title,
          subject: currentPack.subject,
          sourceType: stats.weakTopics.length > 0 ? 'weak_topics' : 'pack_notes',
          sourceContent:
            stats.weakTopics.length > 0
              ? `Focus revision on weak areas: ${stats.weakTopics.join(', ')}\n\nCore notes:\n${currentPack.summary?.quickRevision?.join('\n') || ''}`
              : currentPack.summary?.quickRevision?.join('\n') || '',
        }),
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
            Learning Journey · {currentPack.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Move seamlessly from concepts to audio, real-world decisions, and retention checkups
          </p>
        </div>
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0">
          {completedCount}/6 stages active
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={step.onAction}
            className={`group p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[82px] ${
              step.completed
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 hover:border-emerald-400'
                : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span
                className={`${
                  step.completed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {step.icon}
              </span>
              {step.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
              )}
            </div>
            <div className="mt-2 min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {step.label}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {step.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
