import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, PageId } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { DocumentScanner } from './pages/DocumentScanner';
import { DocumentReview } from './pages/DocumentReview';
import { BatchProcessing } from './pages/BatchProcessing';
import { Analytics } from './pages/Analytics';
import { AuditLog } from './pages/AuditLog';
import { PrivacyPolicies } from './pages/PrivacyPolicies';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: PageId, docId?: string) => {
    if (docId) {
      setActiveDocId(docId);
    }
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const handleDemoLoaded = (docId: string) => {
    setActiveDocId(docId);
    setCurrentPage('review');
  };

  const handleScanComplete = (docId: string) => {
    setActiveDocId(docId);
    setCurrentPage('review');
  };

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text flex flex-col font-sans selection:bg-vault-crimson selection:text-white">
      {/* Top Header */}
      <Header onDemoLoaded={handleDemoLoaded} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onSelectPage={(page) => { setCurrentPage(page); setSidebarOpen(false); }}
          activeDocId={activeDocId}
          isOpen={sidebarOpen}
        />
        {sidebarOpen && <button aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden" />}

        {/* Dynamic Page Content */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-vault-bg">
          {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {currentPage === 'scanner' && <DocumentScanner onScanComplete={handleScanComplete} />}
          {currentPage === 'review' && (
            <DocumentReview documentId={activeDocId} onNavigate={handleNavigate} />
          )}
          {currentPage === 'batch' && <BatchProcessing onNavigate={handleNavigate} />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'audit' && <AuditLog />}
          {currentPage === 'policies' && <PrivacyPolicies />}
          {currentPage === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
};

export default App;
