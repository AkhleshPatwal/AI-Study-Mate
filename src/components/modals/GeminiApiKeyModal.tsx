import React, { useState, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  Sparkles,
  Key,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Zap,
} from 'lucide-react';

export const GeminiApiKeyModal: React.FC = () => {
  const {
    isApiKeyModalOpen,
    setIsApiKeyModalOpen,
    settings,
    updateGeminiKey,
    deleteGeminiKey,
    checkConnection,
  } = useStudy();

  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isApiKeyModalOpen) {
      setInputKey(settings.geminiApiKey || '');
      setFeedback(null);
    }
  }, [isApiKeyModalOpen, settings.geminiApiKey]);

  if (!isApiKeyModalOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setFeedback(null);

    const keyToUse = inputKey.trim();

    try {
      const isOk = await checkConnection(keyToUse || undefined);
      if (isOk) {
        if (keyToUse) {
          updateGeminiKey(keyToUse);
        }
        setFeedback({
          success: true,
          message: keyToUse
            ? 'Success! Your custom Gemini API key is verified and active.'
            : 'Success! Connected to Google Gemini 3.8 Flash via Google AI Studio runtime.',
        });
      } else {
        setFeedback({
          success: false,
          message: 'Connection failed. Please check the API key and try again.',
        });
      }
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.message || 'Failed to authenticate with Gemini API.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetToDefault = async () => {
    deleteGeminiKey();
    setInputKey('');
    setIsTesting(true);
    setFeedback(null);
    try {
      const isOk = await checkConnection(undefined);
      setFeedback({
        success: isOk,
        message: isOk
          ? 'Switched back to Google AI Studio default environment key.'
          : 'Could not connect to default key.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputKey(text.trim());
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-slate-50/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Connect Google Gemini API</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Powers AI notes, mind maps, quizzes, and viva prep
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsApiKeyModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Current Live Status Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Live Engine Status
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    settings.geminiConnected
                      ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                      : 'bg-rose-500'
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    settings.geminiConnected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {settings.geminiConnected ? 'Connected & Ready' : 'Authentication Needed'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span>Intelligence Model:</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                gemini-3.8-flash
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Active Key Source:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {settings.geminiApiKey
                  ? 'Custom Personal API Key (Saved)'
                  : settings.hasServerGeminiKey
                  ? 'Google AI Studio Runtime Key (Active)'
                  : 'None'}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Gemini API Key</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Paste from Clipboard
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Paste your key here (e.g. AIzaSy...)"
                  className="w-full pl-3.5 pr-20 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2.5 px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showKey ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>

            {/* Feedback alert */}
            {feedback && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-medium ${
                  feedback.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {feedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="submit"
                disabled={isTesting}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isTesting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-300" />
                )}
                <span>{inputKey.trim() ? 'Save & Connect Custom Key' : 'Test Connection'}</span>
              </button>

              {settings.geminiApiKey && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={isTesting}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Remove custom key and use Google AI Studio runtime key"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Use Default Key</span>
                </button>
              )}
            </div>
          </form>

          {/* Helpful Information & Direct Link */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>How your key is handled:</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Your key is saved locally in your browser and transmitted securely over encrypted HTTPS
              directly to Google's official Gemini endpoint. It is never logged or shared.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-0.5"
            >
              <span>Get a free Gemini API key from Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
