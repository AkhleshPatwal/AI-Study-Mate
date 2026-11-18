import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  exportStudyPackBookletToPdf,
  ExportSectionsSelection,
  PdfExportProgress,
} from '../../services/pdfExport';
import {
  FileDown,
  X,
  CheckCircle2,
  BookOpen,
  FileEdit,
  Bookmark,
  Lightbulb,
  HelpCircle,
  Sparkles,
  Printer,
  AlertCircle,
} from 'lucide-react';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({ isOpen, onClose }) => {
  const { currentPack } = useStudy();

  const [sections, setSections] = useState<ExportSectionsSelection>({
    includeCover: true,
    includeSummary: true,
    includeDefinitions: true,
    includeConcepts: true,
    includeNotes: true,
    includeQuiz: true,
    includeExamTopics: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<PdfExportProgress | null>(null);

  if (!isOpen) return null;

  const toggleSection = (key: keyof ExportSectionsSelection) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setPreset = (preset: 'all' | 'notes' | 'summary' | 'definitions') => {
    if (preset === 'all') {
      setSections({
        includeCover: true,
        includeSummary: true,
        includeDefinitions: true,
        includeConcepts: true,
        includeNotes: true,
        includeQuiz: true,
        includeExamTopics: true,
      });
    } else if (preset === 'notes') {
      setSections({
        includeCover: true,
        includeSummary: false,
        includeDefinitions: false,
        includeConcepts: false,
        includeNotes: true,
        includeQuiz: false,
        includeExamTopics: false,
      });
    } else if (preset === 'summary') {
      setSections({
        includeCover: true,
        includeSummary: true,
        includeDefinitions: false,
        includeConcepts: false,
        includeNotes: false,
        includeQuiz: false,
        includeExamTopics: false,
      });
    } else if (preset === 'definitions') {
      setSections({
        includeCover: true,
        includeSummary: false,
        includeDefinitions: true,
        includeConcepts: true,
        includeNotes: false,
        includeQuiz: false,
        includeExamTopics: false,
      });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress({
      status: 'preparing',
      message: 'Starting PDF compilation with jsPDF & html2canvas...',
      progressPercent: 10,
    });

    try {
      await exportStudyPackBookletToPdf(currentPack, sections, (prog) => {
        setProgress(prog);
      });
      setTimeout(() => {
        setIsExporting(false);
        setProgress(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setProgress({
        status: 'error',
        message: err?.message || 'Error creating PDF document.',
        progressPercent: 0,
      });
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Export Printable Study PDF
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate high-resolution A4 printable documents using jsPDF & html2canvas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Target Study Pack Pill */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Target Study Pack
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {currentPack.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentPack.subject || 'General'}
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
              A4 Format
            </span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Quick Selection Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'Full Booklet' },
                { id: 'notes', label: 'Notes Only' },
                { id: 'summary', label: 'Summary Only' },
                { id: 'definitions', label: 'Definitions' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPreset(preset.id as any)}
                  className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-colors text-center cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Module Checkboxes */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Sections to Include in Printable PDF:
            </label>
            <div className="space-y-2">
              {[
                {
                  key: 'includeCover' as const,
                  label: 'Cover Header & Subject Details',
                  desc: 'Includes topic title, academic subject, date and course heading',
                  icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
                },
                {
                  key: 'includeSummary' as const,
                  label: 'Summaries & Rapid Recall Points',
                  desc: 'Top 10 exam points, formal exam notes, and student analogies',
                  icon: <Sparkles className="w-4 h-4 text-amber-500" />,
                },
                {
                  key: 'includeDefinitions' as const,
                  label: 'Important Academic Definitions',
                  desc: 'Formal terminology glossary with practical case examples',
                  icon: <Bookmark className="w-4 h-4 text-emerald-500" />,
                },
                {
                  key: 'includeConcepts' as const,
                  label: 'Core Conceptual Frameworks',
                  desc: 'In-depth conceptual logic and why each matters in real life',
                  icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
                },
                {
                  key: 'includeNotes' as const,
                  label: 'Handwritten-Style Student Revision Notes',
                  desc: 'Student notes with exam tips, mnemonics, and structured takeaways',
                  icon: <FileEdit className="w-4 h-4 text-blue-500" />,
                },
                {
                  key: 'includeQuiz' as const,
                  label: 'Practice Quizzes & Answers Key',
                  desc: 'Self-assessment questions, correct options, and detailed explanations',
                  icon: <HelpCircle className="w-4 h-4 text-purple-500" />,
                },
              ].map((item) => {
                const checked = sections[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleSection(item.key)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      checked
                        ? 'border-indigo-500/80 bg-indigo-50/40 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress / Status display during export */}
          {progress && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  {progress.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : progress.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  )}
                  <span>{progress.message}</span>
                </span>
                <span>{progress.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download Printable PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
