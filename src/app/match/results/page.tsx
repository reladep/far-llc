'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { formatAUM, scoreColor } from '@/lib/utils';
import { getClosestBreakpoint, formatDollar, formatCompact, projectGrowth } from '@/lib/fee-utils';
import FirmLogo from '@/components/firms/FirmLogo';
import FirmTableGate from '@/components/firms/table/FirmTableGate';
import type { GateConfig } from '@/components/firms/table';

/* ── Types ── */

interface MatchAnswer {
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
  feeCompetitiveness: number;
  clientGrowth: number;
  advisorBandwidth: number;
  matchPercent: number;
  reasons: string[];
  matchReason?: string;
  estimatedFee: string;
  visorScore?: number;
  logoKey?: string | null;
}

/* ── Helpers ── */

function buildReasoning(firm: MatchedFirm): string {
  const parts: string[] = [];
  if (firm.feeCompetitiveness >= 85) parts.push('highly competitive fee structure');
  else if (firm.feeCompetitiveness >= 70) parts.push('reasonable fee structure');
  if (firm.clientGrowth >= 85) parts.push('strong client growth trajectory');
  else if (firm.clientGrowth >= 70) parts.push('steady client retention');
  if (firm.advisorBandwidth >= 85) parts.push('excellent advisor availability');
  else if (firm.advisorBandwidth >= 70) parts.push('good advisor-to-client ratio');
  if (firm.aum >= 5e9) parts.push('large-scale institutional capabilities');
  else if (firm.aum >= 1e9) parts.push('established multi-billion dollar platform');
  if (parts.length === 0) return 'This firm aligns with your stated preferences across multiple dimensions.';
  const joined = parts.length <= 2
    ? parts.join(' and ')
    : parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
  return `This firm stands out for its ${joined}, making it a strong fit for your profile.`;
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
};

/* ── Profile Insights ── */

interface ProfileInsight {
  heading: string;
  body: string;
  category: 'portfolio' | 'fee' | 'life' | 'market' | 'location' | 'priority';
}

function parseNetWorthAmount(raw: string): number | null {
  if (raw.startsWith('exact_')) return Number(raw.replace('exact_', '')) || null;
  const map: Record<string, number> = {
    under_250k: 150_000, '250k_1m': 500_000, '1m_5m': 2_500_000,
    '5m_10m': 7_500_000, '10m_25m': 15_000_000, '25m_plus': 50_000_000,
  };
  return map[raw] ?? null;
}

