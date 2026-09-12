import React, { useState } from 'react';
import {
  ShieldAlert,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Download,
  Lock,
  Layers,
  Info,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Finding, RedactionMode, FindingStatus } from '../types';
import { EntityBadge } from './EntityBadge';

interface FindingsPanelProps {
  findings: Finding[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  onUpdateFinding: (id: string, update: { status?: FindingStatus; redaction_mode?: RedactionMode }) => void;
  onRedactAll: (mode: RedactionMode) => void;
  isRedacting: boolean;
  onDownload: () => void;
  hasRedactedDoc: boolean;
}

export const FindingsPanel: React.FC<FindingsPanelProps> = ({
  findings,
  selectedFindingId,
  onSelectFinding,
  onUpdateFinding,
  onRedactAll,
  isRedacting,
  onDownload,
  hasRedactedDoc,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('ALL');
  const [globalMode, setGlobalMode] = useState<RedactionMode>('BLACK_BOX');

  // Categorize entity types
  const getCategory = (type: string) => {
    if (['IN_PAN', 'IN_AADHAAR', 'IN_VOTER_ID', 'US_SSN'].includes(type)) return 'GOVERNMENT';
    if (['CREDIT_CARD', 'IN_IFSC', 'IBAN_CODE', 'FINANCIAL_AMOUNT'].includes(type)) return 'FINANCIAL';
    if (['EMAIL_ADDRESS', 'IN_PHONE_NUMBER', 'PHONE_NUMBER', 'IP_ADDRESS', 'URL'].includes(type)) return 'CONTACT';
    return 'PERSONAL';
  };

  // Filtered findings
  const filteredFindings = findings.filter((f) => {
    if (categoryFilter !== 'ALL' && getCategory(f.entity_type) !== categoryFilter) {
      return false;
    }
    if (confidenceFilter === 'HIGH' && f.confidence < 0.9) return false;
    if (confidenceFilter === 'MED' && (f.confidence < 0.7 || f.confidence >= 0.9)) return false;
    if (confidenceFilter === 'LOW' && f.confidence >= 0.7) return false;
    return true;
  });

  return (
    <div className="w-96 border-l border-vault-border bg-vault-card flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-4 border-b border-vault-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-vault-crimson" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-vault-text">
              Privacy Findings ({findings.length})
            </h3>
          </div>
          {hasRedactedDoc && (
            <button
              onClick={onDownload}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-vault-emeraldBg text-vault-emerald border border-vault-emerald/40 text-xs font-mono font-medium hover:bg-vault-emerald/20 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto text-[11px] font-mono pb-1">
          {['ALL', 'GOVERNMENT', 'FINANCIAL', 'CONTACT', 'PERSONAL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-0.5 rounded border transition-all ${
                categoryFilter === cat
                  ? 'bg-vault-border text-vault-text border-vault-crimson/50 font-semibold'
                  : 'bg-vault-bg text-vault-subtle border-vault-border hover:text-vault-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Confidence Filter Pills */}
        <div className="flex items-center justify-between text-[11px] font-mono text-vault-subtle">
          <span>Confidence:</span>
          <div className="flex items-center space-x-1">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'HIGH', label: '90-100%' },
              { id: 'MED', label: '70-90%' },
              { id: 'LOW', label: '<70%' },
            ].map((cf) => (
              <button
                key={cf.id}
                onClick={() => setConfidenceFilter(cf.id)}
                className={`px-1.5 py-0.5 rounded ${
                  confidenceFilter === cf.id ? 'bg-vault-border text-vault-text font-bold' : 'text-vault-muted hover:text-vault-text'
                }`}
              >
                {cf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredFindings.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <Info className="w-8 h-8 text-vault-subtle mx-auto opacity-50" />
            <p className="text-xs text-vault-muted font-mono">No findings match the active filter criteria.</p>
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isSelected = selectedFindingId === finding.id;
            const isRejected = finding.status === 'REJECTED';
            const isRedacted = finding.status === 'REDACTED';

            return (
              <div
                key={finding.id}
                onClick={() => onSelectFinding(finding.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-vault-cardHover border-vault-crimson shadow-md shadow-vault-crimson/5'
                    : isRejected
                    ? 'bg-vault-bg/50 border-vault-border opacity-50'
                    : isRedacted
                    ? 'bg-vault-emeraldBg/30 border-vault-emerald/30'
                    : 'bg-vault-bg border-vault-border hover:border-vault-borderLight'
                }`}
              >
                {/* Top row: Badge + Confidence + Page */}
                <div className="flex items-center justify-between mb-1.5">
                  <EntityBadge type={finding.entity_type} />
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-vault-muted">
                    <span>Page {finding.page}</span>
                    <span className="font-semibold text-vault-text">
                      {Math.round(finding.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Sensitive Text Value */}
                <div className="font-mono text-xs text-vault-text font-medium truncate mb-2">
                  {isRedacted && finding.redacted_value ? (
                    <span className="text-vault-emerald flex items-center space-x-1">
                      <Lock className="w-3 h-3 inline" />
                      <span>{finding.redacted_value}</span>
                    </span>
                  ) : (
                    <span>{finding.text}</span>
                  )}
                </div>

                {/* Explainability Section: What, Where, Why, Source */}
                <div className="p-2 rounded bg-vault-card border border-vault-border/50 text-[11px] font-mono space-y-1 mb-2.5">
                  <div className="text-vault-subtle flex items-center justify-between">
                    <span>DETECTOR SOURCE:</span>
                    <strong className="text-vault-cyan uppercase">{finding.source}</strong>
                  </div>
                  {finding.explanation && (
                    <div className="text-[10px] text-vault-muted line-clamp-2 leading-tight">
                      {finding.explanation}
                    </div>
                  )}
                </div>

                {/* Individual Actions & Mode Selector */}
                <div className="flex items-center justify-between pt-1 border-t border-vault-border/40 text-xs">
                  {/* Mode Selector */}
                  <select
                    value={finding.redaction_mode || 'BLACK_BOX'}
                    onChange={(e) =>
                      onUpdateFinding(finding.id, { redaction_mode: e.target.value as RedactionMode })
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="bg-vault-bg border border-vault-border rounded px-2 py-0.5 text-[11px] font-mono text-vault-muted focus:text-vault-text focus:outline-none"
                  >
                    <option value="BLACK_BOX">Black Box (████)</option>
                    <option value="MASKING">Masking (j***@mail)</option>
                    <option value="ANONYMIZATION">Anonymize (PERS_01)</option>
                    <option value="HASHING">SHA256 Hash</option>
                    <option value="REPLACEMENT">[REDACTED]</option>
                  </select>

                  {/* Approve / Reject toggle */}
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() =>
                        onUpdateFinding(finding.id, {
                          status: finding.status === 'APPROVED' ? 'DETECTED' : 'APPROVED',
                        })
                      }
                      title={finding.status === 'APPROVED' ? 'Approved' : 'Mark Approved'}
                      className={`p-1 rounded hover:bg-vault-border transition-colors ${
                        finding.status === 'APPROVED' ? 'text-vault-emerald' : 'text-vault-subtle'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        onUpdateFinding(finding.id, {
                          status: finding.status === 'REJECTED' ? 'DETECTED' : 'REJECTED',
                        })
                      }
                      title={finding.status === 'REJECTED' ? 'Rejected' : 'Reject Finding'}
                      className={`p-1 rounded hover:bg-vault-border transition-colors ${
                        finding.status === 'REJECTED' ? 'text-vault-crimson' : 'text-vault-subtle'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Redaction Execution Dock */}
      <div className="p-4 border-t border-vault-border bg-vault-card/95 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono text-vault-muted">
          <span>Global Redaction Mode:</span>
          <select
            value={globalMode}
            onChange={(e) => setGlobalMode(e.target.value as RedactionMode)}
            className="bg-vault-bg border border-vault-border rounded px-2 py-1 text-xs font-mono text-vault-text focus:outline-none"
          >
            <option value="BLACK_BOX">Black Box (Solid)</option>
            <option value="MASKING">Character Masking</option>
            <option value="ANONYMIZATION">Pseudonymization</option>
            <option value="HASHING">Cryptographic Hashing</option>
            <option value="REPLACEMENT">Tag Replacement</option>
          </select>
        </div>

        <button
          disabled={isRedacting || findings.length === 0}
          onClick={() => onRedactAll(globalMode)}
          className="w-full py-2.5 rounded-lg bg-vault-crimson hover:bg-red-600 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-vault-crimson/20"
        >
          {isRedacting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Scrubbing PDF Glyphs...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Apply Irreversible Redaction</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
