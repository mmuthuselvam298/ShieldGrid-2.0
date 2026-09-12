import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieIcon, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';
import { getAnalytics } from '../services/api';
import { AnalyticsData } from '../types';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-vault-muted">
        Loading real-time privacy telemetry...
      </div>
    );
  }

  if (!data || data.documents_processed === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-3 font-mono">
        <BarChart3 className="w-12 h-12 text-vault-subtle mx-auto opacity-50" />
        <h2 className="text-sm font-bold uppercase text-vault-text">Telemetry Database Empty</h2>
        <p className="text-xs text-vault-muted">
          No documents have been ingested yet. Ingest documents via the Scanner to populate live forensic telemetry.
        </p>
      </div>
    );
  }

  // Format entity distribution for bar chart
  const entityChartData = Object.entries(data.entity_distribution).map(([type, count]) => ({
    name: type.replace('IN_', '').replace(/_/g, ' '),
    count,
  }));

  // Format risk distribution for pie chart
  const riskChartData = Object.entries(data.risk_distribution).map(([level, count]) => ({
    name: `${level} RISK`,
    value: count,
  }));

  // Format source distribution
  const sourceChartData = Object.entries(data.source_distribution).map(([source, count]) => ({
    name: source.toUpperCase(),
    count,
  }));

  const RISK_COLORS: Record<string, string> = {
    'CRITICAL RISK': '#ef4444',
    'HIGH RISK': '#f97316',
    'MEDIUM RISK': '#f59e0b',
    'LOW RISK': '#10b981',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 select-none">
      <div>
        <h1 className="text-xl font-mono font-bold uppercase tracking-wider text-vault-text">
          Privacy Intelligence & Telemetry Analytics
        </h1>
        <p className="text-xs font-mono text-vault-muted mt-1">
          Forensic distribution metrics, detector precision, and vulnerability posture across all processed assets.
        </p>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-vault-card border border-vault-border rounded-xl p-4">
          <span className="text-[11px] font-mono text-vault-muted">AVG DETECTION CONFIDENCE</span>
          <div className="text-2xl font-mono font-bold text-vault-text mt-1">
            {Math.round(data.average_confidence * 100)}%
          </div>
          <span className="text-[10px] text-vault-emerald font-mono">Calibrated Multi-Engine</span>
        </div>

        <div className="bg-vault-card border border-vault-border rounded-xl p-4">
          <span className="text-[11px] font-mono text-vault-muted">TOTAL PII DISCOVERED</span>
          <div className="text-2xl font-mono font-bold text-vault-crimson mt-1">
            {data.total_entities_detected}
          </div>
          <span className="text-[10px] text-vault-muted font-mono">Across all ingested pages</span>
        </div>

        <div className="bg-vault-card border border-vault-border rounded-xl p-4">
          <span className="text-[11px] font-mono text-vault-muted">OCR INVOCATIONS</span>
          <div className="text-2xl font-mono font-bold text-vault-purple mt-1">
            {data.ocr_usage_count}
          </div>
          <span className="text-[10px] text-vault-muted font-mono">Scanned & image documents</span>
        </div>

        <div className="bg-vault-card border border-vault-border rounded-xl p-4">
          <span className="text-[11px] font-mono text-vault-muted">PERMANENT REDACTIONS</span>
          <div className="text-2xl font-mono font-bold text-vault-emerald mt-1">
            {data.total_redactions_applied}
          </div>
          <span className="text-[10px] text-vault-emerald font-mono">Irreversibly sanitized</span>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entity Distribution Bar Chart */}
        <div className="bg-vault-card border border-vault-border rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-vault-border pb-2">
            <BarChart3 className="w-4 h-4 text-vault-cyan" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-vault-text">
              PII Entity Type Frequency
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f131d', borderColor: '#1e2638', color: '#f1f5f9' }}
                  itemStyle={{ color: '#06b6d4', fontFamily: 'monospace', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="bg-vault-card border border-vault-border rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-vault-border pb-2">
            <PieIcon className="w-4 h-4 text-vault-amber" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-vault-text">
              ShieldGrid Risk Profile Distribution
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f131d', borderColor: '#1e2638', color: '#f1f5f9' }}
                  itemStyle={{ fontFamily: 'monospace', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detection Engine Comparison */}
      <div className="bg-vault-card border border-vault-border rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-vault-border pb-2">
          <Cpu className="w-4 h-4 text-vault-purple" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-vault-text">
            Detection Engine Contribution
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sourceChartData.map((src, idx) => (
            <div key={idx} className="bg-vault-bg border border-vault-border p-4 rounded-lg font-mono">
              <span className="text-[11px] text-vault-muted uppercase">{src.name}</span>
              <div className="text-xl font-bold text-vault-text mt-1">{src.count} detections</div>
              <span className="text-[10px] text-vault-subtle">Integrated in merger pipeline</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
