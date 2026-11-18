import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { StudyPlanDay } from '../types/study';
import { generateStudyPlanApi } from '../services/api';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertCircle,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const ExamPlannerView: React.FC = () => {
  const { currentPack } = useStudy();

  const [subject, setSubject] = useState(currentPack.subject || 'Strategic Management');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [chapters, setChapters] = useState(
    currentPack.title + '\nCore Frameworks & Models\nCase Analysis & Essay Questions'
  );

  const [planDays, setPlanDays] = useState<StudyPlanDay[]>(() => {
    return currentPack.studyPlan && currentPack.studyPlan.length > 0
      ? currentPack.studyPlan
      : [
          {
            dayNumber: 1,
            dateStr: 'Day 1: Foundations',
            topic: 'Core Frameworks & Definitions',
            studyTimeMinutes: 60,
            revisionTasks: ['Read concept definitions', 'Memorize 2x2 grid', 'Flashcard review'],
            quizAction: 'Complete 5-question baseline quiz',
            completed: true,
          },
        ];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleDayCompleted = (index: number) => {
    setPlanDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], completed: !next[index].completed };
      return next;
    });
  };

  const completedCount = planDays.filter((d) => d.completed).length;
  const progressPercent =
    planDays.length > 0 ? Math.round((completedCount / planDays.length) * 100) : 0;

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !chapters.trim()) {
      setErrorMessage('Please provide a subject and syllabus chapters.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await generateStudyPlanApi({
        subject,
        examDate,
        availableHoursPerDay: Number(hoursPerDay) || 2,
        chapters,
      });

      if (res.success && res.plan && Array.isArray(res.plan)) {
        setPlanDays(res.plan);
      } else {
        setErrorMessage(res.error || 'Failed to generate revision schedule.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with AI planner.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>Personalized Exam Revision Planner</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI-structured day-by-day revision schedule with active recall checkpoints
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {completedCount} of {planDays.length} Days Completed
            </div>
            <div className="text-[11px] text-slate-500">{progressPercent}% Progress</div>
          </div>
          <div className="w-20 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Exam Parameters */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 h-fit">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Exam Parameters
          </h3>

          <form onSubmit={handleGeneratePlan} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Corporate Strategy, Accounting, Biology"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hours / Day
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chapters / Topics to Cover
              </label>
              <textarea
                rows={4}
                value={chapters}
                onChange={(e) => setChapters(e.target.value)}
                placeholder="Enter list of chapters or syllabus topics..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            {errorMessage && (
              <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Generating Schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Revision Plan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Area: Day-by-Day Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Revision Schedule ({planDays.length} Days)
            </h3>
            <span className="text-xs text-slate-500">
              Target: {new Date(examDate).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-3">
            {planDays.map((day, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  day.completed
                    ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 opacity-90'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleDayCompleted(idx)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                      title={day.completed ? 'Mark day incomplete' : 'Mark day completed'}
                    >
                      {day.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {day.dateStr || `Day ${day.dayNumber}`}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <h4
                          className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white ${
                            day.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {day.topic}
                        </h4>
                      </div>

                      {/* Revision Tasks */}
                      {day.revisionTasks && (
                        <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc pl-4 space-y-0.5 pt-1">
                          {day.revisionTasks.map((task, tIdx) => (
                            <li key={tIdx}>{task}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      <Clock className="w-3 h-3" />
                      <span>{day.studyTimeMinutes} mins</span>
                    </span>
                  </div>
                </div>

                {/* Daily Quiz Action */}
                {day.quizAction && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      🎯 Daily Check: <span className="font-semibold text-slate-700 dark:text-slate-300">{day.quizAction}</span>
                    </span>
                    <button
                      onClick={() => toggleDayCompleted(idx)}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {day.completed ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