function generateInsights(answers: MatchAnswer, firms: MatchedFirm[]): ProfileInsight[] {
  const insights: ProfileInsight[] = [];
  const nw = parseNetWorthAmount(answers.netWorth);
  const formattedNW = nw ? formatCompact(nw) : null;

  // ── 1. Portfolio Classification ──
  if (nw) {
    if (nw >= 25_000_000) {
      insights.push({
        heading: 'Ultra-High Net Worth',
        body: `Portfolios above $25M place you in the top 0.1% of advisory clients. At this level, most firms assign a dedicated team and offer negotiable fee schedules — our data shows UHNW clients typically pay 30–45% less than published rates.`,
        category: 'portfolio',
      });
    } else if (nw >= 5_000_000) {
      const bp = getClosestBreakpoint(nw);
      insights.push({
        heading: 'High Net Worth',
        body: `A portfolio of ${formattedNW} places you in the high-net-worth segment — a tier where firms offer their most comprehensive service models. Across our index, the median fee at your level is ${bp.median}%, though the top quartile charges ${bp.p25}% or less.`,
        category: 'portfolio',
      });
    } else if (nw >= 250_000) {
      const bp = getClosestBreakpoint(nw);
      insights.push({
        heading: 'Mass Affluent',
        body: `With investable assets of ${formattedNW}, you fall into the mass affluent category — the fastest-growing client segment in wealth management. Fee structures vary widely at this level, from ${bp.p25}% to ${bp.p75}% across our database.`,
        category: 'portfolio',
      });
    } else {
      insights.push({
        heading: 'Emerging Investor',
        body: `Many traditional advisory firms set minimums above your current portfolio size, but a growing cohort of technology-forward RIAs now specializes in emerging investors. We've filtered your results to ${firms.length} firms that actively accept accounts at your level.`,
        category: 'portfolio',
      });
    }
  }

  // ── 2. Fee Context ──
  if (nw) {
    const bp = getClosestBreakpoint(nw);
    const dollarMedian = formatDollar(Math.round(nw * bp.median / 100));
    const feeFirms = firms
      .map(f => {
        const match = f.estimatedFee?.match(/\$[\d,]+\/yr/);
        return match ? parseInt(match[0].replace(/[$,\/yr]/g, ''), 10) : null;
      })
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b);

    let feeRange = '';
    if (feeFirms.length >= 2) {
      feeRange = ` Among your matches, estimated fees range from ${formatDollar(feeFirms[0])}/yr to ${formatDollar(feeFirms[feeFirms.length - 1])}/yr.`;
    }
    insights.push({
      heading: 'Your Fee Benchmark',
      body: `For a portfolio of ${formattedNW}, the industry median advisory fee is ${bp.median}% annually (${dollarMedian}/yr). The most competitive quartile charges ${bp.p25}% or less.${feeRange}`,
      category: 'fee',
    });

    // Fee savings sub-insight
    if (nw >= 500_000 && feeFirms.length > 0) {
      const bestRate = feeFirms[0] / nw;
      const medianRate = bp.median / 100;
      if (bestRate < medianRate) {
        const atMedian = projectGrowth(nw, medianRate, 10);
        const atBest = projectGrowth(nw, bestRate, 10);
        const savings = atBest.value - atMedian.value;
        if (savings > 1000) {
          insights.push({
            heading: '10-Year Fee Impact',
            body: `The difference between a ${bp.median}% and ${(bestRate * 100).toFixed(2)}% annual fee on your portfolio compounds to approximately ${formatCompact(Math.round(savings))} over 10 years, assuming a 7% annual return.`,
            category: 'fee',
          });
        }
      }
    }
  }

  // ── 3. Life Situation ──
  const triggers = Array.isArray(answers.lifeTrigger) ? answers.lifeTrigger : [answers.lifeTrigger];
  const lifeCopy: Record<string, { heading: string; body: string }> = {
    retirement: {
      heading: 'Retirement Transition',
      body: 'Retirement shifts the mandate from accumulation to decumulation, and mistakes compound irreversibly. Your matches are weighted toward firms with strong financial planning capabilities and demonstrated client retention — both signals that existing clients trust the firm\'s distribution strategies.',
    },
    inheritance: {
      heading: 'Sudden Wealth Event',
      body: 'Receiving a large sum creates a compressed decision window where the wrong advisory relationship can be costly. We\'ve factored in fiduciary obligations and transparent fee structures — critical when onboarding new assets, since the first-year fee on inherited wealth is often the least negotiated.',
    },
    sale: {
      heading: 'Liquidity Event',
      body: 'Post-sale liquidity events require coordinated tax planning, asset allocation, and often estate restructuring — all within a narrow window. Your results prioritize firms offering comprehensive services and experience managing concentrated transitions from illiquid to liquid assets.',
    },
    career: {
      heading: 'Career Transition',
      body: 'Career transitions often create complex planning needs around equity compensation, deferred comp, and benefits optimization. We\'ve weighted your matches toward firms with planning depth and advisor bandwidth to handle multi-dimensional onboarding.',
    },
    planning: {
      heading: 'Estate & Tax Strategy',
      body: 'Estate and tax planning clients typically require the deepest service model a firm offers. Your results are tilted toward firms with comprehensive service capabilities — look for those offering tax-loss harvesting, trust administration, or multi-generational planning.',
    },
    first_time: {
      heading: 'First Advisor Search',
      body: 'As a first-time advisory client, the most important variable is fee transparency — the one factor you can evaluate objectively before the relationship begins. Visor surfaces fee structures directly from regulatory filings, so the numbers here aren\'t marketing claims.',
    },
    switching: {
      heading: 'Advisor Switch',
      body: 'Clients who switch advisors are typically the most informed buyers in the market. Your existing relationship gives you a baseline to evaluate against: compare fee competitiveness, Visor Index scores, and conflict-of-interest profiles across your matches.',
    },
  };
  for (const t of triggers.slice(0, 2)) {
    const copy = lifeCopy[t];
    if (copy) insights.push({ ...copy, category: 'life' });
  }

  // ── 4. Market Position ──
  const topMatch = firms[0]?.matchPercent ?? 0;
  const avgMatch = firms.length > 0
    ? Math.round(firms.reduce((s, f) => s + f.matchPercent, 0) / firms.length)
    : 0;
  if (firms.length >= 15) {
    const tenthMatch = firms[Math.min(9, firms.length - 1)]?.matchPercent ?? 0;
    insights.push({
      heading: 'Competitive Market',
      body: `We identified ${firms.length} firms that meet your criteria — a deep pool that gives you significant optionality. The spread between your top match (${topMatch}%) and your 10th (${tenthMatch}%) is ${topMatch - tenthMatch} points, meaning you have multiple strong options.`,
      category: 'market',
    });
  } else if (firms.length >= 5) {
    insights.push({
      heading: 'Focused Match Pool',
      body: `Your criteria produced ${firms.length} qualified matches — a focused but adequate pool. Your top match scores ${topMatch}%, which is ${topMatch - avgMatch} points above the group average of ${avgMatch}%.`,
      category: 'market',
    });
  } else if (firms.length > 0) {
    insights.push({
      heading: 'Limited Matches',
      body: `Only ${firms.length} firms met all your criteria. Consider whether relaxing your firm size or location preference would surface additional options. Even with limited matches, a ${topMatch}% top score indicates strong alignment.`,
      category: 'market',
    });
  }

  // ── 5. Location ──
  if (answers.location === 'outside_us') {
    insights.push({
      heading: 'International Client',
      body: 'International clients face a narrower field of US-based advisors, as cross-border compliance adds operational complexity. Your results are filtered exclusively to firms with demonstrated non-US client experience, based on their regulatory filings.',
      category: 'location',
    });
  } else if (answers.location && answers.location !== 'other') {
    const stateMatch = answers.location.match(/,\s*([A-Z]{2})$/);
    const state = stateMatch?.[1];
    if (state) {
      const localCount = firms.filter(f => f.state === state).length;
      insights.push({
        heading: `${answers.location} Market`,
        body: `${localCount} of your ${firms.length} matches are headquartered in ${state}${localCount > 0 ? ', giving you the option of in-person meetings' : ''}. Additional firms in your results operate in your state through branch registrations — look for the "Operates in Your State" tag.`,
        category: 'location',
      });
    }
  }

  // ── 6. Priority Alignment ──
  const prioCopy: Record<string, { heading: string; body: string }> = {
    aum_growth: {
      heading: 'Growth Track Record',
      body: 'Firms scoring highest on growth have increased assets at rates exceeding industry medians over the trailing reporting period. This metric is sourced directly from SEC filings, not self-reported.',
    },
    client_retention: {
      heading: 'Client Loyalty Signal',
      body: 'Client retention is the closest thing to a satisfaction score in an unrated industry. Firms that consistently grow their client count while maintaining AUM are demonstrating something marketing can\'t fake.',
    },
    advisor_experience: {
      heading: 'Seasoned Advisors',
      body: 'Advisor experience correlates with firm viability — established teams are less likely to merge, close, or undergo disruptive transitions. Your results are weighted toward firms with longer operating histories and stable advisor rosters.',
    },
    personal_service: {
      heading: 'Advisor Bandwidth',
      body: 'Personal attention is a function of how many clients each advisor serves. Our bandwidth score measures this ratio directly from headcount and client data in SEC filings — firms tagged "Personal Attention" typically maintain under 80 clients per advisor.',
    },
    comprehensive: {
      heading: 'Full-Service Model',
      body: 'Your matches are scored on service breadth — financial planning, portfolio management, manager selection, and pension consulting capabilities — all verified from regulatory disclosures.',
    },
    fiduciary: {
      heading: 'Fiduciary Standard',
      body: 'Firms scoring highest on our conflict-free dimension have no proprietary product revenue, no broker-dealer affiliations, and no performance-based fee incentives that could bias recommendations.',
    },
    fee_only: {
      heading: 'Fee-Only Model',
      body: 'Fee-only firms earn revenue exclusively from client-paid fees — no commissions, no revenue sharing, no 12b-1 fees. Our conflict-free score identifies firms with the cleanest compensation structures, sourced from ADV filings.',
    },
  };
  const priorities = answers.priorities || [];
  for (const p of priorities.slice(0, 3)) {
    const copy = prioCopy[p];
    if (copy) insights.push({ ...copy, category: 'priority' });
  }

  return insights;
}

