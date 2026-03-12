'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface MatchAnswer {
  netWorth: string;
  lifeTrigger: string;
  location: string;
  priorities: string[];
  feeSensitivity: string;
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
  feeCompetitiveness: number;
  clientGrowth: number;
  advisorBandwidth: number;
  matchPercent: number;
  reasons: string[];
  estimatedFee: string;
  visorScore?: number;
}

const CSS = `
  :root {
    --navy:#0A1C2A; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568; --rule:#CAD8D0;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }

  .mr-page { min-height:100vh; background:var(--white); }

  /* Hero */
  .mr-hero { background:var(--navy); padding:52px 24px 44px; text-align:center; }
  .mr-eyebrow {
    font-family:var(--mono); font-size:9px; font-weight:600;
    letter-spacing:.18em; text-transform:uppercase;
    color:var(--green-3); margin-bottom:14px;
  }
  .mr-title {
    font-family:var(--serif); font-size:clamp(26px,4vw,40px);
    font-weight:700; color:#fff; margin-bottom:6px; line-height:1.1;
  }
  .mr-hero-sub {
    font-family:var(--sans); font-size:13px;
    color:rgba(246,248,247,.5); margin:0 0 16px;
  }
  .mr-chips { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
  .mr-chip {
    font-family:var(--mono); font-size:10px;
    color:rgba(246,248,247,.6);
    border:1px solid rgba(246,248,247,.15); padding:3px 10px;
  }

  /* Body */
  .mr-body { max-width:780px; margin:0 auto; padding:36px 20px 80px; }

  /* Firm card */
  .mr-card {
    background:#fff; border:1px solid var(--rule);
    margin-bottom:8px; display:grid;
    grid-template-columns:52px 1fr auto;
    transition:border-color .15s; text-decoration:none;
  }
  .mr-card:hover { border-color:var(--green-2); }

  .mr-rank {
    display:grid; place-items:center;
    border-right:1px solid var(--rule);
    font-family:var(--serif); font-size:20px; font-weight:700; color:var(--ink-3);
    padding:0 14px; flex-shrink:0;
  }
  .mr-rank.top { color:var(--green); }

  .mr-card-body { padding:18px 20px; }
  .mr-firm-name {
    font-family:var(--sans); font-size:14px; font-weight:600;
    color:var(--ink); margin-bottom:3px;
  }
  .mr-firm-meta {
    font-family:var(--mono); font-size:10px;
    color:var(--ink-3); margin-bottom:12px;
  }
  .mr-reasons { display:flex; flex-wrap:wrap; gap:6px; }
  .mr-reason {
    font-family:var(--mono); font-size:9px; font-weight:700;
    letter-spacing:.1em; text-transform:uppercase;
    color:var(--green); background:var(--green-pale);
    border:1px solid rgba(26,122,74,.2); padding:2px 8px;
  }

  .mr-match-col {
    padding:18px 20px; display:flex; flex-direction:column;
    align-items:flex-end; justify-content:center;
    border-left:1px solid var(--rule); min-width:110px;
  }
  .mr-match-pct {
    font-family:var(--serif); font-size:30px; font-weight:700;
    color:var(--green); line-height:1;
  }
  .mr-match-label {
    font-family:var(--mono); font-size:9px; color:var(--ink-3);
    letter-spacing:.1em; text-transform:uppercase; margin-top:3px;
  }
  .mr-vvs {
    font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-top:10px;
  }
  .mr-fee {
    font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-top:4px;
  }

  /* Auth gate */
  .mr-gate-wrap { position:relative; }
  .mr-blurred { filter:blur(5px); pointer-events:none; user-select:none; }
  .mr-gate {
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    background:linear-gradient(to bottom, rgba(246,248,247,0) 0%, rgba(246,248,247,.96) 18%);
    padding:20px;
  }
  .mr-gate-card {
    background:#fff; border:1px solid var(--rule);
    padding:36px 32px; text-align:center;
    max-width:400px; width:100%;
  }
  .mr-gate-eyebrow {
    font-family:var(--mono); font-size:9px; font-weight:700;
    letter-spacing:.18em; text-transform:uppercase;
    color:var(--green-3); margin-bottom:14px;
  }
  .mr-gate-title {
    font-family:var(--serif); font-size:24px; font-weight:700;
    color:var(--ink); margin-bottom:10px; line-height:1.15;
  }
  .mr-gate-sub {
    font-family:var(--sans); font-size:13px; color:var(--ink-3);
    line-height:1.6; margin-bottom:24px;
  }
  .mr-gate-btns { display:flex; gap:10px; }
  .mr-gate-btn-primary {
    flex:1; padding:11px; background:var(--green); color:#fff;
    font-family:var(--sans); font-size:13px; font-weight:600;
    text-decoration:none; text-align:center; display:block;
    transition:background .15s;
  }
  .mr-gate-btn-primary:hover { background:var(--green-2); }
  .mr-gate-btn-secondary {
    flex:1; padding:11px; background:none;
    border:1px solid var(--rule); color:var(--ink-2);
    font-family:var(--sans); font-size:13px;
    text-decoration:none; text-align:center; display:block;
    transition:all .15s;
  }
  .mr-gate-btn-secondary:hover { border-color:var(--ink-3); color:var(--ink); }

  /* Loading */
  .mr-loading { padding:80px 24px; text-align:center; }
  .mr-spinner {
    width:28px; height:28px; border:2px solid var(--rule);
    border-top-color:var(--green); border-radius:50%;
    animation:mr-spin .8s linear infinite; margin:0 auto;
  }
  @keyframes mr-spin { to { transform:rotate(360deg); } }
  .mr-loading-label {
    font-family:var(--sans); font-size:13px; color:var(--ink-3); margin-top:16px;
  }

  /* Empty state */
  .mr-empty { padding:60px 24px; text-align:center; }
  .mr-empty-title {
    font-family:var(--serif); font-size:22px; font-weight:700;
    color:var(--ink); margin-bottom:8px;
  }
  .mr-empty-sub { font-family:var(--sans); font-size:13px; color:var(--ink-3); margin-bottom:24px; }

  /* Actions */
  .mr-actions {
    display:flex; gap:12px; justify-content:center;
    flex-wrap:wrap; padding-top:24px;
  }
  .mr-act-btn {
    font-family:var(--sans); font-size:12px; padding:9px 20px;
    border:1px solid var(--rule); color:var(--ink-3); background:#fff;
    cursor:pointer; text-decoration:none; display:inline-block;
    transition:all .12s;
  }
  .mr-act-btn:hover { border-color:var(--ink-3); color:var(--ink); }

  @media(max-width:600px){
    .mr-card { grid-template-columns:40px 1fr; }
    .mr-match-col { display:none; }
    .mr-card-body { padding:14px 16px; }
    .mr-rank { padding:0 10px; }
  }
`;

