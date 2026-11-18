import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { exportElementToPdf } from '../services/pdfExport';
import { Bookmark, Copy, Check, Search, Sparkles, FileDown } from 'lucide-react';

export const DefinitionsView: React.FC = () => {
  const { currentPack } = useStudy();
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const definitions = currentPack.definitions || [];

  const filteredDefinitions = definitions.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.term.toLowerCase().includes(q) ||
      d.definition.toLowerCase().includes(q) ||
      d.example.toLowerCase().includes(q) ||
      (d.category && d.category.toLowerCase().includes(q))
    );
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportPdf = async () => {
    const el = document.getElementById('definitions-cards-grid');
    if (!el) return;
    setIsExportingPdf(true);
    try {
      await exportElementToPdf(
        el,
        `${currentPack.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_definitions.pdf`,
        { title: `${currentPack.title} - Definitions Glossary` }
      );
    } catch (err) {
      console.error('Failed to export definitions to PDF', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600" />
            <span>Important Academic Definitions</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key terminology, exact scholarly meanings, and exam application examples
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search definitions..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || definitions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
            title="Export definitions as PDF using jsPDF & html2canvas"
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
        </div>
      </div>

      {/* Definitions Cards Grid */}
      {filteredDefinitions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Bookmark className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            No definitions match your search filter "{search}".
          </p>
        </div>
      ) : (
        <div id="definitions-cards-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDefinitions.map((item) => {
            const copyContent = `${item.term}\nDefinition: ${item.definition}\n${item.example}`;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {item.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                      )}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.term}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleCopy(item.id, copyContent)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Copy definition"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Definition */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">
                      Definition:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {item.definition}
                    </p>
                  </div>

                  {/* Example */}
                  {item.example && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {item.example.startsWith('Example:') ? '' : 'Example: '}
                      </span>
                      <span>{item.example}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Exam Citation Term</span>
                  <button
                    onClick={() => handleCopy(item.id, copyContent)}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {isCopied ? 'Copied to Clipboard' : 'Copy Term'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
