import React, { useEffect, useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Cloud,
  ShieldCheck,
  LogOut,
  FolderSync,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';

export const GoogleAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    user,
    isAuthLoading,
    authError,
    authErrorDetails,
    authRetryStatus,
    clearAuthError,
    loginWithGoogle,
    logout,
    savedPacks,
    stats,
  } = useStudy();

  const [localLoading, setLocalLoading] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleClose = () => {
    setLocalLoading(false);
    clearAuthError();
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    if (!isAuthModalOpen) {
      setLocalLoading(false);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const currentHref = typeof window !== 'undefined' ? window.location.href : '';
  const isInIframe =
    typeof window !== 'undefined' && window.self !== window.top;

  const category =
    authErrorDetails?.category ||
    (authError &&
    (authError.includes('unauthorized-domain') || authError.includes('not authorized'))
      ? 'domain'
      : 'unknown');

  const isDomainError = Boolean(authError && category === 'domain');
  const isPopupError = Boolean(authError && category === 'popup');
  const isRetryableError = Boolean(authError && (authErrorDetails?.retryable ?? true));

  const handleCopyDomain = () => {
    if (!currentHostname) return;
    navigator.clipboard?.writeText(currentHostname).catch(() => {});
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleSignIn = async () => {
    setLocalLoading(true);
    setAttemptCount((prev) => prev + 1);
    clearAuthError();
    try {
      const ok = await loginWithGoogle();
      if (ok) {
        setAttemptCount(0);
        setIsAuthModalOpen(false);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLocalLoading(true);
    try {
      await logout();
      setAttemptCount(0);
      setIsAuthModalOpen(false);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = localLoading || (isAuthLoading && !authError);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {user ? 'Google Account' : 'Sign in with Google'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user ? 'Cloud Firestore Synchronized' : 'Sync study materials across all devices'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close sign in dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {user ? (
            /* Signed-in View */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-3.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user.displayName || 'Google Student'}
                    </p>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Firestore Cloud Database Connected
                  </p>
                </div>
              </div>

              {/* Sync Statistics */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Synced Packs</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {savedPacks.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Quizzes Taken</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {stats.quizzesCompleted}
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoading ? 'Signing Out...' : 'Sign Out of Google Account'}</span>
              </button>
            </div>
          ) : (
            /* Signed-out View */
            <div className="space-y-4">
              {/* Feature Highlights */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Automatic Cloud Sync
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      All your handwritten notes, mind maps, quizzes, and revision packs save automatically to Firestore.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                    <FolderSync className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Access Anywhere
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Switch between your phone, tablet, and laptop seamlessly with your Google credentials.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Zero-Trust Secure Database
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Your materials are locked to your personal UID with hardened Firestore security rules.
                    </p>
                  </div>
                </div>
              </div>

              {/* Transient Retry Status Banner */}
              {authRetryStatus && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 flex items-center gap-2 text-xs text-indigo-800 dark:text-indigo-200 font-medium">
                  <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
                  <span>{authRetryStatus}</span>
                </div>
              )}

              {/* Structured Error Alert + Actionable Recovery */}
              {authError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 space-y-2.5 text-xs text-rose-800 dark:text-rose-200 font-medium">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span>{authError}</span>
                      {authErrorDetails?.code && (
                        <p className="text-[10px] font-mono text-rose-700/80 dark:text-rose-300/75">
                          Code: {authErrorDetails.code}
                          {attemptCount > 1 ? ` · Attempt ${attemptCount}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {isDomainError && currentHostname && (
                    <div className="pl-6 pt-2 space-y-2 border-t border-rose-200/70 dark:border-rose-800/60">
                      <p className="text-[11px] text-rose-900 dark:text-rose-200 leading-relaxed">
                        Copy this hostname and add it in Firebase Console → Authentication → Settings → Authorized domains, then click Retry below:
                      </p>
                      <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-slate-900/75 px-2.5 py-1.5 rounded-lg border border-rose-200/80 dark:border-rose-800/60">
                        <code className="text-[11px] truncate text-rose-900 dark:text-rose-100">
                          {currentHostname}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyDomain}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
                        >
                          {copiedDomain ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>Open Firebase Authorized Domains</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {isPopupError && isInIframe && currentHref && (
                    <div className="pl-6 pt-2 space-y-1.5 border-t border-rose-200/70 dark:border-rose-800/60">
                      <p className="text-[11px] text-rose-900 dark:text-rose-200 leading-relaxed">
                        Running inside an embedded preview frame can block OAuth popups. Open the app directly in a full browser tab and sign in there:
                      </p>
                      <a
                        href={currentHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>Open AI StudyMate in Full Tab</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Prominent Google Sign-In / Retry Button */}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white rounded-2xl border border-slate-300 dark:border-slate-700 font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                ) : authError && isRetryableError ? (
                  <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                )}
                <span>
                  {isLoading
                    ? authRetryStatus
                      ? 'Retrying Google Sign-In...'
                      : 'Connecting with Google...'
                    : authError && isRetryableError
                    ? 'Retry Google Sign-In'
                    : 'Continue with Google'}
                </span>
              </button>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                Instant one-click sign-in via Google Authentication
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