const LABEL_MAP: Record<string, Record<string, string>> = {
  netWorth: {
    under_250k: 'Under $250K',
    '250k_1m': '$250K–$1M',
    '1m_5m': '$1M–$5M',
    '5m_10m': '$5M–$10M',
    '10m_25m': '$10M–$25M',
    '25m_plus': '$25M+',
  },
  lifeTrigger: {
    retirement: 'Retirement',
    inheritance: 'Inheritance',
    sale: 'Business sale',
    career: 'Career transition',
    planning: 'Estate planning',
    first_time: 'First-time',
    switching: 'Switching advisors',
  },
  location: {
    ny: 'New York',
    ca: 'California',
    fl: 'Florida',
    tx: 'Texas',
    il: 'Illinois',
    ma: 'Massachusetts',
    other: 'Nationwide',
  },
};

function formatAUM(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B AUM`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M AUM`;
  return `$${value.toLocaleString()} AUM`;
}

interface FirmCardProps {
  firm: MatchedFirm;
  rank: number;
}

function FirmCard({ firm, rank }: FirmCardProps) {
  return (
    <Link href={`/firm/${firm.crd}`} className="mr-card" style={{ display: 'grid' }}>
      <div className={`mr-rank${rank <= 3 ? ' top' : ''}`}>#{rank}</div>
      <div className="mr-card-body">
        <div className="mr-firm-name">{firm.displayName || firm.name}</div>
        <div className="mr-firm-meta">
          {firm.city}, {firm.state} &middot; {formatAUM(firm.aum)}
        </div>
        {firm.reasons.length > 0 && (
          <div className="mr-reasons">
            {firm.reasons.slice(0, 4).map((r, i) => (
              <span key={i} className="mr-reason">{r}</span>
            ))}
          </div>
        )}
      </div>
      <div className="mr-match-col">
        <div className="mr-match-pct">{firm.matchPercent}%</div>
        <div className="mr-match-label">match</div>
        {firm.visorScore != null && (
          <div className="mr-vvs">VVS {firm.visorScore}</div>
        )}
        {firm.estimatedFee && firm.estimatedFee !== 'Contact firm' && (
          <div className="mr-fee">{firm.estimatedFee}</div>
        )}
      </div>
    </Link>
  );
}

