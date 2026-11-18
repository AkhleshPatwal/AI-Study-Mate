import React from 'react';
import { useStudy, NavigationTab } from '../../context/StudyContext';
import {
  BookOpen,
  Brain,
  Sparkles,
  Home,
  FolderOpen,
  FileEdit,
  Network,
  AlignLeft,
  Bookmark,
  Lightbulb,
  HelpCircle,
  Mic,
  Calendar,
  Youtube,
  BarChart3,
  Settings,
  Sun,
  Moon,
  PlusCircle,
  Search,
  Database,
  LogIn,
  UserCheck,
  Briefcase,
  Headphones,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    settings,
    toggleTheme,
    currentPack,
    setIsUploadModalOpen,
    setIsSearchOpen,
    setIsAuthModalOpen,
    user,
    loginWithGoogle,
  } = useStudy();

  const navItems: { tab: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { tab: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { tab: 'packs', label: 'My Study Packs', icon: <FolderOpen className="w-5 h-5" /> },
    { tab: 'notes', label: 'Handwritten Notes', icon: <FileEdit className="w-5 h-5" /> },
    { tab: 'mindmap', label: 'Mind Maps', icon: <Network className="w-5 h-5" /> },
    { tab: 'summary', label: 'Summaries', icon: <AlignLeft className="w-5 h-5" /> },
    { tab: 'definitions', label: 'Definitions', icon: <Bookmark className="w-5 h-5" /> },
    { tab: 'concepts', label: 'Key Concepts', icon: <Lightbulb className="w-5 h-5" /> },
    { tab: 'casestudy', label: 'Case Study Lab', icon: <Briefcase className="w-5 h-5" />, badge: 'Lab' },
    { tab: 'podcast', label: 'Listen & Learn', icon: <Headphones className="w-5 h-5" />, badge: 'Audio' },
    { tab: 'quiz', label: 'Quizzes', icon: <HelpCircle className="w-5 h-5" /> },
    { tab: 'viva', label: 'AI Viva Mode', icon: <Mic className="w-5 h-5" />, badge: 'AI' },
    { tab: 'exam', label: 'Study Planner', icon: <Calendar className="w-5 h-5" /> },
    { tab: 'youtube', label: 'YouTube Resources', icon: <Youtube className="w-5 h-5" /> },
    { tab: 'progress', label: 'Progress & Stats', icon: <BarChart3 className="w-5 h-5" /> },
    { tab: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-68 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 z-30 select-none transition-colors duration-200">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-indigo-500/25 ring-1 ring-slate-200 dark:ring-slate-700/80 shrink-0">
              <img
                src="/favicon.svg"
                alt="AI StudyMate"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight font-sans-academic">
                  AI StudyMate
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Academic AI Assistant
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Study Pack</span>
          </button>
        </div>

        {/* Current Active Pack Pill */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">
            Active Study Pack
          </div>
          <button
            onClick={() => setActiveTab('notes')}
            className="w-full text-left truncate text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-between"
            title={currentPack.title}
          >
            <span className="truncate">{currentPack.title}</span>
            {currentPack.isDemo && (
              <span className="ml-1 text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
                Demo
              </span>
            )}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer / Controls */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* Quick Search trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search material...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Database Integration Status Card */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>Firestore DB</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {user ? 'Synced' : 'Active'}
              </span>
            </div>
            {user ? (
              <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google user'}
                      className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/40"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                  title="Google Account Settings"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="mt-2 w-full py-1.5 px-2 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Sign in with Google"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                <span>Google Sign In</span>
              </button>
            )}
          </div>

          {/* Theme & Status Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  settings.geminiConnected
                    ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {settings.geminiConnected ? 'Gemini AI Ready' : 'API Key Needed'}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-medium ${
            activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-medium ${
            activeTab === 'notes' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FileEdit className="w-5 h-5 mb-0.5" />
          <span>Notes</span>
        </button>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex flex-col items-center -mt-4 p-2 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveTab('casestudy')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-medium ${
            activeTab === 'casestudy' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Briefcase className="w-5 h-5 mb-0.5" />
          <span>Cases</span>
        </button>
        <button
          onClick={() => setActiveTab('podcast')}
          className={`flex flex-col items-center p-1.5 text-[10px] font-medium ${
            activeTab === 'podcast' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Headphones className="w-5 h-5 mb-0.5" />
          <span>Podcast</span>
        </button>
      </nav>
    </>
  );
};
