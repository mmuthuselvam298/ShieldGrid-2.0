import React, { useEffect, useState } from 'react';
import { FileText, ShieldAlert, Lock, ScanLine, Layers, BarChart3, ArrowUpRight, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { getAnalytics, getAuditLogs, listDocuments } from '../services/api';
import { AnalyticsData, AuditLogEntry, DocumentItem } from '../types';
import { PageId } from '../components/Sidebar';

interface DashboardProps {
  onNavigate: (page: PageId, docId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      getAnalytics().catch(() => null),
      listDocuments().catch(() => []),
      getAuditLogs(undefined, undefined, 6).catch(() => []),
    ]).then(([analyticsData, docs, logs]) => {
      if (analyticsData) setAnalytics(analyticsData);
      setRecentDocs(docs.slice(0, 5));
      setRecentLogs(logs);
      setLoading(false);
    });
  }, []);

  const stats = [
    {
      label: 'Documents processed',
      value: analytics?.documents_processed ?? 0,
      icon: FileText,
      color: 'text-vault-text',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Sensitive findings',
      value: analytics?.total_entities_detected ?? 0,
      icon: ShieldAlert,
      color: 'text-vault-crimson',
      bg: 'bg-vault-crimsonBg',
      border: 'border-vault-crimson/30',
    },
    {
      label: 'High-risk exposures',
      value: analytics?.high_risk_documents ?? 0,
      icon: AlertTriangle,
      color: 'text-vault-amber',
      bg: 'bg-vault-amberBg',
      border: 'border-vault-amber/30',
    },
    {
      label: 'Redactions applied',
      value: analytics?.total_redactions_applied ?? 0,
      icon: Lock,
      color: 'text-vault-emerald',
      bg: 'bg-vault-emeraldBg',
      border: 'border-vault-emerald/30',
    },
  ];

  return (
    <div className="p-5 sm:p-8 space-y-8 max-w-[1440px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-1">
        <div>
          <p className="text-sm font-medium text-vault-blue mb-2">Privacy workspace</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-vault-text">Good morning</h1>
          <p className="text-sm text-vault-muted mt-2">Your privacy workspace at a glance.</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('scanner')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-vault-blue hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Document</span>
          </button>
          <button
            onClick={() => onNavigate('batch')}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-vault-border text-vault-text text-sm transition-all"
          >
            <Layers className="w-4 h-4 text-vault-cyan" />
            <span>Batch Scan</span>
          </button>
          <button
            onClick={() => onNavigate('analytics')}
            className="hidden sm:flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-vault-border text-vault-text text-sm transition-all"
          >
            <BarChart3 className="w-4 h-4 text-vault-amber" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="workspace-card p-5 space-y-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-vault-muted">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-lg border ${stat.bg} ${stat.border}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-vault-text tracking-tight">
                {stat.value}
              </div>
              <p className="text-xs text-vault-muted">{idx === 0 ? 'Across your workspace' : idx === 1 ? 'Across all documents' : idx === 2 ? 'Needs attention' : 'Sensitive data protected'}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Documents & Live Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Ingested Documents (2 cols) */}
        <div className="lg:col-span-2 workspace-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-vault-border pb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-vault-cyan" />
              <h2 className="text-base font-semibold text-vault-text">
                Recent documents
              </h2>
            </div>
            <button
              onClick={() => onNavigate('scanner')}
              className="text-xs font-mono text-vault-muted hover:text-vault-text flex items-center space-x-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="w-8 h-8 text-vault-subtle mx-auto opacity-50" />
              <p className="text-sm text-vault-muted">No documents yet</p>
              <button
                onClick={() => onNavigate('scanner')}
                className="px-3 py-2 rounded-lg bg-vault-blue hover:bg-blue-700 text-white text-sm font-medium"
              >
                Upload Document Now
              </button>
            </div>
          ) : (
            <div className="divide-y divide-vault-border/50">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onNavigate('review', doc.id)}
                  className="py-3 px-2 flex items-center justify-between rounded hover:bg-vault-cardHover transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-8 h-8 rounded bg-vault-bg border border-vault-border flex items-center justify-center font-mono text-[10px] text-vault-muted group-hover:border-vault-crimson/50 transition-colors">
                      {doc.mime_type.split('/')[1]?.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-medium text-vault-text truncate group-hover:text-vault-crimson transition-colors">
                        {doc.original_name}
                      </div>
                      <div className="text-[10px] font-mono text-vault-subtle">
                        {(doc.file_size / 1024).toFixed(1)} KB • {doc.page_count} page(s) •{' '}
                        {new Date(doc.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
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

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        doc.status === 'REDACTED'
                          ? 'bg-vault-emeraldBg text-vault-emerald border-vault-emerald/30'
                          : 'bg-vault-bg text-vault-muted border-vault-border'
                      }`}
                    >
                      {doc.status}
                    </span>

                    <ArrowUpRight className="w-4 h-4 text-vault-subtle group-hover:text-vault-text transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Audit Activity Stream (1 col) */}
        <div className="workspace-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-vault-border pb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-vault-amber" />
              <h2 className="text-base font-semibold text-vault-text">
                Recent activity
              </h2>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-mono text-vault-muted hover:text-vault-text flex items-center space-x-1"
            >
              <span>Log</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Clock className="w-8 h-8 text-vault-subtle mx-auto opacity-50" />
              <p className="text-xs font-mono text-vault-muted">No audit activity recorded.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="text-xs font-mono p-2.5 rounded bg-vault-bg border border-vault-border/50 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-vault-subtle">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        log.severity === 'CRITICAL'
                          ? 'text-vault-crimson bg-vault-crimsonBg'
                          : log.severity === 'WARNING'
                          ? 'text-vault-amber bg-vault-amberBg'
                          : 'text-vault-cyan bg-vault-cyanBg'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </div>
                  <div className="text-vault-text font-medium truncate">{log.action}</div>
                  {log.document_name && (
                    <div className="text-[10px] text-vault-muted truncate">
                      Doc: {log.document_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
