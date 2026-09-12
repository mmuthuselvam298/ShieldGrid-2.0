import React, { useState, useEffect } from 'react';
import {
  Layers,
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  Lock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { batchUploadDocuments, listDocuments, getBatchExportUrl, redactDocument } from '../services/api';
import { DocumentItem } from '../types';
import { PageId } from '../components/Sidebar';

interface BatchProcessingProps {
  onNavigate: (page: PageId, docId?: string) => void;
}

export const BatchProcessing: React.FC<BatchProcessingProps> = ({ onNavigate }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [batchRedacting, setBatchRedacting] = useState<boolean>(false);

  const refreshDocs = async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {}
  };

  useEffect(() => {
    refreshDocs();
  }, []);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleStartBatch = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    try {
      await batchUploadDocuments(selectedFiles, 'policy_default');
      setSelectedFiles([]);
      await refreshDocs();
    } catch (err: any) {
      alert(`Batch upload failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchRedactAll = async () => {
    const unredacted = documents.filter((d) => d.status !== 'REDACTED');
    if (unredacted.length === 0) {
      alert('All documents are already redacted.');
      return;
    }

    setBatchRedacting(true);
    try {
      for (const d of unredacted) {
        await redactDocument(d.id, { default_mode: 'BLACK_BOX' });
      }
      await refreshDocs();
      alert(`Successfully sanitized ${unredacted.length} document(s).`);
    } catch (err: any) {
      alert(`Batch redaction error: ${err.message}`);
    } finally {
      setBatchRedacting(false);
    }
  };

  const handleDownloadZip = () => {
    const url = getBatchExportUrl();
    window.open(url, '_blank');
  };

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <p className="text-sm font-medium text-vault-blue mb-2">Document workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-vault-text">
            Batch processing
          </h1>
          <p className="text-sm text-vault-muted mt-2">
            Process multiple documents together and protect them in one workflow.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            disabled={batchRedacting || documents.length === 0}
            onClick={handleBatchRedactAll}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-vault-blue hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>{batchRedacting ? 'Redacting Queue...' : 'Redact Entire Batch'}</span>
          </button>

          <button
            onClick={handleDownloadZip}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-vault-border text-vault-text text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Batch ZIP</span>
          </button>
        </div>
      </div>

      {/* Batch Upload Dropzone */}
      <div className="workspace-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-4 h-4 text-vault-cyan" />
            <h3 className="text-sm font-semibold text-vault-text">
              Add files to the queue
            </h3>
          </div>
          {selectedFiles.length > 0 && (
            <span className="text-xs font-mono text-vault-muted">
              {selectedFiles.length} file(s) queued
            </span>
          )}
        </div>

        <div className="border border-dashed border-vault-border rounded-lg p-6 text-center space-y-2">
          <label className="cursor-pointer text-xs font-mono text-vault-muted hover:text-vault-text block">
            <span className="text-vault-cyan hover:underline font-semibold">Select multiple files</span> or drop here
            <input
              type="file"
              multiple
              onChange={handleFileSelection}
              className="hidden"
              accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
            />
          </label>
          <p className="text-[11px] text-vault-subtle font-mono">
            Supported: PDF, DOCX, Scanned Images (PNG/JPG), TXT
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-mono text-vault-text truncate max-w-md">
              {selectedFiles.map((f) => f.name).join(', ')}
            </div>
            <button
              disabled={isProcessing}
              onClick={handleStartBatch}
              className="px-4 py-2 rounded-lg bg-vault-crimson hover:bg-red-600 text-white font-mono text-xs font-bold uppercase"
            >
              {isProcessing ? 'Processing Batch...' : 'Process Files Now'}
            </button>
          </div>
        )}
      </div>

      {/* Queue Table */}
      <div className="workspace-card overflow-hidden">
        <div className="px-6 py-4 border-b border-vault-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-vault-text">
            Documents ({documents.length})
          </h2>
        </div>

        {documents.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Layers className="w-8 h-8 text-vault-subtle mx-auto opacity-50" />
            <p className="text-xs font-mono text-vault-muted">Queue is currently empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-vault-bg/60 border-b border-vault-border text-vault-subtle text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">File Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Ingested At</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vault-border/50 text-vault-text">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onNavigate('review', doc.id)}
                    className="hover:bg-vault-cardHover transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-6 font-medium group-hover:text-vault-crimson transition-colors truncate max-w-xs">
                      {doc.original_name}
                    </td>
                    <td className="py-3 px-4 text-vault-muted">
                      {doc.mime_type.split('/')[1]?.toUpperCase()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          doc.status === 'REDACTED'
                            ? 'bg-vault-emeraldBg text-vault-emerald border-vault-emerald/30'
                            : 'bg-vault-bg text-vault-muted border-vault-border'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          doc.risk_level === 'CRITICAL'
                            ? 'bg-vault-crimsonBg text-vault-crimson border-vault-crimson/30'
                            : doc.risk_level === 'HIGH'
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            : doc.risk_level === 'MEDIUM'
                            ? 'bg-vault-amberBg text-vault-amber border-vault-amber/30'
                            : 'bg-vault-emeraldBg text-vault-emerald border-vault-emerald/30'
                        }`}
                      >
                        {doc.risk_level} ({doc.risk_score.toFixed(0)})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-vault-crimson">
                      {doc.findings_count ?? 0} PII
                    </td>
                    <td className="py-3 px-4 text-vault-subtle text-[11px]">
                      {new Date(doc.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className="text-vault-cyan text-xs group-hover:underline flex items-center justify-end space-x-1">
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
