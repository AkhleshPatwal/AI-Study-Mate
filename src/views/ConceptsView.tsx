import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { Lightbulb, Search, Tag, ArrowUpRight } from 'lucide-react';

export const ConceptsView: React.FC = () => {
  const { currentPack } = useStudy();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const concepts = currentPack.concepts || [];

  // Extract all related concepts as tags
  const allTags = Array.from(
    new Set(concepts.flatMap((c) => c.relatedConcepts || []))
  );

  const filteredConcepts = concepts.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.concept.toLowerCase().includes(q) ||
      c.simpleExplanation.toLowerCase().includes(q) ||
      c.example.toLowerCase().includes(q) ||
      c.whyItMatters.toLowerCase().includes(q);

    const matchesTag =
      selectedTag === null || (c.relatedConcepts && c.relatedConcepts.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span>Core Academic Concepts</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Understand underlying logic, why each concept matters in real life, and strategic linkages
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search concepts..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Related Concepts Filter Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Filter by topic:</span>
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedTag === null
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All ({concepts.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Cards List */}
      {filteredConcepts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Lightbulb className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            No concepts found matching your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredConcepts.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {item.concept}
                  </h3>
                </div>

                {/* Explanation */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Simple Explanation
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {item.simpleExplanation}
                  </p>
                </div>

                {/* Example */}
                {item.example && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                      Case Example:
                    </span>
                    <p className="leading-relaxed">{item.example}</p>
                  </div>
                )}

                {/* Why It Matters */}
                {item.whyItMatters && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                      Strategic Importance
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.whyItMatters}
                    </p>
                  </div>
                )}
              </div>

              {/* Related Concepts */}
              {item.relatedConcepts && item.relatedConcepts.length > 0 && (
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                    Related Frameworks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.relatedConcepts.map((rc) => (
                      <span
                        key={rc}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                      >
                        {rc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
