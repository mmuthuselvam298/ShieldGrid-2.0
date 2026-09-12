import React, { useEffect, useState } from 'react';
import {
  FileText,
  ShieldAlert,
  Lock,
  ScanLine,
  Layers,
  BarChart3,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
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
      label: 'DOCUMENTS INGESTED',
      value: analytics?.documents_processed ?? 0,
      icon: FileText,
      color: 'text-vault-text',
      bg: 'bg-vault-card',
      border: 'border-vault-border',
    },
    {
      label: 'SENSITIVE FINDINGS',
      value: analytics?.total_entities_detected ?? 0,
      icon: ShieldAlert,
      color: 'text-vault-crimson',
      bg: 'bg-vault-crimsonBg',
      border: 'border-vault-crimson/30',
    },
    {
      label: 'HIGH-RISK EXPOSURES',
      value: analytics?.high_risk_documents ?? 0,
      icon: AlertTriangle,
      color: 'text-vault-amber',
      bg: 'bg-vault-amberBg',
      border: 'border-vault-amber/30',
    },
    {
      label: 'SANITIZED & REDACTED',
      value: analytics?.total_redactions_applied ?? 0,
      icon: Lock,
      color: 'text-vault-emerald',
      bg: 'bg-vault-emeraldBg',
      border: 'border-vault-emerald/30',
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto select-none">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-vault-border pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-mono font-bold tracking-tight text-vault-text">
              SECURITY OPERATIONS CENTER
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-vault-emeraldBg text-vault-emerald border border-vault-emerald/30">
              ACTIVE ENFORCEMENT
            </span>
          </div>
          <p className="text-xs text-vault-muted font-mono">
            Autonomous Document Privacy Intelligence, Multi-Engine Entity Recognition & Redaction Vault
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('scanner')}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-vault-crimson hover:bg-red-600 text-white font-mono text-xs font-semibold tracking-wider uppercase transition-all shadow-lg shadow-vault-crimson/20"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Document</span>
          </button>
          <button
            onClick={() => onNavigate('batch')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-vault-card hover:bg-vault-cardHover border border-vault-border text-vault-text font-mono text-xs transition-all"
          >
            <Layers className="w-4 h-4 text-vault-cyan" />
            <span>Batch Scan</span>
          </button>
          <button
            onClick={() => onNavigate('analytics')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-vault-card hover:bg-vault-cardHover border border-vault-border text-vault-text font-mono text-xs transition-all"
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
              className="bg-vault-card border border-vault-border rounded-xl p-5 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-medium text-vault-muted tracking-wider">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-lg border ${stat.bg} ${stat.border}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className="font-mono text-3xl font-extrabold text-vault-text tracking-tight">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Documents & Live Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Ingested Documents (2 cols) */}
        <div className="lg:col-span-2 bg-vault-card border border-vault-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-vault-border pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-vault-cyan" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-vault-text">
                Recent Vault Documents
              </h2>
            </div>
            <button
              onClick={() => onNavigate('scanner')}
              className="text-xs font-mono text-vault-muted hover:text-vault-text flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="w-8 h-8 text-vault-subtle mx-auto opacity-50" />
              <p className="text-xs font-mono text-vault-muted">No documents analyzed yet.</p>
              <button
                onClick={() => onNavigate('scanner')}
                className="px-3 py-1.5 rounded bg-vault-border hover:bg-vault-borderLight text-vault-text text-xs font-mono"
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
        <div className="bg-vault-card border border-vault-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-vault-border pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-vault-amber" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-vault-text">
                Live Audit Trail
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
