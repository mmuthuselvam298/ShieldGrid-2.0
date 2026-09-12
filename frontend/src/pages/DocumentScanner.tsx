import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Lock,
  Server,
  ArrowRight
} from 'lucide-react';
import { uploadDocument, getPolicies, listDemos, loadDemoDocument } from '../services/api';
import { PolicyItem, DemoItem } from '../types';

interface DocumentScannerProps {
  onScanComplete: (docId: string) => void;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({ onScanComplete }) => {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<string>('policy_india_privacy');
  const [demos, setDemos] = useState<DemoItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPolicies().then(setPolicies).catch(() => {});
    listDemos().then(setDemos).catch(() => {});
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartScan = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      setProgressStep('Validating file integrity and MIME signature...');
      await new Promise((r) => setTimeout(r, 400));

      setProgressStep('Extracting document stream & applying Tesseract OCR...');
      await new Promise((r) => setTimeout(r, 400));

      setProgressStep('Running Presidio Analyzer & Custom India Recognizers (PAN, Aadhaar)...');
      
      const doc = await uploadDocument(file, selectedPolicy);

      setProgressStep('Calculating explainable ShieldGrid Risk Score...');
      await new Promise((r) => setTimeout(r, 300));

      onScanComplete(doc.id);
    } catch (err: any) {
      setError(err.message || 'Ingestion pipeline failed');
      setIsProcessing(false);
    }
  };

  const handleLoadDemo = async (demoId: string) => {
    setIsProcessing(true);
    setError(null);
    setProgressStep(`Ingesting synthetic demo record [${demoId}]...`);
    try {
      const doc = await loadDemoDocument(demoId);
      onScanComplete(doc.id);
    } catch (err: any) {
      setError(err.message || 'Demo ingestion failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 select-none">
      <div>
        <h1 className="text-xl font-mono font-bold uppercase tracking-wider text-vault-text">
          Forensic Document Ingestion & PII Scanner
        </h1>
        <p className="text-xs font-mono text-vault-muted mt-1">
          Upload PDF, DOCX, Images, or TXT for multi-engine privacy intelligence, OCR, and confidence scoring.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-vault-crimsonBg border border-vault-crimson/50 text-vault-crimson text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dropzone & Status (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[340px] relative overflow-hidden ${
              isDragging
                ? 'border-vault-crimson bg-vault-crimsonBg/20'
                : file
                ? 'border-vault-emerald/50 bg-vault-card'
                : 'border-vault-border bg-vault-card hover:border-vault-borderLight'
            }`}
          >
            {isProcessing && (
              <div className="absolute inset-0 bg-vault-bg/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4 z-20">
                <div className="w-12 h-12 rounded-full border-2 border-vault-crimson border-t-transparent animate-spin"></div>
                <div className="font-mono text-xs font-bold text-vault-text uppercase tracking-wider">
                  Scanning Document...
                </div>
                <div className="text-xs font-mono text-vault-cyan animate-pulse">
                  {progressStep}
                </div>
              </div>
            )}

            <div className="w-16 h-16 rounded-2xl bg-vault-bg border border-vault-border flex items-center justify-center mb-4 text-vault-muted group-hover:text-vault-text transition-colors">
              <UploadCloud className="w-8 h-8 text-vault-cyan" />
            </div>

            {file ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-vault-text font-mono">{file.name}</div>
                <div className="text-xs text-vault-muted font-mono">
                  {(file.size / 1024).toFixed(1)} KB • Ready for Forensic Analysis
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-xs text-vault-crimson hover:underline font-mono"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-vault-text font-mono">
                  Drag & Drop Document Here, or{' '}
                  <label className="text-vault-cyan hover:underline cursor-pointer">
                    Browse File
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
                    />
                  </label>
                </p>
                <p className="text-xs text-vault-subtle font-mono">
                  Supports PDF, DOCX, Scanned Images (PNG/JPG with OCR), and TXT up to 25MB
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          {file && !isProcessing && (
            <button
              onClick={handleStartScan}
              className="w-full py-3 rounded-xl bg-vault-crimson hover:bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-vault-crimson/20"
            >
              <span>Execute Forensic Privacy Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Policy Selector & One-Click Demos (1 col) */}
        <div className="space-y-6">
          {/* Policy Preset Selection */}
          <div className="bg-vault-card border border-vault-border rounded-xl p-5 space-y-3">
            <div className="flex items-center space-x-2 border-b border-vault-border pb-2">
              <ShieldCheck className="w-4 h-4 text-vault-emerald" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-vault-text">
                Active Privacy Policy
              </h3>
            </div>
            <div className="space-y-2">
              {policies.map((p) => (
                <label
                  key={p.id}
                  className={`block p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedPolicy === p.id
                      ? 'bg-vault-cardHover border-vault-crimson/60 shadow-sm'
                      : 'bg-vault-bg border-vault-border hover:border-vault-borderLight'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <input
                      type="radio"
                      name="policy"
                      value={p.id}
                      checked={selectedPolicy === p.id}
                      onChange={() => setSelectedPolicy(p.id)}
                      className="mt-0.5 text-vault-crimson focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-vault-text font-mono">{p.name}</div>
                      <div className="text-[10px] text-vault-muted line-clamp-2 mt-0.5">
                        {p.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Quick Synthetic Demo Loader */}
          <div className="bg-vault-card border border-vault-border rounded-xl p-5 space-y-3">
            <div className="flex items-center space-x-2 border-b border-vault-border pb-2">
              <Sparkles className="w-4 h-4 text-vault-amber" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-vault-text">
                Instant Synthetic Demos
              </h3>
            </div>
            <p className="text-[11px] text-vault-subtle">
              Test full multi-engine detection with 1-click synthetic records:
            </p>
            <div className="space-y-1.5">
              {demos.map((d) => (
                <button
                  key={d.id}
                  disabled={isProcessing}
                  onClick={() => handleLoadDemo(d.id)}
                  className="w-full text-left p-2 rounded bg-vault-bg hover:bg-vault-cardHover border border-vault-border text-xs font-mono flex items-center justify-between group disabled:opacity-50 transition-colors"
                >
                  <span className="text-vault-muted group-hover:text-vault-amber transition-colors truncate">
                    {d.name}
                  </span>
                  <span className="text-[10px] text-vault-subtle font-mono">{d.format}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
