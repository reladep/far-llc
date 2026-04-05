'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FirmRow, { FIRM_ROW_CSS } from '@/components/dashboard/FirmRow';
import type { FirmRowData } from '@/components/dashboard/FirmRow';
import '@/components/dashboard/dashboard.css';

interface MatchAnswers {
  netWorth: string;
  lifeTrigger: string | string[];
  lifeTriggerText?: string;
  location: string;
  priorities: string[];
  firmSize: string;
  serviceDepth: string;
  conflictImportance: string;
}

interface MatchedFirm {
  crd: number;
  name: string;
  displayName?: string;
  city: string;
  state: string;
  aum: number;
  matchPercent: number;
  visorScore?: number;
  estimatedFee: string;
  matchReason?: string;
  reasons?: string[];
}

interface MatchesPanelProps {
  answers: MatchAnswers | null;
  updatedAt: string | null;
  savedResults: MatchedFirm[] | null;
  resultsSavedAt: string | null;
}

const LABEL_MAP: Record<string, Record<string, string>> = {
  netWorth: {
    under_250k: 'Under $250K', '250k_1m': '$250K–$1M', '1m_5m': '$1M–$5M',
    '5m_10m': '$5M–$10M', '10m_25m': '$10M–$25M', '25m_plus': '$25M+',
  },
  lifeTrigger: {
    retirement: 'Retirement', inheritance: 'Inheritance', sale: 'Business sale',
    career: 'Career transition', planning: 'Estate planning', first_time: 'First-time',
    switching: 'Switching advisors',
  },
  location: {
    ny: 'New York', ca: 'California', fl: 'Florida', tx: 'Texas',
    il: 'Illinois', ma: 'Massachusetts', other: 'Nationwide', outside_us: 'Outside US',
  },
  firmSize: {
    any: 'No preference', small: 'Small (< $500M)', mid: 'Mid-size ($500M–$5B)', large: 'Large ($5B+)',
  },
  serviceDepth: {
    basic: 'Basic management', standard: 'Planning + management',
    comprehensive: 'Comprehensive wealth', concierge: 'Concierge / Family office',
  },
  conflictImportance: {
    critical: 'Critical — fee-only only', important: 'Important — prefer fiduciary',
    somewhat: 'Somewhat important', not_important: 'Not important',
  },
  priorities: {
    aum_growth: 'Proven AUM growth', client_retention: 'High client retention',
    advisor_experience: 'Experienced advisors', personal_service: 'Personal attention',
    comprehensive: 'Full-service', fiduciary: 'Fiduciary duty', fee_only: 'Fee-only',
  },
};

function formatAUM(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${Math.round(value / 1000).toLocaleString()}K`;
}

const CSS = `
  /* ── Profile summary ── */
  .mp-profile { background:#fff; border:1px solid var(--rule); padding:24px; margin-bottom:24px; }
  .mp-profile-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .mp-profile-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px 24px; }
  .mp-field-label {
    font-family:var(--mono); font-size:9px; font-weight:600;
    letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); margin-bottom:3px;
  }
  .mp-field-value { font-family:var(--sans); font-size:13px; color:var(--ink); font-weight:500; }
  .mp-chips { display:flex; flex-wrap:wrap; gap:4px; }
  .mp-chip {
    font-family:var(--mono); font-size:10px; font-weight:600;
    color:var(--green); background:var(--green-pale);
    border:1px solid rgba(26,122,74,.15); padding:2px 8px;
  }
  .mp-retake {
    display:inline-flex; align-items:center; gap:6px;
    font-family:var(--sans); font-size:11px; font-weight:600;
    letter-spacing:.04em;
    color:var(--ink-3); background:none; border:1px solid var(--rule);
    padding:7px 16px; cursor:pointer; text-decoration:none; transition:all .15s;
  }
  .mp-retake:hover { border-color:var(--green); color:var(--green); }

  /* ── Match-specific row layout ── */
  .mp-row { grid-template-columns:1fr 80px 42px 80px; cursor:pointer; }
  .mp-match-pct {
    font-family:var(--serif); font-size:16px; font-weight:700;
    color:var(--green-3); text-align:right;
  }
  .mp-match-pct span { font-size:11px; color:var(--ink-3); }

  /* ── Mobile ── */
  @media(max-width:640px){
    .mp-profile-grid { grid-template-columns:1fr; }
    .mp-row { grid-template-columns:1fr 42px 60px; }
    .mp-row .fr-aum { display:none; }
  }
