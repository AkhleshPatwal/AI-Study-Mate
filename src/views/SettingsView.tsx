import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Youtube,
  Sun,
  Moon,
  Trash2,
  Save,
  Database,
  Cloud,
  LogIn,
  LogOut,
  UserCheck,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateGeminiKey,
    deleteGeminiKey,
    updateYouTubeKey,
    deleteYouTubeKey,
    checkConnection,
    toggleTheme,
    user,
    isDbConnected,
    loginWithGoogle,
    logout,
    setIsAuthModalOpen,
    savedPacks,
    savePack,
  } = useStudy();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Gemini state
  const [geminiInput, setGeminiInput] = useState(settings.geminiApiKey || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // YouTube state
  const [youtubeInput, setYoutubeInput] = useState(settings.youtubeApiKey || '');
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [youtubeSaveSuccess, setYoutubeSaveSuccess] = useState(false);

  const handleSyncAllPacks = async () => {
    if (!user) {
      setSyncMessage('Please sign in with Google first to sync your packs to the database.');
      return;
    }
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      for (const p of savedPacks) {
        if (!p.isDemo) {
          savePack(p);
        }
      }
      setSyncMessage(`Successfully synchronized ${savedPacks.length} study packs to Firestore.`);
    } catch (err: any) {
      setSyncMessage('Sync failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveGeminiKey = async () => {
    updateGeminiKey(geminiInput);
    setIsTestingGemini(true);
    setTestResult(null);
    try {
      const ok = await checkConnection(geminiInput);
      setTestResult({
        success: ok,
        message: ok
          ? 'Connected successfully to Google Gemini 3.8 Flash'
          : 'Could not connect. Please ensure your API key is active.',
      });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleRemoveGeminiKey = () => {
    deleteGeminiKey();
    setGeminiInput('');
    setTestResult(null);
  };

  const handleTestGeminiConnection = async () => {
    setIsTestingGemini(true);
    setTestResult(null);
    try {
      const keyToTest = geminiInput.trim() || undefined;
      const ok = await checkConnection(keyToTest);
      setTestResult({
        success: ok,
        message: ok
          ? `Connected successfully to Google Gemini 3.8 Flash (${keyToTest ? 'Custom API key' : 'Environment API key active'})`
          : 'Authentication failed. Please verify your key.',
      });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSaveYouTubeKey = () => {
    updateYouTubeKey(youtubeInput);
    setYoutubeSaveSuccess(true);
    setTimeout(() => setYoutubeSaveSuccess(false), 2500);
  };

  const handleRemoveYouTubeKey = () => {
    deleteYouTubeKey();
    setYoutubeInput('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>AI & System Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your Google Gemini AI key, YouTube API settings, and workspace preferences
          </p>
        </div>
      </div>

      {/* Security Warning Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Security & Storage Notice:</p>
          <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
            "Your API key is sensitive. Never share it publicly or commit it to source control."
            For this student prototype, keys are stored safely in your personal browser session
            (localStorage) and routed securely through our server proxy to Google's official Gemini
            endpoints.
          </p>
        </div>
      </div>

      {/* 1. Google Gemini AI Configuration */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Google Gemini API
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary intelligence model for note generation, quizzes, and viva evaluation
              </p>
            </div>
          </div>

          {/* Live Status indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                settings.geminiConnected
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
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
              {settings.geminiConnected ? '🟢 Connected' : '🔴 Not connected'}
            </span>
          </div>
        </div>

        {/* AI Provider */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            AI Provider
          </label>
          <div className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>Google Gemini (gemini-3.8-flash)</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
              Active SDK
            </span>
          </div>
        </div>

        {/* System Key Detection Banner */}
        {settings.hasServerGeminiKey && !settings.geminiApiKey && (
          <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Google AI Studio Runtime Key:</strong> Automatically injected and active for model <code>gemini-3.8-flash</code>. You can also paste a personal key below to override it.
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 shrink-0">
              Ready
            </span>
          </div>
        )}

        {/* API Key Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Gemini API Key
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Get a free API key from Google AI Studio →
            </a>
          </div>

          <div className="relative">
            <input
              type={showGeminiKey ? 'text' : 'password'}
              value={geminiInput}
              onChange={(e) => setGeminiInput(e.target.value)}
              placeholder="Paste your Gemini API key (AIzaSy...)"
              className="w-full pl-4 pr-24 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowGeminiKey(!showGeminiKey)}
              className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showGeminiKey ? 'Hide' : 'Show'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestGeminiConnection}
            disabled={isTestingGemini}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            {isTestingGemini ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
            ) : (
              <Key className="w-3.5 h-3.5" />
            )}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2">
            {settings.geminiApiKey && (
              <button
                type="button"
                onClick={handleRemoveGeminiKey}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove API Key</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveGeminiKey}
              disabled={isTestingGemini || !geminiInput.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save API Key</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. YouTube Data API Configuration (Optional) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                YouTube Data API v3 (Optional)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Directly queries real-time YouTube video cards and durations
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Optional</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            YouTube API Key
          </label>
          <div className="relative">
            <input
              type={showYoutubeKey ? 'text' : 'password'}
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
              placeholder="Paste Google Cloud YouTube Data API key (Optional)"
              className="w-full pl-4 pr-24 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowYoutubeKey(!showYoutubeKey)}
              className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              {showYoutubeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showYoutubeKey ? 'Hide' : 'Show'}</span>
            </button>
          </div>
        </div>

        {youtubeSaveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>YouTube API Key saved successfully.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          {settings.youtubeApiKey && (
            <button
              type="button"
              onClick={handleRemoveYouTubeKey}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Key</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveYouTubeKey}
            disabled={!youtubeInput.trim()}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            <span>Save YouTube Key</span>
          </button>
        </div>
      </div>

      {/* 3. Google Cloud Firestore Database & Sync */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Google Cloud Firestore Database
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Persistent storage for study packs, notes, mind maps, and quiz analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Connected
            </span>
          </div>
        </div>

        {/* Database ID & User account status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
              Firestore Database ID
            </span>
            <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate">
              ai-studio-aistudymate-7243b80f-f76d-422d-98f3-034db80c7faa
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
              Cloud Sync Account
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                {user ? user.email || 'Authenticated User' : 'Local Guest Session'}
              </span>
              {user && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Auth and Sync Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In with Google</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSyncAllPacks}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-indigo-500" />
            )}
            <span>Backup Current Library to Cloud</span>
          </button>
        </div>
      </div>

      {/* 4. Appearance Settings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Appearance Theme</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between Light mode and Dark mode for late-night study sessions
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {settings.theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Dark Mode Active</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Light Mode Active</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
