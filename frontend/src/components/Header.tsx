import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, AlertCircle, CheckCircle, Database, Server } from 'lucide-react';
import { listDemos, loadDemoDocument } from '../services/api';
import { DemoItem } from '../types';

interface HeaderProps {
  onDemoLoaded?: (docId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onDemoLoaded }) => {
  const [demos, setDemos] = useState<DemoItem[]>([]);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);

  useEffect(() => {
    listDemos().then(setDemos).catch(() => {});
  }, []);

  const handleLoadDemo = async (demoId: string) => {
    try {
      setLoadingDemo(demoId);
      const doc = await loadDemoDocument(demoId);
      if (onDemoLoaded) {
        onDemoLoaded(doc.id);
      }
      setShowDemoDropdown(false);
    } catch (err: any) {
      alert(`Error loading demo: ${err.message}`);
    } finally {
      setLoadingDemo(null);
    }
  };

  return (
    <header className="h-16 border-b border-vault-border bg-vault-bg/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-vault-crimson/30 via-vault-card to-vault-border border border-vault-crimson/50 flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-vault-crimson/10 group-hover:bg-vault-crimson/20 transition-all"></div>
          {/* Custom Shield + Grid Symbol */}
          <div className="relative flex items-center justify-center">
            <Shield className="w-5 h-5 text-vault-crimson" />
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-40 pointer-events-none">
              <div className="border-r border-b border-vault-text/40"></div>
              <div className="border-b border-vault-text/40"></div>
              <div className="border-r border-vault-text/40"></div>
              <div></div>
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-lg tracking-wider text-vault-text">SHIELDGRID</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-vault-crimson/20 text-vault-crimson border border-vault-crimson/30 font-mono font-semibold">2.0</span>
          </div>
          <p className="text-[10px] text-vault-muted font-mono uppercase tracking-widest">Privacy Intelligence & Redaction Vault</p>
        </div>
      </div>

      {/* Forensic System Status Bar */}
      <div className="hidden md:flex items-center space-x-6 text-xs font-mono">
        <div className="flex items-center space-x-2 text-vault-muted bg-vault-card px-3 py-1.5 rounded-md border border-vault-border">
          <span className="w-2 h-2 rounded-full bg-vault-emerald animate-pulse"></span>
          <span>VAULT: <strong className="text-vault-text">ONLINE</strong></span>
        </div>
        <div className="flex items-center space-x-2 text-vault-muted bg-vault-card px-3 py-1.5 rounded-md border border-vault-border">
          <CheckCircle className="w-3.5 h-3.5 text-vault-cyan" />
          <span>PRESIDIO + SPACY: <strong className="text-vault-text">ACTIVE</strong></span>
        </div>
        <div className="flex items-center space-x-2 text-vault-muted bg-vault-card px-3 py-1.5 rounded-md border border-vault-border">
          <Server className="w-3.5 h-3.5 text-vault-purple" />
          <span>OCR ENGINE: <strong className="text-vault-text">TESSERACT 5</strong></span>
        </div>
      </div>

      {/* Demo Loader Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDemoDropdown(!showDemoDropdown)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-vault-card hover:bg-vault-cardHover border border-vault-border hover:border-vault-amber/40 text-vault-text text-xs font-mono transition-all shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-vault-amber" />
          <span>Load Synthetic Demo</span>
        </button>

        {showDemoDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-vault-card border border-vault-border rounded-lg shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-3 py-2 border-b border-vault-border/50 text-[11px] font-mono text-vault-muted uppercase tracking-wider">
              Synthetic Demo Records (Zero PII Risk)
            </div>
            <div className="py-1 space-y-1">
              {demos.map((d) => (
                <button
                  key={d.id}
                  disabled={loadingDemo !== null}
                  onClick={() => handleLoadDemo(d.id)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-vault-cardHover border border-transparent hover:border-vault-border transition-colors flex flex-col group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-vault-text group-hover:text-vault-amber transition-colors">
                      {d.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-vault-border text-vault-muted font-mono">
                      {d.format}
                    </span>
                  </div>
                  <span className="text-[11px] text-vault-subtle mt-0.5 line-clamp-1">{d.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
