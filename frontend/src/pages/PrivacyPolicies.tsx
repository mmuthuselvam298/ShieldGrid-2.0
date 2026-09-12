import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sliders, CheckCircle, AlertCircle, Plus, Save } from 'lucide-react';
import { getPolicies } from '../services/api';
import { PolicyItem } from '../types';

export const PrivacyPolicies: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [activePolicyId, setActivePolicyId] = useState<string>('policy_india_privacy');

  // Custom policy editor state
  const [customName, setCustomName] = useState('Custom Enterprise DPDP Policy');
  const [customDesc, setCustomDesc] = useState('Tailored enterprise rule matching organizational privacy requirements.');
  const [minConfidence, setMinConfidence] = useState<number>(0.4);
  const [autoRedact, setAutoRedact] = useState<boolean>(false);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([
    'IN_PAN',
    'IN_AADHAAR',
    'IN_PHONE_NUMBER',
    'EMAIL_ADDRESS',
    'CREDIT_CARD',
    'PERSON',
  ]);

  const allAvailableEntities = [
    { id: 'IN_PAN', label: 'Indian PAN Card', category: 'Statutory (India)' },
    { id: 'IN_AADHAAR', label: 'Indian Aadhaar Number', category: 'Statutory (India)' },
    { id: 'IN_PHONE_NUMBER', label: 'Indian Mobile (+91)', category: 'Statutory (India)' },
    { id: 'IN_IFSC', label: 'Bank IFSC Code', category: 'Financial' },
    { id: 'IN_VOTER_ID', label: 'Voter ID (EPIC)', category: 'Statutory (India)' },
    { id: 'CREDIT_CARD', label: 'Payment Card (PCI-DSS)', category: 'Financial' },
    { id: 'IBAN_CODE', label: 'International Bank Account (IBAN)', category: 'Financial' },
    { id: 'US_SSN', label: 'US Social Security Number', category: 'Government' },
    { id: 'EMAIL_ADDRESS', label: 'Email Address', category: 'Contact' },
    { id: 'PHONE_NUMBER', label: 'General Phone Number', category: 'Contact' },
    { id: 'IP_ADDRESS', label: 'Network IP Address', category: 'Network' },
    { id: 'URL', label: 'Web URL / Domain', category: 'Network' },
    { id: 'PERSON', label: 'Individual Name (NLP)', category: 'Personal' },
    { id: 'LOCATION', label: 'Physical Location / Address', category: 'Personal' },
  ];

  useEffect(() => {
    getPolicies().then(setPolicies).catch(() => {});
  }, []);

  const toggleEntity = (id: string) => {
    if (selectedEntities.includes(id)) {
      setSelectedEntities(selectedEntities.filter((e) => e !== id));
    } else {
      setSelectedEntities([...selectedEntities, id]);
    }
  };

  const handleSaveCustom = () => {
    alert('Custom policy configuration successfully saved to active session.');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 select-none">
      <div>
        <h1 className="text-xl font-mono font-bold uppercase tracking-wider text-vault-text">
          Privacy Policy Governance & Rulesets
        </h1>
        <p className="text-xs font-mono text-vault-muted mt-1">
          Configure statutory compliance profiles (India DPDP Act, GDPR, HIPAA, PCI-DSS) and detection sensitivities.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-vault-subtle">
          Standard Policy Presets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {policies.map((p) => {
            const config = JSON.parse(p.config_json);
            const isSelected = activePolicyId === p.id;

            return (
              <div
                key={p.id}
                onClick={() => setActivePolicyId(p.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-vault-card border-vault-crimson shadow-md shadow-vault-crimson/5'
                    : 'bg-vault-card/60 border-vault-border hover:border-vault-borderLight'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-vault-text truncate">{p.name}</span>
                    {p.is_default && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-vault-border text-vault-muted">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-vault-muted leading-relaxed line-clamp-3">
                    {p.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-vault-border/50 text-[10px] font-mono text-vault-subtle space-y-1">
                  <div>Min Confidence: {Math.round(config.min_confidence * 100)}%</div>
                  <div>Monitored Entities: {config.entities?.length || 0} types</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Policy Builder */}
      <div className="bg-vault-card border border-vault-border rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-vault-border pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-vault-amber" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-vault-text">
              Custom Policy Builder
            </h2>
          </div>
          <button
            onClick={handleSaveCustom}
            className="flex items-center space-x-2 px-3 py-1.5 rounded bg-vault-crimson hover:bg-red-600 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Custom Policy</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          <div className="space-y-2">
            <label className="text-vault-muted">Policy Name:</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-vault-bg border border-vault-border rounded p-2 text-vault-text focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-vault-muted">
              Minimum Confidence Threshold: <strong>{Math.round(minConfidence * 100)}%</strong>
            </label>
            <input
              type="range"
              min="0.2"
              max="0.9"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full accent-vault-crimson"
            />
          </div>
        </div>

        {/* Entity Toggles */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-vault-muted uppercase tracking-wider">
            Included Entity Recognizers ({selectedEntities.length} selected):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {allAvailableEntities.map((ent) => {
              const checked = selectedEntities.includes(ent.id);
              return (
                <button
                  key={ent.id}
                  onClick={() => toggleEntity(ent.id)}
                  className={`p-2.5 rounded border text-left font-mono text-xs transition-all flex items-center justify-between ${
                    checked
                      ? 'bg-vault-bg border-vault-crimson/50 text-vault-text'
                      : 'bg-vault-bg/40 border-vault-border text-vault-subtle hover:text-vault-muted'
                  }`}
                >
                  <div>
                    <div className="font-medium truncate">{ent.label}</div>
                    <span className="text-[10px] text-vault-subtle">{ent.category}</span>
                  </div>
                  {checked && <CheckCircle className="w-4 h-4 text-vault-crimson flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
