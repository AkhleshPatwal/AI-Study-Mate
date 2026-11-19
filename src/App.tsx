/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Sidebar } from './components/navigation/Sidebar';
import { Navbar } from './components/navigation/Navbar';
import { UploadModal } from './components/study/UploadModal';
import { GlobalSearchModal } from './components/study/GlobalSearchModal';
import { ExportPdfModal } from './components/study/ExportPdfModal';
import { GeminiApiKeyModal } from './components/modals/GeminiApiKeyModal';
import { GoogleAuthModal } from './components/modals/GoogleAuthModal';

// Views
import { DashboardView } from './views/DashboardView';
import { HandwrittenNotesView } from './views/HandwrittenNotesView';
import { MindMapView } from './views/MindMapView';
import { SummaryView } from './views/SummaryView';
import { DefinitionsView } from './views/DefinitionsView';
import { ConceptsView } from './views/ConceptsView';
import { QuizView } from './views/QuizView';
import { VivaView } from './views/VivaView';
import { ExamPlannerView } from './views/ExamPlannerView';
import { YouTubeResourcesView } from './views/YouTubeResourcesView';
import { StudyPacksView } from './views/StudyPacksView';
import { ProgressDashboardView } from './views/ProgressDashboardView';
import { SettingsView } from './views/SettingsView';
import { CaseStudyLabView } from './views/CaseStudyLabView';
import { ListenLearnView } from './views/ListenLearnView';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    settings,
    isUploadModalOpen,
    setIsUploadModalOpen,
    isExportPdfModalOpen,
    setIsExportPdfModalOpen,
    isOnline,
    savedPacks,
  } = useStudy();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'packs':
        return <StudyPacksView />;
      case 'notes':
        return <HandwrittenNotesView />;
      case 'mindmap':
        return <MindMapView />;
      case 'summary':
        return <SummaryView />;
      case 'definitions':
        return <DefinitionsView />;
      case 'concepts':
        return <ConceptsView />;
      case 'casestudy':
        return <CaseStudyLabView />;
      case 'podcast':
        return <ListenLearnView />;
      case 'quiz':
        return <QuizView />;
      case 'viva':
        return <VivaView />;
      case 'exam':
        return <ExamPlannerView />;
      case 'youtube':
        return <YouTubeResourcesView />;
      case 'progress':
        return <ProgressDashboardView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div
      data-theme={settings.theme}
      className={`flex min-h-screen ${settings.theme === 'dark' ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors`}
    >
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Navbar />

        {!isOnline && (
          <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/70 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 text-center font-medium">
            Offline Mode — Reading from your local IndexedDB library ({savedPacks.length} cached study{' '}
            {savedPacks.length === 1 ? 'pack' : 'packs'}). Changes will sync automatically once reconnected.
          </div>
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {renderActiveView()}
        </main>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
      <ExportPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
      />
      <GlobalSearchModal />
      <GeminiApiKeyModal />
      <GoogleAuthModal />
    </div>
  );
};

export default function App() {
  return (
    <StudyProvider>
      <MainLayout />
    </StudyProvider>
  );
}
