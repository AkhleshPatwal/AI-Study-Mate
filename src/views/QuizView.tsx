import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { QuizQuestion } from '../types/study';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Award,
  AlertTriangle,
  BookOpen,
  Filter,
  Headphones,
  Briefcase,
} from 'lucide-react';

export const QuizView: React.FC = () => {
  const { currentPack, recordQuizResult, openPodcastForContext, openCaseStudyForContext } = useStudy();
  const allQuestions: QuizQuestion[] = currentPack.quiz || [];

  // Quiz Setup state
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'mcq' | 'true_false' | 'short_answer' | 'case_based'>('all');

  // Quiz Execution state
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<Record<number, boolean>>({});

  const startQuiz = () => {
    let filtered = [...allQuestions];
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }
    if (selectedType !== 'all') {
      filtered = filtered.filter((q) => q.type === selectedType);
    }

    // If filtering left zero questions, fallback to all questions
    if (filtered.length === 0) {
      filtered = [...allQuestions];
    }

    // Shuffle and slice to selected count
    const shuffled = filtered.sort(() => 0.5 - Math.random()).slice(0, questionCount);
    setActiveQuizQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsAnswerSubmitted({});
    setIsStarted(true);
    setIsCompleted(false);
  };

  const handleSelectOption = (option: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: option,
    }));
  };

  const handleSubmitCurrentAnswer = () => {
    setIsAnswerSubmitted((prev) => ({
      ...prev,
      [currentQuestionIndex]: true,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const finishQuiz = () => {
    setIsCompleted(true);
    // Calculate score
    let correctCount = 0;
    const weakList: string[] = [];

    activeQuizQuestions.forEach((q, idx) => {
      const userAns = (userAnswers[idx] || '').trim().toLowerCase();
      const correctAns = q.correctAnswer.trim().toLowerCase();
      const isCorrect = userAns === correctAns;

      if (isCorrect) {
        correctCount += 1;
      } else {
        if (q.topicTag) weakList.push(q.topicTag);
      }
    });

    recordQuizResult(correctCount, activeQuizQuestions.length, weakList, currentPack.title);

    // Fire confetti for celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  };

  const currentQ = activeQuizQuestions[currentQuestionIndex];
  const totalQuestions = activeQuizQuestions.length;

  // Evaluation stats for Results screen
  const calculateResults = () => {
    let correct = 0;
    const items = activeQuizQuestions.map((q, idx) => {
      const userAns = (userAnswers[idx] || '').trim();
      const isCorrect = userAns.toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (isCorrect) correct += 1;
      return {
        question: q,
        userAnswer: userAns || 'No answer submitted',
        isCorrect,
      };
    });
    const percentage = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    const weakTopics = Array.from(
      new Set(items.filter((i) => !i.isCorrect && i.question.topicTag).map((i) => i.question.topicTag))
    );

    return { correct, total: totalQuestions, percentage, items, weakTopics };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. QUIZ SETUP SCREEN */}
      {!isStarted && !isCompleted && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-2">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Interactive Exam Quiz: {currentPack.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Customize your practice parameters, test retention, and pinpoint weak topics.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Number of Questions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 30].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                      questionCount === num
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Difficulty Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'Mixed' },
                  { id: 'easy', label: 'Easy' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'hard', label: 'Hard' },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id as any)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedDifficulty === diff.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Types */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Question Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All Types' },
                  { id: 'mcq', label: 'MCQs' },
                  { id: 'true_false', label: 'True / False' },
                  { id: 'case_based', label: 'Case-Based' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id as any)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedType === type.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Interactive Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTIVE QUIZ (ONE QUESTION AT A TIME) */}
      {isStarted && !isCompleted && currentQ && (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Progress Header */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 capitalize px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                {currentQ.difficulty}
              </span>
              {currentQ.topicTag && (
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                  • {currentQ.topicTag}
                </span>
              )}
            </div>

            <div className="w-32 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            {/* Case Scenario (if any) */}
            {currentQ.caseScenario && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <span className="font-bold block uppercase text-[10px] tracking-wider mb-1">
                  Case Scenario:
                </span>
                {currentQ.caseScenario}
              </div>
            )}

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </h3>

            {/* MCQ or True/False Options */}
            {currentQ.options && currentQ.options.length > 0 ? (
              <div className="space-y-2.5">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = userAnswers[currentQuestionIndex] === opt;
                  const isSubmitted = isAnswerSubmitted[currentQuestionIndex];
                  const isCorrectAnswer =
                    opt.toLowerCase() === currentQ.correctAnswer.toLowerCase();

                  let buttonStyle =
                    'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';

                  if (isSubmitted) {
                    if (isCorrectAnswer) {
                      buttonStyle =
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20';
                    } else if (isSelected && !isCorrectAnswer) {
                      buttonStyle =
                        'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                    }
                  } else if (isSelected) {
                    buttonStyle =
                      'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20 font-semibold';
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-4 rounded-2xl border text-xs sm:text-sm font-medium text-left transition-all flex items-center justify-between cursor-pointer ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSubmitted && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                      {isSubmitted && isSelected && !isCorrectAnswer && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Short Answer input */
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={userAnswers[currentQuestionIndex] || ''}
                  onChange={(e) => handleSelectOption(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={isAnswerSubmitted[currentQuestionIndex]}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Explanation box after submit */}
            {isAnswerSubmitted[currentQuestionIndex] && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1.5 animate-in fade-in">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide block">
                  Explanation & Concept:
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentQ.explanation}
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  Correct Answer:{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currentQ.correctAnswer}
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Question Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {!isAnswerSubmitted[currentQuestionIndex] ? (
                  <button
                    onClick={handleSubmitCurrentAnswer}
                    disabled={!userAnswers[currentQuestionIndex]}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : null}

                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <span>
                    {currentQuestionIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DETAILED RESULTS SCREEN */}
      {isCompleted && (
        <div className="max-w-3xl mx-auto space-y-6">
          {(() => {
            const results = calculateResults();
            return (
              <>
                {/* Score Summary Card */}
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Award className="w-8 h-8" />
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      Quiz Completed!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {currentPack.title}
                    </p>
                  </div>

                  {/* Score display */}
                  <div className="flex items-center justify-center gap-6 py-2">
                    <div>
                      <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                        {results.correct}/{results.total}
                      </div>
                      <div className="text-xs uppercase font-bold text-slate-400 mt-0.5">
                        Score
                      </div>
                    </div>
                    <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
                    <div>
                      <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                        {results.percentage}%
                      </div>
                      <div className="text-xs uppercase font-bold text-slate-400 mt-0.5">
                        Accuracy
                      </div>
                    </div>
                  </div>

                  {/* Weak topics banner */}
                  {results.weakTopics.length > 0 && (
                    <div className="max-w-md mx-auto p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Recommended Revision Topics:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {results.weakTopics.map((wt) => (
                          <span
                            key={wt}
                            className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 font-semibold text-amber-800 dark:text-amber-200 text-[11px]"
                          >
                            {wt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      onClick={() => {
                        setIsStarted(false);
                        setIsCompleted(false);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retake Quiz</span>
                    </button>
                    <button
                      onClick={() => {
                        const targetWeak = results.weakTopics.length > 0
                          ? results.weakTopics
                          : [currentPack.title];
                        openPodcastForContext({
                          topic: results.weakTopics.length > 0
                            ? `${currentPack.title}: ${results.weakTopics.slice(0, 2).join(' & ')}`
                            : currentPack.title,
                          subject: currentPack.subject,
                          sourceType: 'weak_topics',
                          sourceContent: `Focus revision podcast on weak quiz concepts (${targetWeak.join(', ')}) from ${currentPack.title}. Score achieved: ${results.percentage}%.`,
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                    >
                      <Headphones className="w-4 h-4" />
                      <span>
                        {results.weakTopics.length > 0
                          ? 'Turn Weak Topics into Podcast'
                          : 'Revise with Podcast'}
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        openCaseStudyForContext({
                          topic: results.weakTopics[0] || currentPack.title,
                          subject: currentPack.subject,
                          learningObjective:
                            results.weakTopics.length > 0
                              ? `Reinforce weak quiz areas: ${results.weakTopics.join(', ')}`
                              : `Apply ${currentPack.title} in a real-world scenario`,
                        })
                      }
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Practice Case Study</span>
                    </button>
                  </div>
                </div>

                {/* Question by Question Breakdown */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Detailed Answers & Explanations ({results.items.length})
                  </h3>

                  <div className="space-y-3">
                    {results.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border transition-all ${
                          item.isCorrect
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">Q{idx + 1}.</span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {item.question.question}
                            </span>
                          </div>
                          {item.isCorrect ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                              <CheckCircle2 className="w-4 h-4" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs shrink-0">
                              <XCircle className="w-4 h-4" /> Incorrect
                            </span>
                          )}
                        </div>

                        <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300 pl-4">
                          <div>
                            Your Answer:{' '}
                            <span className={item.isCorrect ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'font-semibold text-rose-700 dark:text-rose-300'}>
                              {item.userAnswer}
                            </span>
                          </div>
                          {!item.isCorrect && (
                            <div>
                              Correct Answer:{' '}
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                {item.question.correctAnswer}
                              </span>
                            </div>
                          )}
                          <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 italic">
                            {item.question.explanation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
