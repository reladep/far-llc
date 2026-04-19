'use client';

import { useState } from 'react';
import { FirmScore } from '@/types';

interface ScoreBreakdownProps {
  scores: FirmScore | null;
}

interface ScoreComponent {
  key: keyof FirmScore;
  label: string;
  description: string;
  weight: number;
}

const SCORE_COMPONENTS: ScoreComponent[] = [
  { key: 'disclosure_score', label: 'Disclosure Quality', description: 'Clean regulatory record, few SEC violations', weight: 1.0 },
  { key: 'fee_transparency_score', label: 'Fee Transparency', description: 'Clear fee schedule disclosure in ADV', weight: 1.5 },
  { key: 'fee_competitiveness_score', label: 'Fee Competitiveness', description: 'Fees compared to industry average', weight: 1.2 },
  { key: 'conflict_free_score', label: 'Conflict-Free', description: 'No conflicts of interest, fiduciary standard', weight: 1.5 },
  { key: 'aum_growth_score', label: 'AUM Growth', description: 'Consistent year-over-year AUM growth', weight: 0.8 },
  { key: 'client_growth_score', label: 'Client Growth', description: 'New client acquisition and retention', weight: 0.8 },
  { key: 'advisor_bandwidth_score', label: 'Advisor Bandwidth', description: 'Number of clients per advisor', weight: 1.0 },
  { key: 'derivatives_score', label: 'Investment Mix', description: 'Low exposure to risky derivatives', weight: 0.7 },
  { key: 'upmarket_score', label: 'Upmarket Experience', description: 'Experience with high-net-worth clients', weight: 0.6 },
  { key: 'viability_score', label: 'Firm Viability', description: 'Financial stability and longevity', weight: 0.9 },
];

function ScoreBar({ label, value, description }: { label: string; value: number; description: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getBarColor = (val: number) => {
    if (val >= 70) return 'bg-green-500';
    if (val >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <button className="text-slate-400 hover:text-slate-600 text-xs" aria-label={`More info about ${label}`} type="button">ⓘ</button>
        </div>
        <span className="text-sm font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getBarColor(value)} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          <p className="text-slate-300">{description}</p>
        </div>
      )}
    </div>
  );
}

export default function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  if (!scores) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <p className="text-slate-500 text-sm">Score breakdown not available</p>
      </div>
    );
  }

  const compositeKey: (keyof FirmScore)[] = [
    'disclosure_score',
    'fee_transparency_score', 
    'fee_competitiveness_score',
    'conflict_free_score',
    'aum_growth_score',
    'client_growth_score',
    'advisor_bandwidth_score',
    'derivatives_score',
    'upmarket_score',
    'viability_score',
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Score Breakdown</h3>
      <div className="space-y-3">
        {SCORE_COMPONENTS.map((component) => (
          <ScoreBar
            key={component.key}
            label={component.label}
            value={scores[component.key] as number ?? 0}
            description={component.description}
          />
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <p>
          <span className="font-medium">Composite Score:</span> {scores.composite_score}/100 — 
          Weighted average based on factors important to individual investors.
        </p>
      </div>
    </div>
  );
}