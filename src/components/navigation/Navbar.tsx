import React, { useState } from 'react';
import { useStudy, NavigationTab } from '../../context/StudyContext';
import {
  Search,
  Plus,
  BookOpen,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  Check,
  AlertCircle,
  Menu,
  X,
  FileDown,
  Database,
  Cloud,
  LogIn,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const {
    activeTab,
    setActiveTab,
    currentPack,
    savedPacks,
    selectPackById,
    setIsSearchOpen,
    setIsUploadModalOpen,
    setIsExportPdfModalOpen,
    setIsApiKeyModalOpen,
    setIsAuthModalOpen,
    settings,
    toggleTheme,
    user,
    loginWithGoogle,
    logout,
    isDbConnected,
  } = useStudy();

  const [isPackDropdownOpen, setIsPackDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Study Dashboard';
      case 'packs':
        return 'My Study Packs';
      case 'notes':
        return 'Handwritten Notes';
      case 'mindmap':
        return 'Interactive Mind Map';
      case 'summary':
        return 'Revision Summaries';
      case 'definitions':
        return 'Important Definitions';
      case 'concepts':
        return 'Key Concepts';
      case 'casestudy':
        return 'Case Study Lab';
      case 'podcast':
        return 'Listen & Learn Podcast';
      case 'quiz':
        return 'Interactive Quiz';
      case 'viva':
        return 'AI Viva Voce';
      case 'exam':
        return 'Exam Planner';
      case 'youtube':
        return 'YouTube Resources';
      case 'progress':
        return 'Academic Progress';
      case 'settings':
        return 'AI & App Settings';
      default:
        return 'AI StudyMate';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: View Title & Pack Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <img
            src="/favicon.svg"
            alt="AI StudyMate"
            className="lg:hidden w-7 h-7 rounded-lg shadow-xs shrink-0 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          />

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {getTitle()}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              {currentPack.title}
            </p>
          </div>

          {/* Quick Study Pack Switcher Dropdown */}
          <div className="relative hidden md:block shrink-0">
            <button
              onClick={() => setIsPackDropdownOpen(!isPackDropdownOpen)}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="max-w-[110px] lg:max-w-[140px] truncate">{currentPack.title}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {isPackDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsPackDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                    Switch Study Pack ({savedPacks.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {savedPacks.map((pack) => {
                      const isSelected = pack.id === currentPack.id;
                      return (
                        <button
                          key={pack.id}
                          onClick={() => {
                            selectPackById(pack.id);
                            setIsPackDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate font-medium">{pack.title}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {pack.subject || 'General'}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-1.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                    <button
                      onClick={() => {
                        setIsPackDropdownOpen(false);
                        setIsUploadModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Study Pack</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Action Icons & Primary CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Gemini API Key Status / Modal Trigger */}
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              settings.geminiConnected
                ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 shadow-2xs'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            }`}
            title="Configure or Test Google Gemini API Key"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{settings.geminiConnected ? 'Gemini 3.8 Active' : 'Connect Gemini'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                settings.geminiConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
          </button>

          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Search study materials"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Toggle color theme"
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Database / Cloud Sync Status & Account */}
          <div className="relative shrink-0">
            {user ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 py-1 px-2 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                title="Google Account & Firestore Database Synced"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[100px] truncate text-[11px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
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
                <span className="hidden sm:inline">Google Sign In</span>
              </button>
            )}

            {isUserMenuOpen && user && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-20 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Firestore Database Connected</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Saved Packs:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {savedPacks.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database ID:</span>
                      <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                        ai-studio-aistudymate
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveTab('settings');
                      }}
                      className="w-full text-left py-1 px-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Database Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left py-1 px-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export PDF Button */}
          <button
            onClick={() => setIsExportPdfModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Export Study Pack to Printable PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden md:inline">Export PDF</span>
          </button>

          {/* Generate Study Pack CTA */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-3 sm:px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline sm:inline">Generate Pack</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 pb-1">
            Navigation
          </div>
          {[
            { tab: 'dashboard' as NavigationTab, label: 'Dashboard' },
            { tab: 'packs' as NavigationTab, label: 'My Study Packs' },
            { tab: 'notes' as NavigationTab, label: 'Handwritten Notes' },
            { tab: 'mindmap' as NavigationTab, label: 'Mind Maps' },
            { tab: 'summary' as NavigationTab, label: 'Summaries' },
            { tab: 'definitions' as NavigationTab, label: 'Definitions' },
            { tab: 'concepts' as NavigationTab, label: 'Concepts' },
            { tab: 'casestudy' as NavigationTab, label: 'Case Study Lab' },
            { tab: 'podcast' as NavigationTab, label: 'Listen & Learn Podcast' },
            { tab: 'quiz' as NavigationTab, label: 'Quizzes' },
            { tab: 'viva' as NavigationTab, label: 'AI Viva Mode' },
            { tab: 'exam' as NavigationTab, label: 'Study Planner' },
            { tab: 'youtube' as NavigationTab, label: 'YouTube Resources' },
            { tab: 'progress' as NavigationTab, label: 'Progress & Stats' },
            { tab: 'settings' as NavigationTab, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => {
                setActiveTab(item.tab);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === item.tab
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
