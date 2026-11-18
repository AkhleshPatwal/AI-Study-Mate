import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { exportElementToPdf } from '../services/pdfExport';
import {
  AlignLeft,
  Zap,
  GraduationCap,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  Printer,
  BookOpen,
  FileDown,
  Headphones,
  Briefcase,
} from 'lucide-react';

export const SummaryView: React.FC = () => {
  const { currentPack, openPodcastForContext, openCaseStudyForContext } = useStudy();
  const [summaryMode, setSummaryMode] = useState<'quick' | 'exam' | 'deep'>('quick');
  const [isEasyLanguage, setIsEasyLanguage] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const summary = currentPack.summary || {
    quickRevision: currentPack.keyPoints || [],
    examNotes: '',
    deepLearning: '',
    easyLanguageVersion: '',
  };

  const handleCopy = () => {
    let textToCopy = '';
    if (isEasyLanguage) {
      textToCopy = summary.easyLanguageVersion;
    } else if (summaryMode === 'quick') {
      textToCopy = summary.quickRevision.map((p, i) => `${i + 1}. ${p}`).join('\n');
    } else if (summaryMode === 'exam') {
      textToCopy = summary.examNotes;
    } else {
      textToCopy = summary.deepLearning;
    }

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExportPdf = async () => {
    const el = document.getElementById('summary-content-card');
    if (!el) return;
    setIsExportingPdf(true);
    try {
      await exportElementToPdf(
        el,
        `${currentPack.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_summary.pdf`,
        { title: `${currentPack.title} - Summary` }
      );
    } catch (err) {
      console.error('Failed to export summary to PDF', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlignLeft className="w-5 h-5 text-indigo-600" />
            <span>Multi-Tier Summaries</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between rapid recall, formal university exam notes, and deep industry case learning
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Easy Language Toggle */}
          <button
            onClick={() => setIsEasyLanguage(!isEasyLanguage)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isEasyLanguage
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
            title="Translate academic jargon into conversational plain English"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Easy Language</span>
            {isEasyLanguage ? (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            )}
          </button>

          {/* Copy & Print */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export Summary as PDF using jsPDF & html2canvas"
          >
            {isExportingPdf ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </>
            )}
          </button>

          <button
            onClick={() =>
              openPodcastForContext({
                topic: currentPack.title,
                subject: currentPack.subject,
                sourceType: 'pack_notes',
                sourceContent: [
                  ...(summary.quickRevision || []),
                  summary.examNotes,
                  summary.deepLearning,
                ]
                  .filter(Boolean)
                  .join('\n\n'),
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Listen as Podcast</span>
          </button>

          <button
            onClick={() =>
              openCaseStudyForContext({
                topic: currentPack.title,
                subject: currentPack.subject,
                learningObjective: `Translate core ideas from ${currentPack.title} into applied decision-making`,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/50 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Practice Case</span>
          </button>
        </div>
      </div>

      {/* Mode Tabs (only active if not in Easy Language override) */}
      {!isEasyLanguage && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
          <button
            onClick={() => setSummaryMode('quick')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              summaryMode === 'quick'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Quick Revision (Max 10 Points)</span>
          </button>

          <button
            onClick={() => setSummaryMode('exam')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              summaryMode === 'exam'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Exam Notes (Structured)</span>
          </button>

          <button
            onClick={() => setSummaryMode('deep')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              summaryMode === 'deep'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Deep Learning & Cases</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div
        id="summary-content-card"
        className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs print-area"
      >
        {isEasyLanguage ? (
          /* Easy Language Student Friendly Version */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  Student-Friendly Explanation Active
                </h4>
                <p className="text-xs text-amber-800/90 dark:text-amber-300">
                  Rewritten in simple conversational terms with everyday analogies, without altering fundamental academic definitions.
                </p>
              </div>
            </div>

            <div className="text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-medium pt-2">
              {summary.easyLanguageVersion ||
                summary.deepLearning ||
                summary.examNotes ||
                'No simplified summary available.'}
            </div>
          </div>
        ) : summaryMode === 'quick' ? (
          /* Quick Revision (Max 10 Points) */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                10 Must-Remember Points for Exams:
              </span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                {summary.quickRevision?.length || 0} Key Takeaways
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {summary.quickRevision?.map((point, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : summaryMode === 'exam' ? (
          /* Academic Exam Notes */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Formal Academic Examination Synthesis
              </span>
              <span className="text-xs text-slate-500">
                Standard format for 10-15 mark exam questions
              </span>
            </div>
            <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
              {summary.examNotes || 'No formal exam notes provided.'}
            </div>
          </div>
        ) : (
          /* Deep Learning & Cases */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Executive & Corporate Strategy Deep Dive
              </span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                Industry Applications & Nuances
              </span>
            </div>
            <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
              {summary.deepLearning || 'No deep learning notes provided.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