const INSIGHT_CSS = `
  .pi-section {
    max-width:960px; margin:0 auto; padding:32px 24px 0;
  }
  .pi-header {
    display:flex; align-items:center; gap:10px; margin-bottom:20px;
  }
  .pi-eyebrow {
    font-family:var(--font-mono); font-size:10px; font-weight:600;
    letter-spacing:0.18em; text-transform:uppercase; color:#2DBD74;
  }
  .pi-rule { flex:1; height:1px; background:#CAD8D0; }
  .pi-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:20px;
  }
  .pi-card {
    padding:20px 22px; background:#fff; border:0.5px solid #CAD8D0;
    border-radius:10px;
    box-shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
  }
  .pi-card-heading {
    font-family:var(--font-serif); font-size:15px; font-weight:700;
    color:#0C1810; margin-bottom:6px; line-height:1.2;
  }
  .pi-card-body {
    font-family:var(--font-sans); font-size:13px; color:#5A7568;
    line-height:1.65;
  }
  .pi-card-tag {
    display:inline-block; font-family:var(--font-mono); font-size:8px;
    font-weight:600; letter-spacing:0.12em; text-transform:uppercase;
    color:#2DBD74; background:rgba(45,189,116,.06);
    border:1px solid rgba(45,189,116,.12); padding:2px 6px; margin-bottom:10px;
  }
  .pi-card-featured {
    grid-column:1 / -1;
    background:linear-gradient(135deg, #fff 0%, #F6FBF8 100%);
    border-left:2px solid #2DBD74;
  }
  .pi-expand {
    display:flex; align-items:center; gap:6px; margin:16px auto 0;
    font-family:var(--font-mono); font-size:10px; font-weight:600;
    letter-spacing:0.1em; text-transform:uppercase; color:#5A7568;
    background:none; border:none; cursor:pointer; padding:8px 16px;
    transition:color .15s;
  }
  .pi-expand:hover { color:#0C1810; }
  .pi-chevron {
    display:inline-block; transform:rotate(90deg); transition:transform .2s;
    font-size:14px; line-height:1;
  }
  .pi-chevron-up { transform:rotate(-90deg); }
  @media(max-width:640px){
    .pi-section { padding:24px 16px 0; }
    .pi-grid { grid-template-columns:1fr; gap:14px; }
    .pi-card { padding:16px 18px; }
    .pi-card-featured { border-left:2px solid #2DBD74; }
  }
`;

const CATEGORY_LABELS: Record<string, string> = {
  portfolio: 'Portfolio',
  fee: 'Fees',
  life: 'Situation',
  market: 'Market',
  location: 'Location',
  priority: 'Priority',
};

