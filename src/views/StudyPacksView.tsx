import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import {
  FolderOpen,
  Star,
  Trash2,
  ArrowRight,
  BookOpen,
  Clock,
  PlusCircle,
  FileText,
  Search,
  FileDown,
} from 'lucide-react';

export const StudyPacksView: React.FC = () => {
  const {
    savedPacks,
    currentPack,
    setCurrentPack,
    selectPackById,
    toggleFavorite,
    deletePack,
    setIsUploadModalOpen,
    setIsExportPdfModalOpen,
  } = useStudy();

  const [filterTab, setFilterTab] = useState<'all' | 'favorites' | 'recent'>('all');
  const [search, setSearch] = useState('');

  const filteredPacks = savedPacks
    .filter((pack) => {
      if (filterTab === 'favorites') return pack.isFavorite;
      return true;
    })
    .filter((pack) => {
      const q = search.toLowerCase();
      return (
        pack.title.toLowerCase().includes(q) ||
        (pack.subject && pack.subject.toLowerCase().includes(q))
      );
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            <span>My Study Packs Library</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, favorite, and continue revising your custom study packs
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packs..."
              className="pl-9 pr-4 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Pack</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setFilterTab('all')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            filterTab === 'all'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Packs ({savedPacks.length})
        </button>
        <button
          onClick={() => setFilterTab('favorites')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            filterTab === 'favorites'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Favorites ({savedPacks.filter((p) => p.isFavorite).length})
        </button>
      </div>

      {/* Grid */}
      {filteredPacks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No study packs found in this category
          </h3>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Your First Study Pack</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPacks.map((pack) => {
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
                className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {pack.subject || 'General'}
                      </span>
                      {pack.isDemo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          Demo Pack
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(pack.id)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                        title={pack.isFavorite ? 'Unfavorite' : 'Favorite'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            pack.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                          }`}
                        />
                      </button>

                      {!pack.isDemo && (
                        <button
                          onClick={() => deletePack(pack.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Delete pack"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 mb-2">
                    {pack.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {pack.summary?.quickRevision?.[0] ||
                      pack.summary?.examNotes?.slice(0, 120) ||
                      'Comprehensive learning materials ready for review.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(pack.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{resourceCount} items</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentPack(pack);
                        setIsExportPdfModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Export this Study Pack to Printable PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => selectPackById(pack.id)}
                      className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors cursor-pointer"
                    >
                      <span>{isCurrent ? 'Current' : 'Study'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
