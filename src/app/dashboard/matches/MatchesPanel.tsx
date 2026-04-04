'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MatchAnswers {
  netWorth: string;
  lifeTrigger: string;
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
}

interface MatchesPanelProps {
  answers: MatchAnswers | null;
  updatedAt: string | null;
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
    il: 'Illinois', ma: 'Massachusetts', other: 'Nationwide',
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

function vvsClass(v: number): string {
  return v >= 85 ? 'hi' : v >= 70 ? 'mid' : 'lo';
}

const CSS = `
  .mp-wrap {
    --navy:#0A1C2A; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568; --rule:#CAD8D0;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }
  .mp-title { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--ink); letter-spacing:-.02em; margin-bottom:4px; }
  .mp-sub { font-size:13px; color:var(--ink-3); margin-bottom:24px; }
  .mp-divider { height:1px; background:var(--rule); margin-bottom:24px; }

  /* ── Profile summary ── */
  .mp-profile { background:#fff; border:1px solid var(--rule); padding:24px; margin-bottom:24px; }
  .mp-profile-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .mp-profile-label {
    font-family:var(--mono); font-size:10px; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3);
  }
  .mp-profile-date { font-family:var(--mono); font-size:10px; color:var(--rule); }
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

  /* ── Results section ── */
  .mp-results-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .mp-results-label {
    font-family:var(--mono); font-size:10px; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3);
  }
  .mp-results-count { font-family:var(--mono); font-size:10px; color:var(--rule); }

  .mp-firm-list { border:1px solid var(--rule); background:var(--rule); display:flex; flex-direction:column; gap:1px; }
  .mp-firm-row {
    background:#fff; display:grid;
    grid-template-columns:1fr 80px 42px 80px;
    align-items:center; gap:12px; padding:13px 16px;
    transition:background .1s; cursor:pointer; text-decoration:none;
  }
  .mp-firm-row:hover { background:#f7faf8; }
  .mp-firm-name { font-size:13px; font-weight:600; color:var(--ink); margin-bottom:2px; }
  .mp-firm-meta { font-family:var(--mono); font-size:10px; color:var(--ink-3); }
  .mp-firm-aum { font-family:var(--mono); font-size:11px; color:var(--ink-3); text-align:right; }
  .mp-vvs-dot {
    width:28px; height:28px; border-radius:50%;
    display:grid; place-items:center;
    font-family:var(--serif); font-size:11px; font-weight:700; flex-shrink:0;
  }
  .mp-vvs-dot.hi { background:var(--green-pale); color:var(--green); }
  .mp-vvs-dot.mid { background:#FEF3C7; color:#B45309; }
  .mp-vvs-dot.lo  { background:#FEE2E2; color:#DC2626; }
  .mp-vvs-dot.na  { background:var(--white); color:var(--ink-3); font-size:10px; }
  .mp-match-pct {
    font-family:var(--serif); font-size:16px; font-weight:700;
    color:var(--green-3); text-align:right;
  }
  .mp-match-pct span { font-size:11px; color:var(--ink-3); }

  /* ── Loading ── */
  .mp-loading { padding:48px 24px; text-align:center; background:#fff; border:1px solid var(--rule); }
  .mp-spinner {
    width:20px; height:20px; border:2px solid var(--rule);
    border-top-color:var(--green-3); border-radius:50%;
    animation:mp-spin .8s linear infinite; margin:0 auto 12px;
  }
  @keyframes mp-spin { to { transform:rotate(360deg); } }
  .mp-loading-text { font-size:12px; color:var(--ink-3); }

  /* ── Empty state ── */
  .mp-empty { padding:48px 24px; text-align:center; background:#fff; border:1px solid var(--rule); }
  .mp-empty-title { font-family:var(--serif); font-size:18px; font-weight:700; color:var(--ink); margin-bottom:6px; }
  .mp-empty-sub { font-size:13px; color:var(--ink-3); margin-bottom:16px; }
  .mp-empty-link {
    display:inline-block; font-size:11px; font-weight:600;
    letter-spacing:.07em; text-transform:uppercase;
    background:var(--green); color:#fff; padding:8px 18px; text-decoration:none;
  }
  .mp-empty-link:hover { background:var(--green-2); }

  /* ── View all link ── */
  .mp-view-all {
    display:block; text-align:center; margin-top:12px;
    font-family:var(--sans); font-size:12px; color:var(--ink-3);
    text-decoration:none; padding:10px; border:1px solid var(--rule);
    background:#fff; transition:all .15s;
  }
  .mp-view-all:hover { border-color:var(--green); color:var(--green); }

  /* ── Mobile ── */
  @media(max-width:640px){
    .mp-profile-grid { grid-template-columns:1fr; }
    .mp-firm-row { grid-template-columns:1fr 42px 60px; }
    .mp-firm-aum { display:none; }
  }
`;

export default function MatchesPanel({ answers, updatedAt }: MatchesPanelProps) {
  const [firms, setFirms] = useState<MatchedFirm[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!answers) return;

    setLoading(true);
    const params = new URLSearchParams({
      netWorth: answers.netWorth,
      lifeTrigger: answers.lifeTrigger,
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
  }, [answers]);

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
    <div className="mp-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="mp-title">Matches</div>
      <div className="mp-sub">Firms tailored to your profile, ranked by fit alone.</div>
      <div className="mp-divider" />

      {!answers ? (
        <div className="mp-empty">
          <div className="mp-empty-title">No match profile yet</div>
          <div className="mp-empty-sub">
            Take the 2-minute questionnaire and we&apos;ll match you with the best-fit advisors.
          </div>
          <Link href="/match" className="mp-empty-link">Start Matching</Link>
        </div>
      ) : (
        <>
          {/* Profile summary */}
          <div className="mp-profile">
            <div className="mp-profile-header">
              <span className="mp-profile-label">Your Match Profile</span>
              {updatedLabel && <span className="mp-profile-date">Updated {updatedLabel}</span>}
            </div>

            <div className="mp-profile-grid">
              {PROFILE_FIELDS.map(f => {
                const val = answers[f.key as keyof MatchAnswers];
                const display = typeof val === 'string'
                  ? (val.startsWith('exact_')
                    ? `$${Number(val.replace('exact_', '')).toLocaleString('en-US')}`
                    : (LABEL_MAP[f.key]?.[val] || val))
                  : null;
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
          <div className="mp-results-header">
            <span className="mp-results-label">Top Matches</span>
            {!loading && firms.length > 0 && (
              <span className="mp-results-count">{firms.length} firms</span>
            )}
          </div>

          {loading ? (
            <div className="mp-loading">
              <div className="mp-spinner" />
              <div className="mp-loading-text">Finding your best matches…</div>
            </div>
          ) : firms.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-empty-title">No matches found</div>
              <div className="mp-empty-sub">Try updating your preferences for broader results.</div>
              <Link href="/match" className="mp-empty-link">Retake Questionnaire</Link>
            </div>
          ) : (
            <>
              <div className="mp-firm-list">
                {firms.slice(0, 10).map(firm => (
                  <Link
                    key={firm.crd}
                    href={`/firm/${firm.crd}`}
                    className="mp-firm-row"
                  >
                    <div>
                      <div className="mp-firm-name">
                        {firm.displayName || firm.name}
                      </div>
                      <div className="mp-firm-meta">
                        {firm.city}, {firm.state}
                        {firm.estimatedFee && firm.estimatedFee !== 'Contact firm' && (
                          <> · Est. {firm.estimatedFee}</>
                        )}
                      </div>
                    </div>
                    <div className="mp-firm-aum">{formatAUM(firm.aum)}</div>
                    {firm.visorScore != null ? (
                      <div className={`mp-vvs-dot ${vvsClass(firm.visorScore)}`}>{firm.visorScore}</div>
                    ) : (
                      <div className="mp-vvs-dot na">—</div>
                    )}
                    <div className="mp-match-pct">
                      {firm.matchPercent}% <span>match</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/match/results" className="mp-view-all">
                View Full Results →
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}
