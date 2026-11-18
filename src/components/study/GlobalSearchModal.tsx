import React, { useState, useEffect } from 'react';
import { useStudy, NavigationTab } from '../../context/StudyContext';
import {
  Search,
  X,
  FileEdit,
  Bookmark,
  Lightbulb,
  HelpCircle,
  FolderOpen,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    currentPack,
    savedPacks,
    setActiveTab,
    selectPackById,
  } = useStudy();

  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.trim().toLowerCase();

  // Search Results
  const results: {
    type: 'pack' | 'note' | 'definition' | 'concept' | 'quiz';
    title: string;
    snippet: string;
    tab: NavigationTab;
    packId?: string;
  }[] = [];

  if (q.length > 0) {
    // 1. Search Saved Packs
    savedPacks.forEach((p) => {
      if (
        p.title.toLowerCase().includes(q) ||
        (p.subject && p.subject.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'pack',
          title: p.title,
          snippet: `Study Pack • ${p.subject || 'General'}`,
          tab: 'notes',
          packId: p.id,
        });
      }
    });

    // 2. Search Notes
    currentPack.handwrittenNotes?.forEach((n) => {
      if (
        n.heading.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.subheading && n.subheading.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'note',
          title: n.heading,
          snippet: n.content.slice(0, 90) + '...',
          tab: 'notes',
        });
      }
    });

    // 3. Search Definitions
    currentPack.definitions?.forEach((d) => {
      if (
        d.term.toLowerCase().includes(q) ||
        d.definition.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'definition',
          title: `Definition: ${d.term}`,
          snippet: d.definition.slice(0, 90) + '...',
          tab: 'definitions',
        });
      }
    });

    // 4. Search Concepts
    currentPack.concepts?.forEach((c) => {
      if (
        c.concept.toLowerCase().includes(q) ||
        c.simpleExplanation.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'concept',
          title: `Concept: ${c.concept}`,
          snippet: c.simpleExplanation.slice(0, 90) + '...',
          tab: 'concepts',
        });
      }
    });

    // 5. Search Quizzes
    currentPack.quiz?.forEach((qz, idx) => {
      if (
        qz.question.toLowerCase().includes(q) ||
        (qz.topicTag && qz.topicTag.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'quiz',
          title: `Quiz Q${idx + 1}: ${qz.question.slice(0, 60)}...`,
          snippet: `Topic: ${qz.topicTag || 'General'} • Difficulty: ${qz.difficulty}`,
          tab: 'quiz',
        });
      }
    });
  }

  const handleSelectResult = (item: (typeof results)[0]) => {
    if (item.packId) {
      selectPackById(item.packId);
    }
    setActiveTab(item.tab);
    setIsSearchOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pack':
        return <FolderOpen className="w-4 h-4 text-indigo-500" />;
      case 'note':
        return <FileEdit className="w-4 h-4 text-blue-500" />;
      case 'definition':
        return <Bookmark className="w-4 h-4 text-emerald-500" />;
      case 'concept':
        return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, definitions, concepts, quizzes, study packs... (e.g. Ansoff, Risk, Diversification)"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-2">
          {q.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <p>Type keywords to search across all study modules in your library.</p>
              <div className="flex justify-center gap-2 pt-2">
                {['Penetration', 'Diversification', 'Risk', 'Matrix'].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setQuery(hint)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No results found for "{query}". Try a different keyword.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Matching Resources ({results.length})
              </div>
              {results.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectResult(item)}
                  className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left flex items-start justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {item.snippet}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide shrink-0 mt-1">
                    {item.tab}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press ESC or click outside to close</span>
          <span>AI StudyMate Search</span>
        </div>
      </div>
    </div>
  );
};