export default function MatchResultsPage() {
  const [answers, setAnswers] = useState<MatchAnswer | null>(null);
  const [firms, setFirms] = useState<MatchedFirm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('matchAnswers');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAnswers(parsed);
      fetchMatchedFirms(parsed);
    } else {
      window.location.href = '/match';
    }

    // Check auth without redirecting (preserves sessionStorage answers)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data: { user } }) => setIsAuthed(!!user));
  }, []);

  async function fetchMatchedFirms(answers: MatchAnswer) {
    try {
      const params = new URLSearchParams({
        netWorth: answers.netWorth,
        lifeTrigger: answers.lifeTrigger,
        location: answers.location,
        priorities: answers.priorities.join(','),
        feeSensitivity: answers.feeSensitivity,
        firmSize: answers.firmSize,
        serviceDepth: answers.serviceDepth,
        conflictImportance: answers.conflictImportance,
      });
      const res = await fetch(`/api/match?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFirms(data.firms || []);
      } else {
        setFirms(getSampleFirms());
      }
    } catch (e) {
      console.error('Failed to fetch matches:', e);
      setFirms(getSampleFirms());
    } finally {
      setLoading(false);
    }
  }

  function getSampleFirms(): MatchedFirm[] {
    return [
      {
        crd: 123456,
        name: 'Sample Wealth Management',
        city: 'New York',
        state: 'NY',
        aum: 2500000000,
        feeCompetitiveness: 92,
        clientGrowth: 88,
        advisorBandwidth: 95,
        matchPercent: 94,
        reasons: ['Low Fees', 'Client Retention', 'Fiduciary'],
        estimatedFee: '0.75–1.00%',
        visorScore: 87,
      },
      {
        crd: 234567,
        name: 'Example Advisory Group',
        city: 'Boston',
        state: 'MA',
        aum: 1800000000,
        feeCompetitiveness: 85,
        clientGrowth: 92,
        advisorBandwidth: 88,
        matchPercent: 89,
        reasons: ['Fee-Only', 'Comprehensive', 'Experienced'],
        estimatedFee: '0.85–1.10%',
        visorScore: 82,
      },
    ];
  }

  // Build hero chips from answers
  const chips: string[] = [];
  if (answers) {
    const nw = LABEL_MAP.netWorth[answers.netWorth];
    const lt = LABEL_MAP.lifeTrigger[answers.lifeTrigger];
    const loc = LABEL_MAP.location[answers.location];
    if (nw) chips.push(nw);
    if (lt) chips.push(lt);
    if (loc) chips.push(loc);
  }

  if (loading) {
    return (
      <div className="mr-page">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="mr-loading">
          <div className="mr-spinner" />
          <p className="mr-loading-label">Finding your best matches…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mr-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Hero */}
      <div className="mr-hero">
        <div className="mr-eyebrow">Advisor Match</div>
        <h1 className="mr-title">Your Top Advisor Matches</h1>
        <p className="mr-hero-sub">
          Ranked by how well each firm fits your profile
        </p>
        {chips.length > 0 && (
          <div className="mr-chips">
            {chips.map((c, i) => (
              <span key={i} className="mr-chip">{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mr-body">
        {firms.length === 0 ? (
          <div className="mr-empty">
            <p className="mr-empty-title">No matches found</p>
            <p className="mr-empty-sub">Try adjusting your preferences for broader results.</p>
            <Link href="/match" className="mr-act-btn">Retake Questionnaire</Link>
          </div>
        ) : (
          <>
            {/* First result — always visible */}
            <FirmCard firm={firms[0]} rank={1} />

            {/* Remaining results — gated for guests */}
            {firms.length > 1 && (
              <div className="mr-gate-wrap">
                <div className={isAuthed === false ? 'mr-blurred' : undefined}>
                  {firms.slice(1, 10).map((firm, i) => (
                    <FirmCard key={firm.crd} firm={firm} rank={i + 2} />
                  ))}
                </div>

                {/* Gate overlay — only shown when confirmed not authed */}
                {isAuthed === false && (
                  <div className="mr-gate">
                    <div className="mr-gate-card">
                      <div className="mr-gate-eyebrow">Free account required</div>
                      <p className="mr-gate-title">
                        See all {Math.min(firms.length, 10)} matches
                      </p>
                      <p className="mr-gate-sub">
                        Create a free Visor Index account to unlock your full ranked list,
                        fee estimates, and Visor Score™ for each match.
                      </p>
                      <div className="mr-gate-btns">
                        <Link href="/auth/signup" className="mr-gate-btn-primary">
                          Get Started Free
                        </Link>
                        <Link href="/auth/login" className="mr-gate-btn-secondary">
                          Sign In
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mr-actions">
              <Link href="/match" className="mr-act-btn">
                ← Retake Questionnaire
              </Link>
              <Link href="/search" className="mr-act-btn">
                Browse All Firms
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
