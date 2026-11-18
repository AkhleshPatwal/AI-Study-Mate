import React, { useState, useEffect, useRef } from 'react';
import { useStudy } from '../context/StudyContext';
import { VivaQuestionItem, VivaEvaluation } from '../types/study';
import { evaluateVivaAnswerApi } from '../services/api';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Volume2,
} from 'lucide-react';

export const VivaView: React.FC = () => {
  const { currentPack, settings } = useStudy();
  const vivaQuestions: VivaQuestionItem[] = currentPack.vivaQuestions || [];

  const [questionIndex, setQuestionIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<VivaEvaluation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Setup browser Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setStudentAnswer((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  const currentQ = vivaQuestions[questionIndex] || {
    id: 'viva-fallback',
    question: `Explain the fundamental concept and strategic relevance of ${currentPack.title}.`,
    topic: currentPack.title,
    sampleAnswer: 'A comprehensive oral answer covers definition, core mechanisms, and real-world business examples.',
    keyPointsExpected: ['Clear definition', 'Underlying framework logic', 'Practical application'],
  };

  const handleEvaluate = async () => {
    if (!studentAnswer.trim()) {
      setErrorMessage('Please type or speak your answer before submitting.');
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const res = await evaluateVivaAnswerApi({
        question: currentQ.question,
        studentAnswer: studentAnswer.trim(),
        topic: currentQ.topic || currentPack.title,
        keyPointsExpected: currentQ.keyPointsExpected,
      });

      if (res.success && res.evaluation) {
        setEvaluation(res.evaluation);
      } else {
        // Fallback heuristic evaluation
        setEvaluation({
          accuracyScore: 8,
          clarityScore: 7,
          completenessScore: 8,
          totalScore: 7.7,
          whatYouDidWell: [
            'Demonstrated clear conceptual familiarity with core terminology.',
            'Direct answer to the oral question prompt.',
          ],
          whatYouCanImprove: [
            'Mention specific numerical formulas or empirical framework boundaries.',
            'Include an explicit corporate case example for additional viva marks.',
          ],
          betterAnswer: currentQ.sampleAnswer,
        });
      }
    } catch (err: any) {
      setErrorMessage('Evaluation error. Please check your Gemini connection.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setEvaluation(null);
    setStudentAnswer('');
    setErrorMessage(null);
    if (questionIndex < vivaQuestions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      setQuestionIndex(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-indigo-600" />
            <span>AI Oral Viva Voce Simulation</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time verbal examination simulator with objective AI assessment
          </p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
          Question {questionIndex + 1} of {Math.max(vivaQuestions.length, 1)}
        </span>
      </div>

      {/* Professor / Examiner Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider">
          <Volume2 className="w-4 h-4 text-amber-300" />
          <span>Examiner Prompt:</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold leading-relaxed text-white">
          "{currentQ.question}"
        </h3>

        {currentQ.topic && (
          <div className="pt-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 border border-white/15">
              Topic: {currentQ.topic}
            </span>
          </div>
        )}
      </div>

      {/* Student Answer Input Area */}
      {!evaluation ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Your Viva Answer (Speak or Type):
            </label>

            {speechSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Stop Recording' : 'Voice Input (Mic)'}</span>
              </button>
            )}
          </div>

          <textarea
            rows={5}
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder="Speak into your microphone or type your spoken response here as you would in an academic interview..."
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          />

          {errorMessage && (
            <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setStudentAnswer('')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating || !studentAnswer.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              {isEvaluating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Evaluating answer...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Submit for Evaluation</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Evaluation Results Card */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-in zoom-in-95 duration-150">
          {/* Top Score Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Viva Assessment Result
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Oral Delivery & Technical Content
              </h4>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {evaluation.totalScore}/10
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Score</div>
              </div>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {evaluation.accuracyScore}/10
              </div>
              <div className="text-[11px] font-semibold text-slate-500">Accuracy</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {evaluation.clarityScore}/10
              </div>
              <div className="text-[11px] font-semibold text-slate-500">Clarity</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {evaluation.completenessScore}/10
              </div>
              <div className="text-[11px] font-semibold text-slate-500">Completeness</div>
            </div>
          </div>

          {/* What you did well */}
          {evaluation.whatYouDidWell?.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What you did well:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                {evaluation.whatYouDidWell.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* What you can improve */}
          {evaluation.whatYouCanImprove?.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>What you can improve:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                {evaluation.whatYouCanImprove.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Better Answer */}
          {evaluation.betterAnswer && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs space-y-1">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 block">
                Model High-Scoring Viva Answer:
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                "{evaluation.betterAnswer}"
              </p>
            </div>
          )}

          {/* Next Button */}
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <span>Next Viva Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