function ProfileInsightsPanel({ answers, firms }: { answers: MatchAnswer; firms: MatchedFirm[] }) {
  const insights = useMemo(() => generateInsights(answers, firms), [answers, firms]);
  const [expanded, setExpanded] = useState(false);
  if (insights.length === 0) return null;

  // Show top 3 always (portfolio + fee + market/life), rest on expand
  const primary = insights.slice(0, 3);
  const secondary = insights.slice(3);

  return (
    <div className="pi-section">
      <style dangerouslySetInnerHTML={{ __html: INSIGHT_CSS }} />
      <div className="pi-header">
        <span className="pi-eyebrow">Your Profile</span>
        <div className="pi-rule" />
      </div>
      <div className="pi-grid">
        {primary.map((ins, i) => (
          <div key={i} className={`pi-card${i === 0 ? ' pi-card-featured' : ''}`}>
            <span className="pi-card-tag">{CATEGORY_LABELS[ins.category] || ins.category}</span>
            <div className="pi-card-heading">{ins.heading}</div>
            <div className="pi-card-body">{ins.body}</div>
          </div>
        ))}
      </div>
      {secondary.length > 0 && (
        <>
          {expanded && (
            <div className="pi-grid" style={{ marginTop: 20 }}>
              {secondary.map((ins, i) => (
                <div key={i} className="pi-card">
                  <span className="pi-card-tag">{CATEGORY_LABELS[ins.category] || ins.category}</span>
                  <div className="pi-card-heading">{ins.heading}</div>
                  <div className="pi-card-body">{ins.body}</div>
                </div>
              ))}
            </div>
          )}
          <button
            className="pi-expand"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : `${secondary.length} more insights`}
            <span className={`pi-chevron${expanded ? ' pi-chevron-up' : ''}`}>&#8250;</span>
          </button>
        </>
      )}
    </div>
  );
}

/* ── Match card CSS ── */

const CARD_CSS = `
  .mc-list { display:flex; flex-direction:column; gap:14px; }

  .mc-card {
    background:#fff; border:0.5px solid #CAD8D0; border-radius:10px;
    box-shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
    cursor:pointer; transition:box-shadow .2s ease, border-color .2s ease;
    overflow:hidden; position:relative;
  }
  .mc-card:hover {
    box-shadow:0 2px 8px rgba(0,0,0,.06), 0 12px 32px rgba(0,0,0,.05);
    border-color:rgba(45,189,116,.25);
  }
  .mc-card-expanded { border-color:rgba(45,189,116,.3); }
  .mc-card-expanded::before {
    content:''; position:absolute; left:0; top:0; bottom:0; width:2px;
    background:#2DBD74; border-radius:10px 0 0 10px;
  }

  .mc-body { padding:20px 22px; }
  .mc-top { display:flex; align-items:flex-start; gap:14px; }
  .mc-info { flex:1; min-width:0; }
  .mc-name {
    font-family:var(--font-sans); font-size:15px; font-weight:600;
    color:#0C1810; line-height:1.25; margin-bottom:2px;
  }
  .mc-loc {
    font-family:var(--font-mono); font-size:10px; color:#5A7568;
    letter-spacing:0.02em;
  }
  .mc-match {
    text-align:right; flex-shrink:0; padding-top:2px;
  }
  .mc-match-pct {
    font-family:var(--font-serif); font-size:26px; font-weight:700;
    color:#2DBD74; line-height:1; letter-spacing:-0.02em;
  }
  .mc-match-label {
    font-family:var(--font-mono); font-size:8px; font-weight:600;
    letter-spacing:0.14em; text-transform:uppercase; color:#5A7568;
    margin-top:2px;
  }

  .mc-reason {
    font-family:var(--font-sans); font-size:13px; color:#5A7568;
    line-height:1.6; margin-top:12px;
  }

  .mc-metrics {
    display:grid; grid-template-columns:repeat(4,1fr); gap:0;
    margin-top:16px; border-top:1px solid #CAD8D0; padding-top:14px;
  }
  .mc-metric { text-align:center; position:relative; }
  .mc-metric + .mc-metric::before {
    content:''; position:absolute; left:0; top:2px; bottom:2px;
    width:1px; background:#CAD8D0;
  }
  .mc-metric-value {
    font-family:var(--font-sans); font-size:14px; font-weight:700;
    color:#0C1810; line-height:1;
  }
  .mc-metric-label {
    font-family:var(--font-mono); font-size:8px; font-weight:600;
    letter-spacing:0.12em; text-transform:uppercase; color:#5A7568;
    margin-top:4px;
  }

  .mc-tags { display:flex; flex-wrap:wrap; gap:5px; margin-top:14px; }
  .mc-tag {
    font-family:var(--font-mono); font-size:9px; font-weight:600;
    letter-spacing:0.06em; text-transform:uppercase;
    color:#2DBD74; background:rgba(45,189,116,.05);
    border:1px solid rgba(45,189,116,.12); padding:3px 8px;
  }

  /* Expanded detail */
  .mc-detail {
    border-top:1px solid #CAD8D0; padding:20px 22px;
    background:linear-gradient(180deg, #FAFCFB 0%, #fff 100%);
    animation:mcDetailIn .2s ease-out;
  }
  @keyframes mcDetailIn {
    from { opacity:0; transform:translateY(-4px); }
    to { opacity:1; transform:translateY(0); }
  }
  .mc-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .mc-detail-section-title {
    font-family:var(--font-mono); font-size:9px; font-weight:600;
    letter-spacing:0.16em; text-transform:uppercase; color:#5A7568;
    margin-bottom:10px;
  }
  .mc-detail-row {
    display:flex; align-items:center; justify-content:space-between;
    font-family:var(--font-sans); font-size:12px; padding:4px 0;
  }
  .mc-detail-label { color:#5A7568; }
  .mc-detail-value { color:#0C1810; font-weight:600; }
  .mc-bar-track { height:3px; background:#CAD8D0; border-radius:2px; overflow:hidden; margin-top:3px; }
  .mc-bar-fill { height:100%; border-radius:2px; transition:width .5s ease-out; }
  .mc-detail-actions {
    display:flex; align-items:center; gap:10px;
    border-top:1px solid #CAD8D0; padding-top:14px; margin-top:16px;
  }
  .mc-detail-reason {
    font-family:var(--font-sans); font-size:12px; color:#5A7568;
    line-height:1.7; margin-top:10px;
  }

  /* Stagger animation */
  @keyframes mcCardIn {
    from { opacity:0; transform:translateY(8px); }
    to { opacity:1; transform:translateY(0); }
  }
  .mc-card { animation:mcCardIn .35s ease-out both; }
  @media(prefers-reduced-motion:reduce){
    .mc-card, .mc-detail { animation:none; }
  }

  /* Mobile */
  @media(max-width:640px){
    .mc-body { padding:16px; }
    .mc-name { font-size:14px; }
    .mc-match-pct { font-size:22px; }
    .mc-metrics { grid-template-columns:repeat(2,1fr); gap:10px 0; padding-top:12px; }
    .mc-metric + .mc-metric:nth-child(3)::before { display:none; }
    .mc-detail { padding:16px; }
    .mc-detail-grid { grid-template-columns:1fr; gap:16px; }
    .mc-reason { font-size:12px; }
  }
`;

