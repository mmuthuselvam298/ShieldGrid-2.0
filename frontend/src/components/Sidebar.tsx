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
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage, activeDocId, isOpen = false }) => {
  const navItems = [
    { id: 'dashboard' as PageId, label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'scanner' as PageId, label: 'Scan document', icon: ScanLine, badge: null },
    { id: 'review' as PageId, label: 'Document review', icon: Eye, badge: activeDocId ? 'Active' : null },
    { id: 'batch' as PageId, label: 'Batch processing', icon: Layers, badge: null },
    { id: 'analytics' as PageId, label: 'Privacy analytics', icon: BarChart3, badge: null },
    { id: 'audit' as PageId, label: 'Audit trail', icon: ScrollText, badge: null },
    { id: 'policies' as PageId, label: 'Privacy policies', icon: ShieldCheck, badge: null },
    { id: 'settings' as PageId, label: 'Settings', icon: SettingsIcon, badge: null },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-vault-border bg-white flex flex-col justify-between select-none transition-transform duration-200 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 pt-6 space-y-1">
        <div className="px-3 pb-3 text-[11px] font-semibold text-vault-subtle uppercase tracking-wider">
          Workspace
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
                  ? 'bg-blue-50 text-vault-blue border border-blue-100'
                  : 'text-vault-muted hover:text-vault-text hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-vault-blue' : 'text-vault-subtle group-hover:text-vault-muted'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive
                      ? 'bg-blue-100 text-vault-blue border border-blue-200'
                      : 'bg-slate-100 text-vault-subtle border border-vault-border'
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
      <div className="m-4 p-3 rounded-xl border border-emerald-100 bg-emerald-50 text-xs text-vault-subtle space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Workspace protected</span>
        </div>
        <div className="text-[11px] leading-relaxed">
          Files are analyzed locally and audit events never store raw PII.
        </div>
      </div>
    </aside>
  );
};
