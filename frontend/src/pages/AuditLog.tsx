import React, { useEffect, useState } from 'react';
import { ScrollText, Filter, Download, AlertTriangle, ShieldCheck, Clock, Terminal } from 'lucide-react';
import { getAuditLogs } from '../services/api';
import { AuditLogEntry } from '../types';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');

  const fetchLogs = () => {
    setLoading(true);
    getAuditLogs(actionFilter || undefined, severityFilter || undefined, 100)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, severityFilter]);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `shieldgrid_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <p className="text-sm font-medium text-vault-blue mb-2">Governance</p>
          <h1 className="text-3xl font-bold tracking-tight text-vault-text">
            Audit trail
          </h1>
          <p className="text-sm text-vault-muted mt-2">
            A clear record of document uploads, analysis, redaction, and exports.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-vault-border text-vault-text text-sm transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-vault-cyan" />
          <span>Export Audit Trail (JSON)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="workspace-card p-4 flex flex-wrap items-center justify-between gap-4 text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-vault-muted" />
            <span className="text-vault-subtle">Filter Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-vault-bg border border-vault-border rounded px-2.5 py-1 text-vault-text focus:outline-none"
            >
              <option value="">All Actions</option>
              <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
              <option value="ANALYSIS_COMPLETED">ANALYSIS_COMPLETED</option>
              <option value="FINDING_REVIEWED">FINDING_REVIEWED</option>
              <option value="REDACTION_APPLIED">REDACTION_APPLIED</option>
              <option value="DOCUMENT_EXPORTED">DOCUMENT_EXPORTED</option>
              <option value="DOCUMENT_DELETED">DOCUMENT_DELETED</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-vault-subtle">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-vault-bg border border-vault-border rounded px-2.5 py-1 text-vault-text focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-vault-subtle">
          Showing {logs.length} logged events • Zero raw PII leaked
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="workspace-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-vault-muted">
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ScrollText className="w-8 h-8 text-vault-subtle mx-auto opacity-50" />
            <p className="text-xs font-mono text-vault-muted">No matching audit events found.</p>
          </div>
        ) : (
          <div className="divide-y divide-vault-border/50 font-mono text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-vault-cardHover transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.severity === 'CRITICAL'
                          ? 'bg-vault-crimsonBg text-vault-crimson border-vault-crimson/30'
                          : log.severity === 'WARNING'
                          ? 'bg-vault-amberBg text-vault-amber border-vault-amber/30'
                          : 'bg-vault-cyanBg text-vault-cyan border-vault-cyan/30'
                      }`}
                    >
                      {log.severity}
                    </span>
                    <span className="text-vault-text font-semibold">{log.action}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-[11px] text-vault-subtle">
                    <span>IP: {log.ip_address}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {log.document_name && (
                  <div className="text-vault-muted text-[11px]">
                    Document Target: <strong className="text-vault-text">{log.document_name}</strong>
                  </div>
                )}

                {log.details_json && (
                  <div className="bg-vault-bg border border-vault-border/60 rounded p-2 text-[10px] text-vault-muted overflow-x-auto">
                    <pre>{JSON.stringify(JSON.parse(log.details_json), null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