`;

export default function MatchesPanel({ answers, updatedAt, savedResults, resultsSavedAt }: MatchesPanelProps) {
  const [firms, setFirms] = useState<MatchedFirm[]>(savedResults ?? []);
  const [loading, setLoading] = useState(false);
  const hasSavedResults = savedResults != null && savedResults.length > 0;

  useEffect(() => {
    if (hasSavedResults) return;
    if (!answers) return;

    setLoading(true);
    const params = new URLSearchParams({
      netWorth: answers.netWorth,
      lifeTrigger: Array.isArray(answers.lifeTrigger) ? answers.lifeTrigger.join(',') : answers.lifeTrigger,
      location: answers.location,
      priorities: answers.priorities.join(','),
      firmSize: answers.firmSize,
      serviceDepth: answers.serviceDepth,
      conflictImportance: answers.conflictImportance,
    });

    fetch(`/api/match?${params}`)
      .then(res => res.ok ? res.json() : { firms: [] })
      .then(data => setFirms(data.firms || []))
      .catch(() => setFirms([]))
      .finally(() => setLoading(false));
  }, [answers, hasSavedResults]);

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const savedLabel = resultsSavedAt
    ? new Date(resultsSavedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const PROFILE_FIELDS = [
    { label: 'Investable Assets', key: 'netWorth' },
    { label: 'Situation', key: 'lifeTrigger' },
    { label: 'Location', key: 'location' },
    { label: 'Firm Size', key: 'firmSize' },
    { label: 'Service Level', key: 'serviceDepth' },
    { label: 'Conflict Importance', key: 'conflictImportance' },
  ];

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: FIRM_ROW_CSS + CSS }} />

      <div className="db-panel-title">Matches</div>
      <div className="db-panel-sub">Firms tailored to your profile, ranked by fit alone.</div>
      <div className="db-panel-divider" />

      {!answers ? (
        <div className="db-empty">
          <div className="db-empty-title">No match profile yet</div>
          <div className="db-empty-sub">
            Take the 2-minute questionnaire and we&apos;ll match you with the best-fit advisors.
          </div>
          <Link href="/match" className="db-empty-link">Start Matching</Link>
        </div>
      ) : (
        <>
          {/* Profile summary */}
          <div className="mp-profile">
            <div className="mp-profile-header">
              <span className="db-section-label">Your Match Profile</span>
              {updatedLabel && <span className="db-section-count">Updated {updatedLabel}</span>}
            </div>

            <div className="mp-profile-grid">
              {PROFILE_FIELDS.map(f => {
                const val = answers[f.key as keyof MatchAnswers];
                let display: string | null = null;

                if (f.key === 'lifeTrigger') {
                  const triggers = Array.isArray(val) ? val : (typeof val === 'string' && val ? [val] : []);
                  const labels = triggers.map(t => LABEL_MAP.lifeTrigger?.[t] || t).filter(Boolean);
                  if (answers.lifeTriggerText) labels.push(answers.lifeTriggerText);
                  display = labels.length > 0 ? labels.join(', ') : null;
                } else if (f.key === 'location') {
                  display = typeof val === 'string'
                    ? (LABEL_MAP.location?.[val] || val || null)
                    : null;
                } else if (typeof val === 'string') {
                  display = val.startsWith('exact_')
                    ? `$${Number(val.replace('exact_', '')).toLocaleString('en-US')}`
                    : (LABEL_MAP[f.key]?.[val] || val);
                }

                return (
                  <div key={f.key}>
                    <div className="mp-field-label">{f.label}</div>
                    <div className="mp-field-value">{display || '—'}</div>
                  </div>
                );
              })}
              <div>
                <div className="mp-field-label">Priorities</div>
                <div className="mp-chips">
                  {answers.priorities.map(p => (
                    <span key={p} className="mp-chip">{LABEL_MAP.priorities?.[p] || p}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Link href="/match" className="mp-retake">↻ Retake Questionnaire</Link>
            </div>
          </div>

          {/* Results */}
          <div className="db-toolbar">
            <span className="db-section-label">
              {hasSavedResults ? 'Saved Results' : 'Top Matches'}
            </span>
            {!loading && firms.length > 0 && (
              <span className="db-section-count">
                {firms.length} firms{savedLabel ? ` · Saved ${savedLabel}` : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="db-loading">
              <div className="db-spinner" />
              <div className="db-loading-text">Finding your best matches…</div>
            </div>
          ) : firms.length === 0 ? (
            <div className="db-empty">
              <div className="db-empty-title">No matches found</div>
              <div className="db-empty-sub">Try updating your preferences for broader results.</div>
              <Link href="/match" className="db-empty-link">Retake Questionnaire</Link>
            </div>
          ) : (
            <>
              <div className="fr-list">
                {firms.slice(0, 10).map(firm => {
                  const rowData: FirmRowData = {
                    crd: firm.crd,
                    name: firm.name,
                    displayName: firm.displayName,
                    city: firm.city,
                    state: firm.state,
                    aum: formatAUM(firm.aum),
                    visorScore: firm.visorScore ?? null,
                  };
                  return (
                    <FirmRow
                      key={firm.crd}
                      firm={rowData}
                      className="mp-row"
                      trailing={
                        <div className="mp-match-pct">
                          {firm.matchPercent}% <span>match</span>
                        </div>
                      }
                    />
                  );
                })}
              </div>
              <Link href="/match/results" className="db-view-all">
                View Full Results →
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}
