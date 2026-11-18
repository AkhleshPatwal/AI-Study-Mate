import React, { useEffect, useMemo, useState } from 'react';
import { useStudy } from '../context/StudyContext';
import {
  CaseStudy,
  CaseStudyCategory,
  CaseStudyDifficulty,
  CaseStudyLength,
} from '../types/study';
import {
  evaluateCaseFollowUpApi,
  evaluateCaseStudyApi,
  generateCaseStudyApi,
} from '../services/api';
import {
  Briefcase,
  Sparkles,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Users,
  BarChart3,
  Lightbulb,
  Loader2,
  Trash2,
  Play,
  BookOpen,
  Headphones,
  FileEdit,
  Award,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';

const DIFFICULTIES: CaseStudyDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
const CASE_CATEGORIES: CaseStudyCategory[] = [
  'Business',
  'Marketing',
  'Finance',
  'HR',
  'Retail',
  'Operations',
  'Entrepreneurship',
  'Technology',
  'Economics',
  'General',
];
const LENGTHS: CaseStudyLength[] = ['Short', 'Medium', 'Detailed'];

const CRITERIA_LABELS: { key: keyof CaseStudy['attempts'][0]['evaluation']['criteriaScores']; label: string }[] = [
  { key: 'problemIdentification', label: 'Problem Identification' },
  { key: 'conceptualUnderstanding', label: 'Conceptual Understanding' },
  { key: 'analyticalThinking', label: 'Analytical Thinking' },
  { key: 'logicalReasoning', label: 'Logical Reasoning' },
  { key: 'theoreticalApplication', label: 'Theoretical Application' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'practicalFeasibility', label: 'Practical Feasibility' },
  { key: 'decisionQuality', label: 'Decision-Making Quality' },
  { key: 'justification', label: 'Justification & Evidence' },
];

export const CaseStudyLabView: React.FC = () => {
  const {
    currentPack,
    caseStudies,
    activeCaseStudy,
    setActiveCaseStudy,
    saveCaseStudy,
    deleteCaseStudy,
    toggleCaseBookmark,
    recordCaseStudyEvaluation,
    caseStudyPrefill,
    clearCaseStudyPrefill,
    openPodcastForContext,
    setActiveTab,
    settings,
  } = useStudy();

  const [subView, setSubView] = useState<'workspace' | 'generator' | 'library'>(() =>
    activeCaseStudy ? 'workspace' : 'generator'
  );

  // Generator form state
  const [topic, setTopic] = useState(currentPack.title || '');
  const [subject, setSubject] = useState(currentPack.subject || 'Business Strategy');
  const [difficulty, setDifficulty] = useState<CaseStudyDifficulty>('Intermediate');
  const [caseType, setCaseType] = useState<CaseStudyCategory>('Business');
  const [length, setLength] = useState<CaseStudyLength>('Medium');
  const [learningObjective, setLearningObjective] = useState('');
  const [linkToCurrentPack, setLinkToCurrentPack] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Interactive case draft state
  const [selectedDecisionId, setSelectedDecisionId] = useState('');
  const [identifiedProblem, setIdentifiedProblem] = useState('');
  const [studentSolution, setStudentSolution] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [selectedAttemptIdx, setSelectedAttemptIdx] = useState<number>(0);
  const [showModelAnswers, setShowModelAnswers] = useState<'recommended' | 'excellent' | null>(
    'recommended'
  );
  const [isWritingNewAttempt, setIsWritingNewAttempt] = useState(false);

  // Follow-up state
  const [followUpDrafts, setFollowUpDrafts] = useState<Record<string, string>>({});
  const [followUpLoadingId, setFollowUpLoadingId] = useState<string | null>(null);
  const [showFollowUpHint, setShowFollowUpHint] = useState<Record<string, boolean>>({});

  // Library filters
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | CaseStudyDifficulty>('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'not_started' | 'in_progress' | 'completed' | 'bookmarked'
  >('all');

  // Consume cross-tool prefill
  useEffect(() => {
    if (caseStudyPrefill) {
      if (caseStudyPrefill.topic) setTopic(caseStudyPrefill.topic);
      if (caseStudyPrefill.subject) setSubject(caseStudyPrefill.subject);
      if (caseStudyPrefill.learningObjective)
        setLearningObjective(caseStudyPrefill.learningObjective);
      setSubView('generator');
      clearCaseStudyPrefill();
    }
  }, [caseStudyPrefill, clearCaseStudyPrefill]);

  // Sync draft form when activeCaseStudy changes
  useEffect(() => {
    if (!activeCaseStudy) return;
    setSelectedDecisionId(activeCaseStudy.draftSelectedDecisionId || '');
    setIdentifiedProblem(activeCaseStudy.draftIdentifiedProblem || '');
    setStudentSolution(activeCaseStudy.draftSolution || '');
    setReasoning(activeCaseStudy.draftReasoning || '');
    setEvalError(null);
    setSelectedAttemptIdx(0);
    setIsWritingNewAttempt((activeCaseStudy.attempts?.length || 0) === 0);
  }, [activeCaseStudy?.id]);

  const persistDraft = (
    updates: Partial<
      Pick<
        CaseStudy,
        | 'draftSelectedDecisionId'
        | 'draftIdentifiedProblem'
        | 'draftSolution'
        | 'draftReasoning'
        | 'status'
      >
    >
  ) => {
    if (!activeCaseStudy) return;
    const nextStatus =
      activeCaseStudy.status === 'completed'
        ? 'completed'
        : updates.status || 'in_progress';
    saveCaseStudy({
      ...activeCaseStudy,
      ...updates,
      status: nextStatus,
    });
  };

  const handleGenerateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setGenError('Please enter a topic or concept for the case study.');
      return;
    }
    setGenError(null);
    setIsGenerating(true);

    const studyPackContext =
      linkToCurrentPack && currentPack
        ? [
            currentPack.summary?.examNotes || '',
            currentPack.summary?.deepLearning || '',
            ...(currentPack.concepts || []).map((c) => `${c.concept}: ${c.simpleExplanation}`),
          ]
            .filter(Boolean)
            .join('\n')
        : undefined;

    const result = await generateCaseStudyApi({
      topic: topic.trim(),
      subject: subject.trim() || caseType,
      difficulty,
      caseType,
      length,
      learningObjective: learningObjective.trim() || undefined,
      studyPackContext,
    });

    setIsGenerating(false);

    if (result.success && result.caseStudy) {
      const created: CaseStudy = {
        ...result.caseStudy,
        studyPackId: linkToCurrentPack ? currentPack.id : undefined,
      };
      saveCaseStudy(created, { countAsCreated: true });
      setActiveCaseStudy(created);
      setSubView('workspace');
    } else {
      setGenError(result.error || 'Could not generate case study.');
    }
  };

  const handleSelectDecision = (optId: string) => {
    setSelectedDecisionId(optId);
    persistDraft({ draftSelectedDecisionId: optId, status: 'in_progress' });
  };

  const handleSubmitResponse = async () => {
    if (!activeCaseStudy) return;
    if (!selectedDecisionId) {
      setEvalError('Please select a strategic decision option first.');
      return;
    }
    if (!studentSolution.trim() || studentSolution.trim().length < 25) {
      setEvalError('Please write a thoughtful solution (at least a couple of sentences) so the AI evaluator can grade your analysis fairly.');
      return;
    }

    setEvalError(null);
    setIsEvaluating(true);

    const result = await evaluateCaseStudyApi({
      caseStudy: activeCaseStudy,
      selectedDecisionId,
      identifiedProblem: identifiedProblem.trim(),
      studentSolution: studentSolution.trim(),
      reasoning: reasoning.trim(),
    });

    setIsEvaluating(false);

    if (result.success && result.evaluation) {
      const chosenOption = activeCaseStudy.decisionOptions.find(
        (o) => o.id === selectedDecisionId
      );
      const newAttempt = {
        id: `att-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        selectedDecisionId,
        selectedDecisionTitle: chosenOption?.title || 'Selected Decision',
        identifiedProblem: identifiedProblem.trim(),
        studentSolution: studentSolution.trim(),
        reasoning: reasoning.trim(),
        evaluation: result.evaluation,
      };

      const isFirstCompletion = activeCaseStudy.status !== 'completed';
      const updatedCase: CaseStudy = {
        ...activeCaseStudy,
        status: 'completed',
        draftSelectedDecisionId: selectedDecisionId,
        draftIdentifiedProblem: identifiedProblem.trim(),
        draftSolution: studentSolution.trim(),
        draftReasoning: reasoning.trim(),
        attempts: [newAttempt, ...(activeCaseStudy.attempts || [])],
        latestScore: result.evaluation.overallScore,
        followUpQuestions:
          result.followUpQuestions && result.followUpQuestions.length > 0
            ? result.followUpQuestions
            : activeCaseStudy.followUpQuestions,
      };

      saveCaseStudy(updatedCase);
      setActiveCaseStudy(updatedCase);
      setSelectedAttemptIdx(0);
      setIsWritingNewAttempt(false);
      recordCaseStudyEvaluation(updatedCase, result.evaluation.overallScore, isFirstCompletion);
    } else {
      setEvalError(result.error || 'Could not evaluate your solution. Please try again.');
    }
  };

  const handleSubmitFollowUp = async (fqId: string) => {
    if (!activeCaseStudy) return;
    const fq = activeCaseStudy.followUpQuestions.find((q) => q.id === fqId);
    const answerText = (followUpDrafts[fqId] || '').trim();
    if (!fq || !answerText) return;

    setFollowUpLoadingId(fqId);
    const latestAttempt = activeCaseStudy.attempts?.[0];

    const res = await evaluateCaseFollowUpApi({
      caseTitle: activeCaseStudy.title,
      topic: activeCaseStudy.topic,
      difficulty: activeCaseStudy.difficulty,
      scenarioTwist: fq.scenarioTwist,
      question: fq.question,
      studentSolution: latestAttempt?.studentSolution || studentSolution,
      followUpAnswer: answerText,
    });

    setFollowUpLoadingId(null);

    if (res.success) {
      const updatedQuestions = activeCaseStudy.followUpQuestions.map((item) =>
        item.id === fqId
          ? {
              ...item,
              studentResponse: answerText,
              feedback: res.feedback,
              followUpScore: res.followUpScore,
              evaluatedAt: new Date().toISOString(),
            }
          : item
      );
      const updatedCase: CaseStudy = {
        ...activeCaseStudy,
        followUpQuestions: updatedQuestions,
      };
      saveCaseStudy(updatedCase);
      setActiveCaseStudy(updatedCase);
    }
  };

  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set(caseStudies.map((c) => c.subject).filter(Boolean)));
  }, [caseStudies]);

  const filteredLibrary = useMemo(() => {
    return caseStudies.filter((c) => {
      if (filterSubject !== 'all' && c.subject !== filterSubject) return false;
      if (filterDifficulty !== 'all' && c.difficulty !== filterDifficulty) return false;
      if (filterStatus === 'bookmarked' && !c.isBookmarked) return false;
      if (
        filterStatus !== 'all' &&
        filterStatus !== 'bookmarked' &&
        c.status !== filterStatus
      ) {
        return false;
      }
      return true;
    });
  }, [caseStudies, filterSubject, filterDifficulty, filterStatus]);

  const completedCases = caseStudies.filter((c) => typeof c.latestScore === 'number');
  const avgCaseScore =
    completedCases.length > 0
      ? Math.round(
          completedCases.reduce((sum, c) => sum + (c.latestScore || 0), 0) /
            completedCases.length
        )
      : null;

  const chosenOptionObj = activeCaseStudy?.decisionOptions.find(
    (o) => o.id === selectedDecisionId
  );
  const currentAttempt = activeCaseStudy?.attempts?.[selectedAttemptIdx];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Workspace Switcher */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Case Study Lab</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Step into real-world decisions, weigh tradeoffs, and receive rubric-based AI coaching
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setSubView('generator')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              subView === 'generator'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            + New Case Study
          </button>
          <button
            type="button"
            onClick={() => setSubView('workspace')}
            disabled={!activeCaseStudy}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 ${
              subView === 'workspace'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active Case
          </button>
          <button
            type="button"
            onClick={() => setSubView('library')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
              subView === 'library'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Library ({caseStudies.length})
          </button>
        </div>
      </div>

      {/* 1. CASE STUDY GENERATOR */}
      {subView === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <form
            onSubmit={handleGenerateCase}
            className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Configure Real-World Case Scenario
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Solutions remain hidden until you commit to a strategy and justify your plan
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTopic(currentPack.title);
                  setSubject(currentPack.subject || 'Business');
                  setLinkToCurrentPack(true);
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                Prefill from "{currentPack.title}"
              </button>
            </div>

            {!settings.geminiConnected && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Gemini API connection is needed to generate custom case studies.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold cursor-pointer whitespace-nowrap"
                >
                  Settings
                </button>
              </div>
            )}

            {genError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{genError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Topic or Concept *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Ansoff Matrix, Pricing Elasticity, Supply Chain Bottlenecks..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subject / Domain
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Strategic Marketing, Corporate Finance"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Case Category
                </label>
                <select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value as CaseStudyCategory)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {CASE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        difficulty === diff
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Case Length
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {LENGTHS.map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setLength(len)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        length === len
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Optional Learning Objective
              </label>
              <input
                type="text"
                value={learningObjective}
                onChange={(e) => setLearningObjective(e.target.value)}
                placeholder="e.g. Evaluate market entry risks vs margin dilution under a tight Q3 budget"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={linkToCurrentPack}
                onChange={(e) => setLinkToCurrentPack(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0"
              />
              <span>
                Integrate concepts & notes from active study pack ({currentPack.title})
              </span>
            </label>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Crafting Realistic Case Scenario...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Interactive Case Study</span>
                </>
              )}
            </button>
          </form>

          {/* Right Sidebar Guide */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              How Case Study Lab Works
            </h4>
            <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                <span className="font-bold text-slate-900 dark:text-white">1. Analyze the Briefing: </span>
                Review company financials, constraints, and conflicting stakeholder goals.
              </li>
              <li>
                <span className="font-bold text-slate-900 dark:text-white">2. Commit & Simulate: </span>
                Pick a strategic path to see immediate consequences and secondary dilemmas unfold.
              </li>
              <li>
                <span className="font-bold text-slate-900 dark:text-white">3. Defend Your Plan: </span>
                Diagnose the root problem and write your justified solution in your own words.
              </li>
              <li>
                <span className="font-bold text-slate-900 dark:text-white">4. 100-Point Rubric & Twists: </span>
                Get graded across 9 reasoning dimensions, inspect a model answer, and tackle adaptive what-if follow-ups.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* 2. ACTIVE INTERACTIVE CASE WORKSPACE */}
      {subView === 'workspace' && activeCaseStudy && (
        <div className="space-y-6">
          {/* Case Briefing Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5 min-w-0">
                <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-2 flex-wrap">
                  <span>{activeCaseStudy.caseType}</span>
                  <span className="text-slate-400">·</span>
                  <span>{activeCaseStudy.difficulty}</span>
                  <span className="text-slate-400">·</span>
                  <span>{activeCaseStudy.subject}</span>
                  <span className="text-slate-400">·</span>
                  <span>Role: {activeCaseStudy.roleTitle}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {activeCaseStudy.title}
                </h3>
                {activeCaseStudy.learningObjective && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Learning Objective: {activeCaseStudy.learningObjective}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleCaseBookmark(activeCaseStudy.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeCaseStudy.isBookmarked
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${activeCaseStudy.isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
                  />
                  <span>{activeCaseStudy.isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openPodcastForContext({
                      topic: activeCaseStudy.topic,
                      subject: activeCaseStudy.subject,
                      sourceType: 'document_text',
                      sourceContent: `${activeCaseStudy.title}\n\n${activeCaseStudy.companyBackground}\n\nChallenge: ${activeCaseStudy.mainProblem}`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Headphones className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Turn into Podcast</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileEdit className="w-3.5 h-3.5 text-blue-500" />
                  <span>Study Notes</span>
                </button>
              </div>
            </div>

            {/* Background, Industry, Main Problem */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Company & Scenario Background
                </h4>
                <p className="whitespace-pre-line">{activeCaseStudy.companyBackground}</p>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-2">
                  Industry & Market Context
                </h4>
                <p className="whitespace-pre-line">{activeCaseStudy.industryAndContext}</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Central Problem Statement
                  </h4>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {activeCaseStudy.mainProblem}
                  </p>
                </div>

                {activeCaseStudy.complications?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Competing Priorities & Complications
                    </h4>
                    <ul className="space-y-1.5 list-disc pl-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {activeCaseStudy.complications.map((comp, idx) => (
                        <li key={idx}>{comp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Facts, Data & Constraints */}
            {activeCaseStudy.factsAndData?.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <span>Relevant Data, Figures & Constraints</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeCaseStudy.dataDisclaimer}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeCaseStudy.factsAndData.map((dp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {dp.label}
                        </span>
                        <span
                          className={`font-semibold shrink-0 ${
                            dp.dataType === 'verified_context'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {dp.dataType === 'verified_context' ? 'Verified Context' : 'Illustrative Data'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {dp.value}
                      </div>
                      {dp.sourceNote && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {dp.sourceNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stakeholders */}
            {activeCaseStudy.stakeholders?.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Key Stakeholders</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeCaseStudy.stakeholders.map((st, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-900 dark:text-white">{st.name}</div>
                      <div className="text-indigo-600 dark:text-indigo-400 font-medium">{st.role}</div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{st.priority}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Decision & Submission Workspace */}
          {(isWritingNewAttempt || !currentAttempt) && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Interactive Decision & Strategy Workbench
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeCaseStudy.decisionSituation}
                  </p>
                </div>
                {activeCaseStudy.attempts?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsWritingNewAttempt(false)}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer shrink-0"
                  >
                    View Previous Evaluation
                  </button>
                )}
              </div>

              {/* Step 1: Decision Paths */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Step 1 · Choose Your Primary Strategic Path
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {activeCaseStudy.decisionOptions.map((opt) => {
                    const isSelected = selectedDecisionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectDecision(opt.id)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 hover:border-indigo-400'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {opt.title}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {opt.summary}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">Tradeoff:</span> {opt.strategicTradeoff}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Branching Simulation Consequence Box */}
                {chosenOptionObj && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-indigo-200 dark:border-indigo-800/70 space-y-2.5 text-xs">
                    <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Simulation Update After Choosing "{chosenOptionObj.title}"</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                      <span className="font-semibold">Immediate Outcome: </span>
                      {chosenOptionObj.consequencePreview}
                    </p>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                      <span className="font-semibold">Stakeholder Reaction: </span>
                      {chosenOptionObj.stakeholderImpact}
                    </p>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                      <span className="font-semibold">New Execution Dilemma to Address: </span>
                      {chosenOptionObj.nextDilemma}
                    </p>
                  </div>
                )}
              </div>

              {/* Guiding Questions */}
              {activeCaseStudy.guidingQuestions?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-500" />
                    <span>Questions to Address in Your Written Analysis</span>
                  </div>
                  <ul className="space-y-1 list-disc pl-5 text-xs text-slate-600 dark:text-slate-300">
                    {activeCaseStudy.guidingQuestions.map((gq, idx) => (
                      <li key={idx}>{gq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step 2: Written Analysis */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Step 2 · Diagnose & Write Your Solution
                </div>

                {evalError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{evalError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    1. Core Problem Identified
                  </label>
                  <textarea
                    rows={2}
                    value={identifiedProblem}
                    onChange={(e) => {
                      setIdentifiedProblem(e.target.value);
                      persistDraft({ draftIdentifiedProblem: e.target.value });
                    }}
                    placeholder="In 1-3 sentences, what is the true root bottleneck or strategic risk beneath the surface symptoms?"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    2. Your Proposed Solution & Action Plan *
                  </label>
                  <textarea
                    rows={4}
                    value={studentSolution}
                    onChange={(e) => {
                      setStudentSolution(e.target.value);
                      persistDraft({ draftSolution: e.target.value });
                    }}
                    placeholder="Lay out your concrete action plan, timeline/phasing, resource allocation, and how you will resolve the stakeholder & execution dilemma..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    3. Supporting Reasoning & Theoretical Application
                  </label>
                  <textarea
                    rows={3}
                    value={reasoning}
                    onChange={(e) => {
                      setReasoning(e.target.value);
                      persistDraft({ draftReasoning: e.target.value });
                    }}
                    placeholder={`Explain WHY your plan works using evidence from the case figures and concepts from ${activeCaseStudy.topic}...`}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Draft saves automatically · Multiple valid approaches accepted when logically defended
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmitResponse}
                    disabled={isEvaluating}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Evaluating Solution...</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>Submit for AI Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Breakdown & Adaptive Follow-Up Challenge (Visible after submission) */}
          {currentAttempt && !isWritingNewAttempt && (
            <div className="space-y-6">
              {/* Attempt Selector + Score Banner */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Evaluation Complete · Decision: {currentAttempt.selectedDecisionTitle}
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                      AI Case Evaluation & Rubric Feedback
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {activeCaseStudy.attempts.length > 1 && (
                      <select
                        value={selectedAttemptIdx}
                        onChange={(e) => setSelectedAttemptIdx(Number(e.target.value))}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {activeCaseStudy.attempts.map((att, idx) => (
                          <option key={att.id} value={idx}>
                            Attempt {activeCaseStudy.attempts.length - idx} ({att.evaluation.overallScore}/100)
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsWritingNewAttempt(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-Attempt Case</span>
                    </button>
                  </div>
                </div>

                {/* Overall Score + 9 Rubric Criteria */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Overall Score
                    </div>
                    <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {currentAttempt.evaluation.overallScore}
                      <span className="text-xl text-slate-400 font-bold">/100</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 text-left">
                      {currentAttempt.evaluation.overallEvaluation}
                    </p>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {CRITERIA_LABELS.map((crit) => {
                      const val = currentAttempt.evaluation.criteriaScores[crit.key] ?? 0;
                      return (
                        <div
                          key={crit.key}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate pr-1">
                              {crit.label}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                              {val}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                val >= 80
                                  ? 'bg-emerald-500'
                                  : val >= 60
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${val}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Strengths / Missing / Weak Reasoning / Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300">
                      Strengths in Your Answer
                    </h4>
                    <ul className="space-y-1 list-disc pl-4 text-slate-700 dark:text-slate-300">
                      {currentAttempt.evaluation.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
                    <h4 className="font-bold text-amber-800 dark:text-amber-300">
                      Missing Considerations
                    </h4>
                    <ul className="space-y-1 list-disc pl-4 text-slate-700 dark:text-slate-300">
                      {currentAttempt.evaluation.missingConsiderations.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 space-y-2">
                    <h4 className="font-bold text-rose-800 dark:text-rose-300">
                      Weak Reasoning or Risky Assumptions
                    </h4>
                    <ul className="space-y-1 list-disc pl-4 text-slate-700 dark:text-slate-300">
                      {currentAttempt.evaluation.weakReasoning.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-300">
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-1 list-disc pl-4 text-slate-700 dark:text-slate-300">
                      {currentAttempt.evaluation.areasForImprovement.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Model Solution, Excellent Answer, Lessons Learned */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setShowModelAnswers(
                          showModelAnswers === 'recommended' ? null : 'recommended'
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        showModelAnswers === 'recommended'
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>Recommended Solution</span>
                      {showModelAnswers === 'recommended' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setShowModelAnswers(showModelAnswers === 'excellent' ? null : 'excellent')
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        showModelAnswers === 'excellent'
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>Excellent Answer Example</span>
                      {showModelAnswers === 'excellent' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {showModelAnswers === 'recommended' && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {currentAttempt.evaluation.recommendedSolution}
                    </div>
                  )}

                  {showModelAnswers === 'excellent' && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {currentAttempt.evaluation.excellentAnswerExample}
                    </div>
                  )}

                  {currentAttempt.evaluation.lessonsLearned?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Key Lessons Learned
                      </h4>
                      <ul className="space-y-1 list-disc pl-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {currentAttempt.evaluation.lessonsLearned.map((lesson, i) => (
                          <li key={i}>{lesson}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Adaptive Follow-Up Challenge */}
              {activeCaseStudy.followUpQuestions?.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <span>Adaptive Follow-Up Challenge</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Stress-test your decision against sudden real-world curveballs tailored to your answer
                    </p>
                  </div>

                  <div className="space-y-4">
                    {activeCaseStudy.followUpQuestions.map((fq, idx) => (
                      <div
                        key={fq.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              Scenario Twist {idx + 1} · {fq.scenarioTwist}
                            </span>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {fq.question}
                            </p>
                          </div>
                          {fq.followUpScore !== undefined && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                              Score: {fq.followUpScore}/100
                            </span>
                          )}
                        </div>

                        {fq.hint && (
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                setShowFollowUpHint((p) => ({ ...p, [fq.id]: !p[fq.id] }))
                              }
                              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              {showFollowUpHint[fq.id] ? 'Hide Hint' : 'Show Thinking Hint'}
                            </button>
                            {showFollowUpHint[fq.id] && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                                Hint: {fq.hint}
                              </p>
                            )}
                          </div>
                        )}

                        {fq.feedback ? (
                          <div className="space-y-2 text-xs">
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                              <span className="font-bold block mb-0.5">Your Adaptation:</span>
                              {fq.studentResponse}
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                                AI Coach Feedback:
                              </span>
                              {fq.feedback}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              value={followUpDrafts[fq.id] || ''}
                              onChange={(e) =>
                                setFollowUpDrafts((p) => ({ ...p, [fq.id]: e.target.value }))
                              }
                              placeholder="How would you adapt your strategy under this new constraint?"
                              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              disabled={
                                followUpLoadingId === fq.id || !(followUpDrafts[fq.id] || '').trim()
                              }
                              onClick={() => handleSubmitFollowUp(fq.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                            >
                              {followUpLoadingId === fq.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Scoring Adaptation...</span>
                                </>
                              ) : (
                                <span>Evaluate Adaptation</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. CASE STUDY LIBRARY & PERFORMANCE TRACKING */}
      {subView === 'library' && (
        <div className="space-y-6">
          {/* Performance Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Saved Case Studies
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                {caseStudies.length}
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Completed Cases
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                {caseStudies.filter((c) => c.status === 'completed').length}
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Average Evaluation Score
              </div>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
                {avgCaseScore !== null ? `${avgCaseScore}/100` : '—'}
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center gap-3">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>

            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Difficulties</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="not_started">Not Started</option>
              <option value="bookmarked">Bookmarked</option>
            </select>
          </div>

          {/* Library List */}
          {filteredLibrary.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No case studies match your filters yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Generate your first interactive business, engineering, or policy case study to practice applying theory to real constraints.
              </p>
              <button
                type="button"
                onClick={() => setSubView('generator')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create First Case Study</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLibrary.map((cs) => {
                const attemptCount = cs.attempts?.length || 0;
                const firstAttemptScore =
                  attemptCount > 1 ? cs.attempts[attemptCount - 1].evaluation.overallScore : null;
                const delta =
                  firstAttemptScore !== null && typeof cs.latestScore === 'number'
                    ? cs.latestScore - firstAttemptScore
                    : null;

                return (
                  <div
                    key={cs.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 flex-wrap">
                          <span>{cs.caseType}</span>
                          <span className="text-slate-400">·</span>
                          <span>{cs.difficulty}</span>
                          <span className="text-slate-400">·</span>
                          <span className="capitalize">{cs.status.replace('_', ' ')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCaseBookmark(cs.id)}
                          className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer shrink-0"
                          title="Bookmark case"
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              cs.isBookmarked ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                        {cs.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {cs.mainProblem}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="tabular-nums text-slate-600 dark:text-slate-300">
                        {typeof cs.latestScore === 'number' ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Score: {cs.latestScore}/100
                            {delta !== null && delta !== 0 && (
                              <span className="ml-1.5 text-[11px] text-indigo-500">
                                ({delta > 0 ? `+${delta}` : delta})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {new Date(cs.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => deleteCaseStudy(cs.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="Delete case study"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCaseStudy(cs);
                            setSubView('workspace');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer whitespace-nowrap"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>
                            {cs.status === 'completed'
                              ? 'Revisit'
                              : cs.status === 'in_progress'
                              ? 'Resume'
                              : 'Start'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
