import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { DocumentDetail, Finding } from '../types';
import { getDocumentPreviewUrl } from '../services/api';

interface DocumentViewerProps {
  document: DocumentDetail;
  currentPage: number;
  onPageChange: (page: number) => void;
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
  redactedPreview?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  currentPage,
  onPageChange,
  selectedFindingId,
  onSelectFinding,
  redactedPreview = false,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  const previewUrl = getDocumentPreviewUrl(document.id, currentPage);

  // Filter findings on the current page
  const pageFindings = document.findings.filter((f) => f.page === currentPage);
  const isImageOrPdf = document.mime_type.includes('pdf') || document.mime_type.includes('image');

  const handleZoomIn = () => setZoom((z) => Math.min(z + 20, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 20, 60));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#05070a] border border-vault-border rounded-xl overflow-hidden shadow-2xl relative">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-vault-border bg-vault-card px-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-3">
          <span className="text-vault-muted font-medium">{document.original_name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-vault-border text-vault-subtle">
            {document.mime_type.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
          </span>
          {document.is_scanned && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-vault-purpleBg text-vault-purple border border-vault-purple/30">
              OCR PROCESSED
            </span>
          )}
          {redactedPreview && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-vault-crimsonBg text-vault-crimson border border-vault-crimson/40 animate-pulse">
              SANITIZED PREVIEW
            </span>
          )}
        </div>

        {/* Page navigation & Zoom controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-vault-bg px-2 py-1 rounded border border-vault-border">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-0.5 hover:text-vault-text text-vault-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-vault-muted">
              Page <strong className="text-vault-text">{currentPage}</strong> of {document.page_count || 1}
            </span>
            <button
              disabled={currentPage >= (document.page_count || 1)}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-0.5 hover:text-vault-text text-vault-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-vault-bg px-2 py-1 rounded border border-vault-border">
            <button onClick={handleZoomOut} className="p-0.5 hover:text-vault-text text-vault-muted" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center text-vault-muted text-[11px]">{zoom}%</span>
            <button onClick={handleZoomIn} className="p-0.5 hover:text-vault-text text-vault-muted" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleResetZoom} className="p-0.5 hover:text-vault-text text-vault-muted ml-1" title="Reset Zoom">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center vault-grid-bg relative select-none">
        {isImageOrPdf && !imageError ? (
          <div
            className="transition-transform duration-150 origin-top shadow-2xl relative border border-vault-borderLight rounded-sm bg-white"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <img
              src={previewUrl}
              alt={`Document Preview Page ${currentPage}`}
              className="max-w-none block rounded-sm pointer-events-none"
              style={{ maxHeight: '85vh', width: 'auto' }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />

            {/* Bounding box highlight overlays for detected entities on this page */}
            {imageLoaded && (
              <div className="absolute inset-0 pointer-events-none">
                {pageFindings.map((finding) => {
                  const isSelected = selectedFindingId === finding.id;
                  const isRedacted = finding.status === 'REDACTED';

                  return (
                    <div
                      key={finding.id}
                      className={`transition-all ${
                        isSelected
                          ? 'ring-2 ring-vault-crimson ring-offset-1 bg-vault-crimson/20'
                          : isRedacted
                          ? 'bg-black/90'
                          : 'bg-vault-crimson/10 border border-vault-crimson/40'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Text / DOCX fallback view */
          <div
            className="w-full max-w-3xl bg-vault-card border border-vault-border rounded-xl p-8 font-mono text-sm leading-relaxed text-vault-muted space-y-4 shadow-xl overflow-auto"
            style={{ maxHeight: '80vh', transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-vault-border text-xs text-vault-subtle">
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-vault-cyan" />
                <span>Extracted Document Text Stream</span>
              </span>
              <span>{document.extracted_text?.length || 0} characters</span>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed select-text font-mono text-xs text-vault-text">
              {document.extracted_text || 'No text extracted from document.'}
            </div>
          </div>
        )}
      </div>

      {/* Footer Finding Quick-Summary Bar */}
      <div className="h-10 border-t border-vault-border bg-vault-card/90 px-4 flex items-center justify-between text-xs font-mono text-vault-muted">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-vault-crimson">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{pageFindings.length} PII finding(s) on Page {currentPage}</span>
          </span>
          <span className="text-vault-border">|</span>
          <span>Total Document Findings: <strong className="text-vault-text">{document.findings.length}</strong></span>
        </div>
        <div className="text-[11px] text-vault-subtle">
          Forensic Inspection Mode • 100% Client-Side Render
        </div>
      </div>
    </div>
  );
};
