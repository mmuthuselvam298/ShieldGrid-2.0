import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Eye,
  Layers,
  BarChart3,
  ScrollText,
  ShieldCheck,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'scanner'
  | 'review'
  | 'batch'
  | 'analytics'
  | 'audit'
  | 'policies'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  activeDocId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage, activeDocId }) => {
  const navItems = [
    { id: 'dashboard' as PageId, label: 'Overview Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'scanner' as PageId, label: 'Document Scanner', icon: ScanLine, badge: 'Upload' },
    { id: 'review' as PageId, label: 'Forensic Review', icon: Eye, badge: activeDocId ? 'Active' : null },
    { id: 'batch' as PageId, label: 'Batch Processing', icon: Layers, badge: null },
    { id: 'analytics' as PageId, label: 'Privacy Analytics', icon: BarChart3, badge: null },
    { id: 'audit' as PageId, label: 'Vault Audit Trail', icon: ScrollText, badge: null },
    { id: 'policies' as PageId, label: 'Privacy Policies', icon: ShieldCheck, badge: 'DPDP' },
    { id: 'settings' as PageId, label: 'Vault Settings', icon: SettingsIcon, badge: null },
  ];

  return (
    <aside className="w-64 border-r border-vault-border bg-vault-bg flex flex-col justify-between select-none">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-mono text-vault-subtle uppercase tracking-wider">
          Forensic Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-vault-card text-vault-text border border-vault-crimson/40 shadow-sm shadow-vault-crimson/5'
                  : 'text-vault-muted hover:text-vault-text hover:bg-vault-card/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-vault-crimson' : 'text-vault-subtle group-hover:text-vault-muted'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive
                      ? 'bg-vault-crimson/20 text-vault-crimson border border-vault-crimson/30'
                      : 'bg-vault-card text-vault-subtle border border-vault-border'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Vault Info */}
      <div className="p-4 border-t border-vault-border text-xs font-mono text-vault-subtle space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span>STORAGE ENGINE</span>
          <span className="text-vault-muted">SQLITE + SHA256</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span>REDACTION TECH</span>
          <span className="text-vault-emerald">PyMuPDF SCRUB</span>
        </div>
        <div className="pt-2 text-[10px] text-vault-subtle/70 leading-relaxed">
          ShieldGrid 2.0 • DPDP & GDPR Architecture
        </div>
      </div>
    </aside>
  );
};
