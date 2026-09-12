import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskIndicatorProps {
  score: number;
  level: RiskLevel;
  factors?: Array<{ category: string; count?: number; points: number; description?: string }>;
  showFactors?: boolean;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  score,
  level,
  factors = [],
  showFactors = false,
}) => {
  const getLevelColor = (lvl: RiskLevel) => {
    switch (lvl) {
      case 'CRITICAL':
        return { text: 'text-vault-crimson', bg: 'bg-vault-crimsonBg', border: 'border-vault-crimson/40', bar: 'bg-vault-crimson' };
      case 'HIGH':
        return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/40', bar: 'bg-orange-500' };
      case 'MEDIUM':
        return { text: 'text-vault-amber', bg: 'bg-vault-amberBg', border: 'border-vault-amber/40', bar: 'bg-vault-amber' };
      case 'LOW':
      default:
        return { text: 'text-vault-emerald', bg: 'bg-vault-emeraldBg', border: 'border-vault-emerald/40', bar: 'bg-vault-emerald' };
    }
  };

  const style = getLevelColor(level);

  return (
    <div className="bg-vault-card border border-vault-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className={`w-4 h-4 ${style.text}`} />
          <span className="text-xs font-mono font-bold tracking-wider text-vault-text uppercase">ShieldGrid Risk Score</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${style.bg} ${style.text} ${style.border}`}>
          {level} RISK
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between font-mono">
          <div className="text-3xl font-extrabold tracking-tight text-vault-text">
            {score.toFixed(0)}
            <span className="text-sm font-normal text-vault-subtle"> / 100</span>
          </div>
          <span className="text-[11px] text-vault-muted">Heuristic Threat Index</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-vault-border rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 rounded-full ${style.bar}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>

      {showFactors && factors.length > 0 && (
        <div className="pt-2 border-t border-vault-border/50 space-y-2">
          <div className="text-[11px] font-mono text-vault-subtle uppercase tracking-wider flex items-center justify-between">
            <span>Score Factors</span>
            <span className="flex items-center text-[10px] text-vault-muted">
              <Info className="w-3 h-3 mr-1" /> Explainable Heuristic
            </span>
          </div>
          <div className="space-y-1.5">
            {factors.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-vault-muted">{f.category}</span>
                <span className="font-mono text-vault-text font-semibold">+{f.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-vault-subtle leading-tight italic">
        * ShieldGrid Risk Score is an application-defined privacy heuristic reflecting regulatory exposure under DPDP/GDPR.
      </p>
    </div>
  );
};
