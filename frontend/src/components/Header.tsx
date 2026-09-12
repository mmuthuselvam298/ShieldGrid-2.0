import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, CheckCircle, Search, Bell, Menu, ChevronDown } from 'lucide-react';
import { listDemos, loadDemoDocument } from '../services/api';
import { DemoItem } from '../types';

interface HeaderProps {
  onDemoLoaded?: (docId: string) => void;
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onDemoLoaded, onMenuToggle }) => {
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
    <header className="h-[72px] border-b border-vault-border bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} aria-label="Open navigation" className="lg:hidden p-2 -ml-2 rounded-lg text-vault-muted hover:bg-slate-100">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-vault-blue" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-[0.08em] text-vault-text">SHIELDGRID</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-vault-blue border border-blue-100 font-semibold">2.0</span>
          </div>
          <p className="text-[11px] text-vault-muted">Privacy intelligence & redaction</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <label className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-subtle" />
          <input aria-label="Search documents" placeholder="Search documents..." className="w-full h-10 rounded-lg border border-vault-border bg-slate-50 pl-9 pr-3 text-sm text-vault-text placeholder:text-vault-subtle focus:border-blue-300 focus:bg-white focus:outline-none" />
        </label>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-emerald-700 bg-emerald-50 border border-emerald-100">
          <CheckCircle className="w-4 h-4" />
          <span>Workspace secure</span>
        </div>
        <button aria-label="Notifications" className="p-2 rounded-lg text-vault-muted hover:bg-slate-100 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full" />
        </button>
        <button aria-label="Profile menu" className="flex items-center gap-2 pl-2 border-l border-vault-border text-sm font-medium text-vault-text">
          <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">MS</span>
          <ChevronDown className="w-4 h-4 text-vault-subtle" />
        </button>
      </div>

      {/* Demo Loader Dropdown */}
      <div className="relative hidden sm:block">
        <button
          onClick={() => setShowDemoDropdown(!showDemoDropdown)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-vault-border text-vault-text text-xs font-medium transition-all"
        >
          <Sparkles className="w-4 h-4 text-vault-amber" />
          <span>Load Synthetic Demo</span>
        </button>

        {showDemoDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-vault-border rounded-xl shadow-xl p-2 z-50">
            <div className="px-3 py-2 border-b border-vault-border/50 text-[11px] font-semibold text-vault-muted">
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
