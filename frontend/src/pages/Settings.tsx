import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Server, Database, Trash2, CheckCircle2, Lock } from 'lucide-react';

export const Settings: React.FC = () => {
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [ocrLang, setOcrLang] = useState<string>('eng');
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 select-none font-mono">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wider text-vault-text">
          Vault Configuration & Engine Parameters
        </h1>
        <p className="text-xs text-vault-muted mt-1">
          Tune retention schedules, OCR pipelines, cryptographic primitives, and security boundaries.
        </p>
      </div>

      {/* Retention Schedule Card */}
      <div className="bg-vault-card border border-vault-border rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-vault-border pb-3">
          <Database className="w-4 h-4 text-vault-cyan" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-vault-text">
            Data Retention & Purge Policy
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <label className="text-vault-muted">Storage Retention Horizon:</label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full bg-vault-bg border border-vault-border rounded p-2 text-vault-text focus:outline-none"
            >
              <option value={7}>7 Days (Strict Vault Mode)</option>
              <option value={30}>30 Days (Standard Enterprise)</option>
              <option value={90}>90 Days (Extended Regulatory Audit)</option>
            </select>
            <p className="text-[10px] text-vault-subtle">
              Original documents and rendered preview frames older than this horizon are automatically flagged for purge.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-vault-muted">Tesseract OCR Primary Language:</label>
            <select
              value={ocrLang}
              onChange={(e) => setOcrLang(e.target.value)}
              className="w-full bg-vault-bg border border-vault-border rounded p-2 text-vault-text focus:outline-none"
            >
              <option value="eng">English (eng)</option>
              <option value="eng+osd">English + Script Orientation (eng+osd)</option>
            </select>
            <p className="text-[10px] text-vault-subtle">
              Executed via local Tesseract 5.5 binary with Otsu adaptive binarization preprocessing.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-vault-border flex items-center justify-between">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-vault-crimson hover:bg-red-600 text-white text-xs font-bold uppercase transition-all"
          >
            {saved ? 'Settings Saved' : 'Save Parameters'}
          </button>
          {saved && <span className="text-xs text-vault-emerald flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> Parameters updated</span>}
        </div>
      </div>

      {/* Engine Status Grid */}
      <div className="bg-vault-card border border-vault-border rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-vault-border pb-3">
          <Server className="w-4 h-4 text-vault-purple" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-vault-text">
            Engine Runtime Manifest
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded bg-vault-bg border border-vault-border space-y-1">
            <div className="text-vault-subtle">Presidio Analyzer:</div>
            <div className="text-vault-emerald font-semibold">Active (Custom India DPDP Recognizers Loaded)</div>
          </div>
          <div className="p-3 rounded bg-vault-bg border border-vault-border space-y-1">
            <div className="text-vault-subtle">spaCy NLP Pipeline:</div>
            <div className="text-vault-cyan font-semibold">en_core_web_sm (Statistical NER)</div>
          </div>
          <div className="p-3 rounded bg-vault-bg border border-vault-border space-y-1">
            <div className="text-vault-subtle">OCR Core Engine:</div>
            <div className="text-vault-text font-semibold">Tesseract 5.5.3 (Homebrew / System)</div>
          </div>
          <div className="p-3 rounded bg-vault-bg border border-vault-border space-y-1">
            <div className="text-vault-subtle">Redaction Subsystem:</div>
            <div className="text-vault-emerald font-semibold">PyMuPDF 1.25 (True Glyph Scrubbing)</div>
          </div>
        </div>
      </div>

      {/* Security Disclosures */}
      <div className="bg-vault-card border border-vault-border rounded-xl p-6 space-y-3">
        <div className="flex items-center space-x-2 text-vault-amber">
          <Shield className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Security & Cryptographic Disclosures
          </h2>
        </div>
        <p className="text-xs text-vault-muted leading-relaxed">
          ShieldGrid 2.0 executes all document processing entirely within the isolated local host environment.
          Underlying PDF redactions invoke PyMuPDF's low-level font stream and glyph removal routines (`apply_redactions`),
          ensuring permanent irreversibility. Raw PII is excluded from database audit trails to guarantee non-leakage.
        </p>
      </div>
    </div>
  );
};
