import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { exportElementToPdf } from '../services/pdfExport';
import {
  Printer,
  Download,
  FileDown,
  Layers,
  Sparkles,
  Info,
  BookOpen,
  CheckCircle,
  Lightbulb,
  AlertTriangle,
  Headphones,
  Briefcase,
} from 'lucide-react';

export const HandwrittenNotesView: React.FC = () => {
  const { currentPack, setIsExportPdfModalOpen, openPodcastForContext, openCaseStudyForContext } = useStudy();
  const [viewMode, setViewMode] = useState<'compact' | 'detailed' | 'exam'>('detailed');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const notes = currentPack.handwrittenNotes || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    const el = document.getElementById('handwritten-notes-paper');
    if (!el) return;
    setIsExportingPdf(true);
    try {
      await exportElementToPdf(
        el,
        `${currentPack.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_notes.pdf`,
        { title: `${currentPack.title} - Notes` }
      );
    } catch (err) {
      console.error('Failed to export notes to PDF', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadText = () => {
    let content = `AI StudyMate - Handwritten Revision Notes\n`;
    content += `Topic: ${currentPack.title}\n`;
    content += `Subject: ${currentPack.subject || 'General'}\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `----------------------------------------------------\n\n`;

    notes.forEach((note, i) => {
      content += `SECTION ${i + 1}: ${note.heading}\n`;
      if (note.subheading) content += `Subheading: ${note.subheading}\n`;
      content += `${note.content}\n`;
      if (note.keyFormulasOrRules?.length) {
        content += `\nKey Rules/Formulas:\n`;
        note.keyFormulasOrRules.forEach((r) => (content += ` - ${r}\n`));
      }
      if (note.examTip) {
        content += `\nExam Tip: ${note.examTip}\n`;
      }
      content += `\n====================================================\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentPack.title.toLowerCase().replace(/\s+/g, '_')}_notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Bar / Controls (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Student Revision Notebook</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {currentPack.title}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            HTML/CSS notebook-paper styling designed for high-retention visual exam revision
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['compact', 'detailed', 'exam'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {mode === 'exam' ? 'Exam Revision' : mode}
              </button>
            ))}
          </div>

          {/* Export Actions */}
          <button
            onClick={handleDownloadText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Download Notes as Text File"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Print or Save to PDF via Browser"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export Notes as PDF using jsPDF & html2canvas"
          >
            {isExportingPdf ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Notes PDF</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsExportPdfModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Open Study Pack PDF Booklet Exporter"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Full Booklet PDF</span>
          </button>
          <button
            onClick={() => {
              const compiledNotes = notes
                .map(
                  (n, idx) =>
                    `${idx + 1}. ${n.heading}${n.subheading ? ` (${n.subheading})` : ''}\n${n.content}${
                      n.keyFormulasOrRules?.length ? `\nKey Rules: ${n.keyFormulasOrRules.join('; ')}` : ''
                    }${n.examTip ? `\nExam Tip: ${n.examTip}` : ''}`
                )
                .join('\n\n');
              openPodcastForContext({
                topic: currentPack.title,
                subject: currentPack.subject,
                sourceType: 'handwritten_notes',
                sourceContent: compiledNotes,
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer whitespace-nowrap"
            title="Convert these handwritten notes into an audio podcast"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Turn Notes into Podcast</span>
          </button>
          <button
            onClick={() =>
              openCaseStudyForContext({
                topic: currentPack.title,
                subject: currentPack.subject,
                learningObjective: `Apply key concepts from handwritten notes on ${currentPack.title}`,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/50 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer whitespace-nowrap"
            title="Practice applying these notes in Case Study Lab"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Practice Case</span>
          </button>
        </div>
      </div>

      {/* Realistic Notebook Presentation Paper */}
      <div
        id="handwritten-notes-paper"
        className="print-area max-w-4xl mx-auto rounded-3xl shadow-xl border border-amber-200/60 dark:border-slate-800 overflow-hidden bg-[#fffdf7] dark:bg-[#1a1f2b] transition-colors"
      >
        {/* Notebook Header Spiral / Ring Binder visual */}
        <div className="no-print h-6 bg-amber-100/70 dark:bg-slate-800/80 border-b border-amber-200/50 dark:border-slate-700/60 flex items-center justify-around px-8">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-900 border border-slate-400 dark:border-slate-700 shadow-inner"
            />
          ))}
        </div>

        {/* Notebook Body with Red Margin and Lined Grid */}
        <div className="relative p-6 sm:p-12 notebook-paper-light dark:notebook-paper-dark min-h-[750px] font-handwriting text-slate-800 dark:text-slate-100 text-lg sm:text-xl">
          {/* Notebook Title Header */}
          <div className="pl-14 sm:pl-20 pb-8 border-b-2 border-dashed border-red-300 dark:border-red-900/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm sm:text-base font-sans-academic font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                Subject: {currentPack.subject || 'Academic Strategy & Management'}
              </span>
              <span className="text-xs sm:text-sm font-sans-academic text-slate-400">
                Date: {new Date(currentPack.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 underline decoration-indigo-400/80 decoration-wavy decoration-2">
              {currentPack.title}
            </h1>
            <p className="text-sm font-sans-academic text-slate-500 dark:text-slate-400 mt-1 italic">
              Revision Digest & Lecture Breakdown
            </p>
          </div>

          {/* Quick Revision Bullets in Compact / Exam Mode */}
          {(viewMode === 'compact' || viewMode === 'exam') && currentPack.summary?.quickRevision && (
            <div className="pl-14 sm:pl-20 my-8 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-800/60 font-sans-academic text-sm">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm mb-2 uppercase tracking-wide">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Rapid Recall Highlights (Top Exam Points):</span>
              </div>
              <ul className="space-y-1.5 list-disc pl-5 text-slate-800 dark:text-slate-200">
                {currentPack.summary.quickRevision.slice(0, viewMode === 'compact' ? 6 : 10).map((pt, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes Sections */}
          <div className="pl-14 sm:pl-20 pt-6 space-y-10">
            {notes.map((section, idx) => (
              <div key={section.id || idx} className="space-y-4">
                {/* Heading */}
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-sm font-sans-academic font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="hand-underline-blue">{section.heading}</span>
                  </h3>
                  {section.subheading && (
                    <p className="text-base text-slate-600 dark:text-slate-400 font-sans-academic italic pl-9">
                      {section.subheading}
                    </p>
                  )}
                </div>

                {/* Content */}
                <div className="pl-2 sm:pl-6 text-lg sm:text-xl leading-loose whitespace-pre-line text-slate-800 dark:text-slate-100">
                  {section.content}
                </div>

                {/* Diagram Box Simulation */}
                {section.diagramDescription && (
                  <div className="my-4 p-4 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-white/60 dark:bg-slate-900/60 font-sans-academic text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Conceptual Diagram & Sketch Guide:</span>
                    </div>
                    <p className="italic">{section.diagramDescription}</p>
                  </div>
                )}

                {/* Formulas or Rules */}
                {section.keyFormulasOrRules && section.keyFormulasOrRules.length > 0 && (
                  <div className="p-3 sm:p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-sm font-sans-academic space-y-1">
                    <span className="font-bold text-blue-900 dark:text-blue-300 uppercase text-[11px] tracking-wider block">
                      📌 Key Rules / Formulas:
                    </span>
                    {section.keyFormulasOrRules.map((rule, rIdx) => (
                      <div key={rIdx} className="font-mono text-xs text-blue-800 dark:text-blue-200">
                        • {rule}
                      </div>
                    ))}
                  </div>
                )}

                {/* Exam Tip */}
                {section.examTip && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 font-sans-academic text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Exam Tip: </span>
                      {section.examTip}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Student Footer Margin Notes */}
          <div className="pl-14 sm:pl-20 mt-14 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs font-sans-academic text-slate-400">
            <span>Generated with AI StudyMate • Exam Revision Master Copy</span>
            <span>Prepared on {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