const matchGateConfig: GateConfig = {
  eyebrowText: 'Unlock All Matches',
  title: 'See your top matches, ranked without conflicts.',
  subtitle: 'You pay us, not the firms. That means every match is ranked by what\u2019s best for you. Get full results, fee breakdowns, and Visor Index scores.',
  primaryCta: { label: 'Get Full Access \u2192', href: '/auth/signup' },
  secondaryCta: { label: 'View Pricing', href: '/pricing' },
  previewCount: 4,
};

/* ── Match card components ── */

function MatchCard({
  firm,
  index,
  isExpanded,
  onToggle,
  isAuthed,
  isSaved,
}: {
  firm: MatchedFirm;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isAuthed: boolean | null;
  isSaved: boolean;
}) {
  const feeDisplay = firm.estimatedFee && firm.estimatedFee !== 'Contact firm' ? firm.estimatedFee : null;

  return (
    <div
      className={`mc-card${isExpanded ? ' mc-card-expanded' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="mc-body" onClick={onToggle} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        {/* Top: Logo + name + match % */}
        <div className="mc-top">
          <FirmLogo logoKey={firm.logoKey} firmName={firm.displayName || firm.name} size="sm" />
          <div className="mc-info">
            <div className="mc-name">{firm.displayName || firm.name}</div>
            <div className="mc-loc">{firm.city}, {firm.state}</div>
          </div>
          <div className="mc-match">
            <div className="mc-match-pct">{firm.matchPercent}%</div>
            <div className="mc-match-label">Match</div>
          </div>
        </div>

        {/* Match reason */}
        {firm.matchReason && (
          <div className="mc-reason">
            {firm.matchReason.charAt(0).toUpperCase() + firm.matchReason.slice(1)}
          </div>
        )}

        {/* Metrics strip */}
        <div className="mc-metrics">
          <div className="mc-metric">
            <div className="mc-metric-value" style={{ color: firm.visorScore != null ? scoreColor(firm.visorScore) : '#CAD8D0' }}>
              {firm.visorScore != null ? firm.visorScore : '\u2014'}
            </div>
            <div className="mc-metric-label">Visor Index</div>
          </div>
          <div className="mc-metric">
            <div className="mc-metric-value">{formatAUM(firm.aum)}</div>
            <div className="mc-metric-label">AUM</div>
          </div>
          <div className="mc-metric">
            <div className="mc-metric-value">{feeDisplay || '\u2014'}</div>
            <div className="mc-metric-label">Est. Fee</div>
          </div>
          <div className="mc-metric">
            <div className="mc-metric-value">{firm.reasons.length > 0 ? firm.reasons.length : '\u2014'}</div>
            <div className="mc-metric-label">Signals</div>
          </div>
        </div>

        {/* Tags */}
        {firm.reasons.length > 0 && (
          <div className="mc-tags">
            {firm.reasons.map((r, i) => (
              <span key={i} className="mc-tag">{r}</span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <MatchCardDetail firm={firm} isAuthed={isAuthed} isSaved={isSaved} />
      )}
    </div>
  );
}

function MatchCardDetail({
  firm,
  isAuthed,
  isSaved,
}: {
  firm: MatchedFirm;
  isAuthed: boolean | null;
  isSaved: boolean;
}) {
  const breakdowns = [
    { label: 'Fee Competitiveness', value: firm.feeCompetitiveness },
    { label: 'Client Growth', value: firm.clientGrowth },
    { label: 'Advisor Bandwidth', value: firm.advisorBandwidth },
  ];

  return (
    <div className="mc-detail">
      <div className="mc-detail-grid">
        <div>
          <div className="mc-detail-section-title">Firm Details</div>
          <div className="mc-detail-row">
            <span className="mc-detail-label">AUM</span>
            <span className="mc-detail-value">{formatAUM(firm.aum)}</span>
          </div>
          <div className="mc-detail-row">
            <span className="mc-detail-label">Estimated Fee</span>
            <span className="mc-detail-value">{firm.estimatedFee || '\u2014'}</span>
          </div>
          <div className="mc-detail-row">
            <span className="mc-detail-label">Location</span>
            <span className="mc-detail-value">{firm.city}, {firm.state}</span>
          </div>
        </div>
        <div>
          <div className="mc-detail-section-title">Match Breakdown</div>
          {breakdowns.map((b) => (
            <div key={b.label} style={{ marginBottom: 8 }}>
              <div className="mc-detail-row" style={{ padding: 0 }}>
                <span className="mc-detail-label">{b.label}</span>
                <span className="text-[11px] font-bold font-mono" style={{ color: scoreColor(b.value * 10) }}>
                  {b.value}
                </span>
              </div>
              <div className="mc-bar-track">
                <div
                  className="mc-bar-fill"
                  style={{ width: `${Math.min(b.value * 10, 100)}%`, background: scoreColor(b.value * 10) }}
                />
              </div>
            </div>
          ))}
          <div className="mc-detail-reason">{buildReasoning(firm)}</div>
        </div>
      </div>
      <div className="mc-detail-actions">
        <Link
          href={`/firm/${firm.crd}`}
          className="text-[11px] font-semibold text-[#0C1810] border border-[#CAD8D0] px-4 py-2 hover:border-[rgba(26,122,74,0.3)] hover:text-[#0C1810] transition-all font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          View Full Profile &rarr;
        </Link>
        <SaveButton crd={firm.crd} isSaved={isSaved} isAuthed={isAuthed} />
      </div>
    </div>
  );
}

/* ── Save button ── */

function SaveButton({ crd, isSaved, isAuthed }: { crd: number; isSaved: boolean; isAuthed: boolean | null }) {
  const [saved, setSaved] = useState(isSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setSaved(isSaved); }, [isSaved]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthed) { window.location.href = '/auth/signup'; return; }
    setLoading(true);
    try {
      if (saved) {
        const res = await fetch(`/api/user/saved-firms/${crd}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) setSaved(false);
      } else {
        const res = await fetch('/api/user/saved-firms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crd }),
          credentials: 'include',
        });
        if (res.ok) setSaved(true);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <button
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.04em] px-3.5 py-1.5 transition-all ${
        saved
          ? 'border border-[rgba(45,189,116,0.3)] bg-[rgba(45,189,116,0.07)] text-[#2DBD74]'
          : 'border border-[#CAD8D0] text-[#5A7568] hover:border-[rgba(45,189,116,0.4)] hover:text-[#2DBD74]'
      }`}
      onClick={handleToggle}
      disabled={loading}
    >
      <svg width="11" height="11" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" viewBox="0 0 11 11">
        <path d="M2 1.5h7a.5.5 0 0 1 .5.5v7.5l-4-2.5L1.5 9.5V2a.5.5 0 0 1 .5-.5Z" />
      </svg>
      {loading ? '…' : saved ? 'Saved' : 'Save'}
    </button>
  );
}

/* ── Hero CSS (page-specific, kept as CSS-in-JS) ── */

const HERO_CSS = `
  .mr-hero {
    background:#0A1C2A; padding:64px 24px 52px;
    text-align:center; position:relative; overflow:hidden;
  }
  .mr-hero::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background:
      radial-gradient(circle at top, rgba(34,197,94,0.16), transparent 34%),
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: auto, 72px 72px, 72px 72px;
  }
  .mr-hero-inner { position:relative; z-index:2; }
  @media(max-width:600px){ .mr-hero { padding:44px 16px 36px; } }
