import React, { useState, useEffect } from 'react';
import {
  getDocument,
  updateFinding,
  redactDocument,
  getSanitizedDownloadUrl,
  deleteDocument
} from '../services/api';
import { DocumentDetail, Finding, RedactionMode, FindingStatus } from '../types';
import { DocumentViewer } from '../components/DocumentViewer';
import { FindingsPanel } from '../components/FindingsPanel';
import { RiskIndicator } from '../components/RiskIndicator';
import {
  FileText,
  Trash2,
  Download,
  Eye,
  Lock,
  ChevronLeft,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { PageId } from '../components/Sidebar';

interface DocumentReviewProps {
  documentId: string | null;
  onNavigate: (page: PageId) => void;
}

export const DocumentReview: React.FC<DocumentReviewProps> = ({ documentId, onNavigate }) => {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [isRedacting, setIsRedacting] = useState<boolean>(false);
  const [viewRedacted, setViewRedacted] = useState<boolean>(false);

  const fetchDoc = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocument(id);
      setDoc(data);
      if (data.status === 'REDACTED') {
        setViewRedacted(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchDoc(documentId);
    } else {
      setLoading(false);
    }
  }, [documentId]);

  const handleUpdateFinding = async (
    findingId: string,
    update: { status?: FindingStatus; redaction_mode?: RedactionMode }
  ) => {
    try {
      const updated = await updateFinding(findingId, update);
      setDoc((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          findings: prev.findings.map((f) => (f.id === findingId ? updated : f)),
        };
      });
    } catch (err: any) {
      alert(`Error updating finding: ${err.message}`);
    }
  };

  const handleRedactAll = async (mode: RedactionMode) => {
    if (!doc) return;
    setIsRedacting(true);
    try {
      await redactDocument(doc.id, { default_mode: mode });
      await fetchDoc(doc.id);
      setViewRedacted(true);
    } catch (err: any) {
      alert(`Redaction failed: ${err.message}`);
    } finally {
      setIsRedacting(false);
    }
  };

  const handleDownload = () => {
    if (!doc) return;
    const url = getSanitizedDownloadUrl(doc.id);
    window.open(url, '_blank');
  };

  const handleDelete = async () => {
    if (!doc) return;
    if (window.confirm(`Are you sure you want to permanently purge '${doc.original_name}' from the vault?`)) {
      try {
        await deleteDocument(doc.id);
        onNavigate('scanner');
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  if (!documentId) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto select-none">
        <FileText className="w-12 h-12 text-vault-subtle mx-auto opacity-50" />
        <h2 className="text-sm font-mono font-bold uppercase text-vault-text">
          No Document Selected For Forensic Review
        </h2>
        <p className="text-xs font-mono text-vault-muted">
          Upload a document in the Scanner or select one from the Dashboard to launch the review workstation.
        </p>
        <button
          onClick={() => onNavigate('scanner')}
          className="px-4 py-2 rounded-lg bg-vault-crimson hover:bg-red-600 text-white font-mono text-xs uppercase tracking-wider"
        >
          Go To Scanner
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-3 min-h-[500px]">
        <div className="w-8 h-8 border-2 border-vault-crimson border-t-transparent rounded-full animate-spin"></div>
        <span className="font-mono text-xs text-vault-muted">Loading forensic review workspace...</span>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-vault-crimson mx-auto" />
        <div className="text-xs font-mono text-vault-crimson">{error || 'Document not found'}</div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-3 py-1.5 rounded bg-vault-border text-vault-text text-xs font-mono"
        >
          Back To Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden select-none bg-vault-bg">
      {/* Forensic Workstation Top Banner */}
      <div className="h-12 border-b border-vault-border bg-vault-card px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-1 text-vault-muted hover:text-vault-text text-xs font-mono"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <span className="text-vault-border">/</span>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-semibold text-vault-text truncate max-w-xs">
              {doc.original_name}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                doc.status === 'REDACTED'
                  ? 'bg-vault-emeraldBg text-vault-emerald border-vault-emerald/30'
                  : 'bg-vault-crimsonBg text-vault-crimson border-vault-crimson/30'
              }`}
            >
              {doc.status}
            </span>
          </div>
        </div>

        {/* View Toggle & Purge Action */}
        <div className="flex items-center space-x-3">
          {doc.status === 'REDACTED' && (
            <button
              onClick={() => setViewRedacted(!viewRedacted)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono border transition-all ${
                viewRedacted
                  ? 'bg-vault-crimson text-white border-vault-crimson'
                  : 'bg-vault-bg text-vault-muted border-vault-border hover:text-vault-text'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{viewRedacted ? 'Viewing Sanitized' : 'View Original'}</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            title="Permanently Delete Document"
            className="p-1.5 rounded hover:bg-vault-crimsonBg text-vault-subtle hover:text-vault-crimson border border-transparent hover:border-vault-crimson/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Column Forensic Workstation Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Page Thumbnails & Navigation & Risk Gauge */}
        <div className="w-60 border-r border-vault-border bg-vault-bg flex flex-col justify-between overflow-y-auto p-4 space-y-4">
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-vault-subtle uppercase tracking-wider">
              Document Pages ({doc.page_count})
            </div>
            <div className="space-y-2">
              {Array.from({ length: doc.page_count || 1 }).map((_, idx) => {
                const pageNum = idx + 1;
                const pageFindingCount = doc.findings.filter((f) => f.page === pageNum).length;
                const isCurrent = currentPage === pageNum;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-vault-card border-vault-crimson text-vault-text shadow-sm'
                        : 'bg-vault-bg border-vault-border text-vault-muted hover:border-vault-borderLight'
                    }`}
                  >
                    <span>Page {pageNum}</span>
                    {pageFindingCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-vault-crimsonBg text-vault-crimson font-bold border border-vault-crimson/30">
                        {pageFindingCount} PII
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Risk Score Indicator */}
          <RiskIndicator score={doc.risk_score} level={doc.risk_level} showFactors={true} />
        </div>

        {/* Center Column: Interactive Document Viewport */}
        <DocumentViewer
          document={doc}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          selectedFindingId={selectedFindingId}
          onSelectFinding={setSelectedFindingId}
          redactedPreview={viewRedacted}
        />

        {/* Right Column: Privacy Findings & Redaction Dock */}
        <FindingsPanel
          findings={doc.findings}
          selectedFindingId={selectedFindingId}
          onSelectFinding={setSelectedFindingId}
          onUpdateFinding={handleUpdateFinding}
          onRedactAll={handleRedactAll}
          isRedacting={isRedacting}
          onDownload={handleDownload}
          hasRedactedDoc={doc.status === 'REDACTED'}
        />
      </div>
    </div>
  );
};