`;

/* ── Page component ── */

export default function MatchResultsPage() {
  const [answers, setAnswers] = useState<MatchAnswer | null>(null);
  const [firms, setFirms] = useState<MatchedFirm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [savedCrds, setSavedCrds] = useState<Set<number>>(new Set());

  const [expandedCrd, setExpandedCrd] = useState<number | null>(null);
  const [resultsSaved, setResultsSaved] = useState(false);
  const [savingResults, setSavingResults] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function init() {
      const saved = sessionStorage.getItem('matchAnswers');
      let matchAnswers: MatchAnswer | null = null;

      if (saved) {
        matchAnswers = JSON.parse(saved);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_match_profiles')
            .select('answers')
            .eq('user_id', user.id)
            .single();
          if (profile?.answers) {
            matchAnswers = profile.answers as MatchAnswer;
            sessionStorage.setItem('matchAnswers', JSON.stringify(matchAnswers));
          }
        }
      }

      if (!matchAnswers) { window.location.href = '/match'; return; }

      setAnswers(matchAnswers);
      fetchMatchedFirms(matchAnswers);

      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthed(!!user);
      if (user) {
        const { data } = await supabase
          .from('user_favorites')
          .select('crd')
          .eq('user_id', user.id);
        if (data) setSavedCrds(new Set(data.map((d: { crd: number }) => d.crd)));
      }
    }

    init();
  }, []);

  async function fetchMatchedFirms(matchAnswers: MatchAnswer) {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      const params = new URLSearchParams({
        netWorth: matchAnswers.netWorth,
        lifeTrigger: Array.isArray(matchAnswers.lifeTrigger) ? matchAnswers.lifeTrigger.join(',') : matchAnswers.lifeTrigger,
        location: matchAnswers.location,
        priorities: matchAnswers.priorities.join(','),
        firmSize: matchAnswers.firmSize,
        serviceDepth: matchAnswers.serviceDepth,
        conflictImportance: matchAnswers.conflictImportance,
      });
      const res = await fetch(`/api/match?${params}`);
      let firmList: MatchedFirm[];
      if (res.ok) {
        const data = await res.json();
        firmList = data.firms || [];
      } else {
        firmList = getSampleFirms();
      }

      if (firmList.length > 0) {
        const crds = firmList.map((f) => f.crd);
        const { data: logoData } = await supabase
          .from('firm_logos')
          .select('crd, logo_key')
          .eq('has_logo', true)
          .in('crd', crds);
        if (logoData) {
          const logoMap = new Map(logoData.map((l: { crd: number; logo_key: string }) => [l.crd, l.logo_key]));
          firmList = firmList.map((f) => ({ ...f, logoKey: logoMap.get(f.crd) || null }));
        }
      }

      setFirms(firmList);
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
        crd: 123456, name: 'Sample Wealth Management',
        city: 'New York', state: 'NY', aum: 2500000000,
        feeCompetitiveness: 92, clientGrowth: 88, advisorBandwidth: 95,
        matchPercent: 94, reasons: ['Low Fees', 'Client Retention', 'Fiduciary'],
        estimatedFee: '0.75–1.00%', visorScore: 87,
      },
      {
        crd: 234567, name: 'Example Advisory Group',
        city: 'Boston', state: 'MA', aum: 1800000000,
        feeCompetitiveness: 85, clientGrowth: 92, advisorBandwidth: 88,
        matchPercent: 89, reasons: ['Fee-Only', 'Comprehensive', 'Experienced'],
        estimatedFee: '0.85–1.10%', visorScore: 82,
      },
    ];
  }

  const chips: string[] = [];
  if (answers) {
    // Net worth: handle exact amounts and bucket values
    const nw = answers.netWorth.startsWith('exact_')
      ? `$${Number(answers.netWorth.replace('exact_', '')).toLocaleString('en-US')}`
      : LABEL_MAP.netWorth[answers.netWorth];
    if (nw) chips.push(nw);

    // Life trigger: now an array
    const triggers = Array.isArray(answers.lifeTrigger) ? answers.lifeTrigger : [answers.lifeTrigger];
    for (const t of triggers.slice(0, 2)) {
      const lt = LABEL_MAP.lifeTrigger[t];
      if (lt) chips.push(lt);
    }

    // Location: now a free-text string like "Boston, MA" or "outside_us"
    if (answers.location === 'outside_us') chips.push('Outside US');
    else if (answers.location && !LABEL_MAP.location[answers.location]) chips.push(answers.location);
    else if (LABEL_MAP.location[answers.location]) chips.push(LABEL_MAP.location[answers.location]);
  }

  const avgMatch = firms.length > 0
    ? Math.round(firms.reduce((s, f) => s + f.matchPercent, 0) / firms.length)
    : 0;
  const firmsWithScore = firms.filter((f) => f.visorScore != null);
  const avgVisor = firmsWithScore.length > 0
    ? Math.round(firmsWithScore.reduce((s, f) => s + (f.visorScore ?? 0), 0) / firmsWithScore.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#F6F8F7] text-[#0C1810]">
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />

      {/* Hero */}
      <div className="mr-hero">
        <div className="mr-hero-inner">
          <div className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-[#2DBD74] mb-3.5">
            Advisor Match
          </div>
          <h1 className="font-serif text-[clamp(26px,4vw,40px)] font-bold text-white mb-1.5 leading-[1.1]">
            Firms Tailored to You
          </h1>
          <p className="text-[13px] text-white/45 mb-4 font-sans">
            We work for you, not the advisors. Every match is ranked by fit alone.
          </p>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {chips.map((c, i) => (
                <span key={i} className="font-mono text-[10px] text-white/55 border border-white/[0.12] px-3 py-1 bg-white/[0.04]">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats strip — authed only */}
      {firms.length > 0 && isAuthed && (
        <div className="flex items-center justify-center gap-7 py-7 px-5 border-b border-[#CAD8D0]">
          <div className="text-center">
            <div className="font-serif text-[18px] font-bold text-[#0C1810]">
              {firms.length}<span className="text-[#2DBD74]">+</span>
            </div>
            <div className="font-mono text-[9px] font-semibold tracking-[0.14em] uppercase text-[#5A7568] mt-0.5">
              Matches Found
            </div>
          </div>
          <div className="w-px h-4 bg-[#CAD8D0] shrink-0" />
          <div className="text-center">
            <div className="font-serif text-[18px] font-bold text-[#0C1810]">
              {avgMatch}<span className="text-[#2DBD74]">%</span>
            </div>
            <div className="font-mono text-[9px] font-semibold tracking-[0.14em] uppercase text-[#5A7568] mt-0.5">
              Avg Match
            </div>
          </div>
          {avgVisor > 0 && (
            <>
              <div className="w-px h-4 bg-[#CAD8D0] shrink-0" />
              <div className="text-center">
                <div className="font-serif text-[18px] font-bold text-[#0C1810]">
                  {avgVisor}<span className="text-[#2DBD74]">/100</span>
                </div>
                <div className="font-mono text-[9px] font-semibold tracking-[0.14em] uppercase text-[#5A7568] mt-0.5">
                  Avg Visor Index
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Profile Insights — authed only */}
      {!loading && answers && firms.length > 0 && isAuthed && (
        <ProfileInsightsPanel answers={answers} firms={firms} />
      )}

      {/* Firm cards */}
      <div className="max-w-[960px] mx-auto px-6 py-8 max-sm:px-4 max-sm:py-5">
        <style dangerouslySetInnerHTML={{ __html: CARD_CSS }} />

        {loading ? (
          <div className="py-20 text-center">
            <div className="h-7 w-7 border-2 border-[#CAD8D0] border-t-[#2DBD74] rounded-full animate-spin mx-auto" />
            <p className="text-[13px] text-[#5A7568] mt-4 font-sans">Loading&hellip;</p>
          </div>
        ) : firms.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-[22px] font-bold text-[#0C1810] mb-2">No results found</p>
            <p className="text-[13px] text-[#5A7568] font-sans">Try adjusting your search criteria.</p>
          </div>
        ) : isAuthed === false ? (
          <FirmTableGate config={matchGateConfig}>
            <div className="mc-list">
              {firms.slice(0, matchGateConfig.previewCount ?? 4).map((firm, i) => {
                // Redact sensitive data — only show placeholder shapes
                const redacted: MatchedFirm = {
                  ...firm,
                  name: 'Advisory Firm',
                  displayName: 'Advisory Firm',
                  city: '',
                  state: '',
                  logoKey: null,
                  matchPercent: 0,
                  visorScore: undefined,
                  estimatedFee: '',
                  matchReason: '',
                  reasons: [],
                  aum: 0,
                  feeCompetitiveness: 0,
                  clientGrowth: 0,
                  advisorBandwidth: 0,
                };
                return (
                  <MatchCard
                    key={firm.crd}
                    firm={redacted}
                    index={i}
                    isExpanded={false}
                    onToggle={() => {}}
                    isAuthed={isAuthed}
                    isSaved={false}
                  />
                );
              })}
            </div>
          </FirmTableGate>
        ) : (
          <div className="mc-list">
            {firms.slice(0, 10).map((firm, i) => (
              <MatchCard
                key={firm.crd}
                firm={firm}
                index={i}
                isExpanded={expandedCrd === firm.crd}
                onToggle={() => setExpandedCrd(expandedCrd === firm.crd ? null : firm.crd)}
                isAuthed={isAuthed}
                isSaved={savedCrds.has(firm.crd)}
              />
            ))}
          </div>
        )}

        {/* Bottom actions */}
        {!loading && firms.length > 0 && (
          <div className="flex gap-3 justify-center flex-wrap pt-6 max-sm:flex-col max-sm:items-stretch">
            {isAuthed && (
              <button
                className={`text-[12px] font-sans font-semibold px-6 py-2.5 transition-all text-center ${
                  resultsSaved
                    ? 'bg-[rgba(45,189,116,0.08)] border border-[rgba(45,189,116,0.3)] text-[#2DBD74]'
                    : 'bg-[#1A7A4A] text-white hover:bg-[#22995E]'
                }`}
                disabled={savingResults || resultsSaved}
                onClick={async () => {
                  setSavingResults(true);
                  try {
                    const res = await fetch('/api/user/match-results', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ firms }),
                      credentials: 'include',
                    });
                    if (res.ok) setResultsSaved(true);
                  } catch { /* silent */ }
                  finally { setSavingResults(false); }
                }}
              >
                {savingResults ? 'Saving\u2026' : resultsSaved ? '\u2713 Saved to Dashboard' : 'Save Results to Dashboard'}
              </button>
            )}
            <Link
              href="/match"
              className="text-[12px] font-sans px-6 py-2.5 border border-[#CAD8D0] text-[#5A7568] hover:border-[#5A7568] hover:text-[#0C1810] transition-all text-center"
            >
              &larr; Retake Questionnaire
            </Link>
            <Link
              href="/search"
              className="text-[12px] font-sans px-6 py-2.5 border border-[#CAD8D0] text-[#5A7568] hover:border-[#5A7568] hover:text-[#0C1810] transition-all text-center"
            >
              Browse All Firms
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
