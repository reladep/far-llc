'use client';

import { useEffect, useState, useMemo } from 'react';
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
  logoKey?: string | null;
}

interface FirmBadge {
  label: string;
  color: string;
}

function computeBadges(firms: MatchedFirm[]): Map<number, FirmBadge[]> {
  const map = new Map<number, FirmBadge[]>();
  if (firms.length < 2) return map;

  const dims: { key: keyof MatchedFirm; label: string }[] = [
    { key: 'feeCompetitiveness', label: 'Lowest Fees' },
    { key: 'clientGrowth', label: 'Top Growth' },
    { key: 'advisorBandwidth', label: 'Best Availability' },
  ];

  for (const dim of dims) {
    let best = -1;
    let bestCrd = -1;
    for (const f of firms) {
      const val = f[dim.key] as number;
      if (val > best) { best = val; bestCrd = f.crd; }
    }
    const avg = firms.reduce((s, f) => s + (f[dim.key] as number), 0) / firms.length;
    if (best >= avg + 5 && bestCrd >= 0) {
      const existing = map.get(bestCrd) || [];
      existing.push({ label: dim.label, color: '#2DBD74' });
      map.set(bestCrd, existing);
    }
  }

  const scored = firms.filter((f) => f.visorScore != null);
  if (scored.length >= 2) {
    const best = scored.reduce((a, b) => ((a.visorScore ?? 0) > (b.visorScore ?? 0) ? a : b));
    const avg = scored.reduce((s, f) => s + (f.visorScore ?? 0), 0) / scored.length;
    if ((best.visorScore ?? 0) >= avg + 3) {
      const existing = map.get(best.crd) || [];
      existing.push({ label: 'Highest VVS', color: '#2DBD74' });
      map.set(best.crd, existing);
    }
  }

  return map;
}

function scoreColor(val: number): string {
  if (val >= 80) return '#2DBD74';
  if (val >= 60) return '#22995E';
  if (val >= 40) return '#F59E0B';
  return '#EF4444';
}

const CSS = `
  :root {
    --navy:#0A1C2A; --navy-2:#0F2538; --navy-3:#132D42;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568; --rule:#CAD8D0;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }

  .mr-page { min-height:100vh; background:var(--navy); color:#fff; }

  /* ── Hero ── */
  .mr-hero {
    background:var(--navy); padding:64px 24px 52px;
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
  .mr-eyebrow {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.18em; text-transform:uppercase;
    color:var(--green-3); margin-bottom:14px;
  }
  .mr-title {
    font-family:var(--serif); font-size:clamp(26px,4vw,40px);
    font-weight:700; color:#fff; margin-bottom:6px; line-height:1.1;
  }
  .mr-hero-sub {
    font-family:var(--sans); font-size:13px;
    color:rgba(255,255,255,0.45); margin:0 0 18px;
  }
  .mr-chips { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
  .mr-chip {
    font-family:var(--mono); font-size:10px;
    color:rgba(255,255,255,0.55);
    border:1px solid rgba(255,255,255,0.12); padding:4px 12px;
    background:rgba(255,255,255,0.04);
  }

  /* ── Stats strip ── */
  .mr-stats-strip {
    display:flex; align-items:center; justify-content:center;
    gap:28px; padding:28px 20px;
    border-bottom:1px solid rgba(255,255,255,0.06);
  }
  .mr-stat-divider { width:1px; height:16px; background:rgba(255,255,255,0.10); flex-shrink:0; }
  .mr-stat { text-align:center; }
  .mr-stat-value {
    font-family:var(--serif); font-size:18px; font-weight:700; color:#fff;
  }
  .mr-stat-value span { color:var(--green-3); }
  .mr-stat-label {
    font-family:var(--mono); font-size:9px; font-weight:600;
    letter-spacing:.14em; text-transform:uppercase;
    color:rgba(255,255,255,0.30); margin-top:3px;
  }

  /* ── Body ── */
  .mr-body { max-width:820px; margin:0 auto; padding:36px 20px 80px; }

  /* ── Firm card ── */
  @keyframes mr-fade-in {
    from { opacity:0; transform:translateY(12px); }
    to { opacity:1; transform:translateY(0); }
  }
  @media(prefers-reduced-motion:reduce) {
    .mr-card-wrap { animation:none !important; }
  }

  .mr-card-wrap {
    margin-bottom:6px;
    animation:mr-fade-in .5s ease-out both;
    animation-delay:var(--delay, 0s);
  }

  .mr-card {
    background:var(--navy-2); border:1px solid rgba(255,255,255,0.06);
    display:grid; grid-template-columns:1fr auto;
    transition:border-color .3s, background .3s;
    text-decoration:none; position:relative; overflow:hidden;
    cursor:pointer;
  }
  .mr-card:hover {
    border-color:rgba(255,255,255,0.14);
    background:rgba(26,122,74,0.06);
  }
  .mr-card::before {
    content:''; position:absolute; top:0; bottom:0; left:0;
    width:2px; background:var(--green-3);
    transform:scaleY(0); transform-origin:center;
    transition:transform .3s;
  }
  .mr-card:hover::before { transform:scaleY(1); }

  .mr-card.expanded {
    border-color:rgba(45,189,116,0.25);
    background:rgba(26,122,74,0.04);
  }
  .mr-card.expanded::before { transform:scaleY(1); }

  /* Firm header row (logo + name) */
  .mr-firm-header {
    display:flex; align-items:center; gap:12px; margin-bottom:6px;
  }
  .mr-logo-inline {
    width:32px; height:32px; border-radius:6px;
    background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
    display:grid; place-items:center; overflow:hidden; flex-shrink:0;
  }
  .mr-logo-inline img {
    width:100%; height:100%; object-fit:contain; padding:3px;
  }
  .mr-logo-initials {
    font-family:var(--sans); font-size:10px; font-weight:700;
    color:rgba(255,255,255,0.35); letter-spacing:.02em;
  }

  .mr-card-body {
    padding:18px 20px; transition:transform .3s;
  }
  .mr-card:hover .mr-card-body { transform:translateX(4px); }
  .mr-card.expanded .mr-card-body { transform:translateX(4px); }

  .mr-firm-name {
    font-family:var(--serif); font-size:16px; font-weight:600;
    color:#fff; margin-bottom:3px;
  }
  .mr-firm-meta {
    font-family:var(--mono); font-size:10px;
    color:rgba(255,255,255,0.35); margin-bottom:10px;
  }
  .mr-badges { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px; }
  .mr-badge {
    font-family:var(--mono); font-size:9px; font-weight:700;
    letter-spacing:.08em; text-transform:uppercase;
    padding:2px 7px; display:inline-flex; align-items:center; gap:4px;
  }
  .mr-badge-dot {
    width:4px; height:4px; border-radius:50%; flex-shrink:0;
  }
  .mr-reasons { display:flex; flex-wrap:wrap; gap:6px; }
  .mr-reason {
    font-family:var(--mono); font-size:10px; font-weight:700;
    letter-spacing:.1em; text-transform:uppercase;
    color:var(--green-3); background:rgba(45,189,116,0.08);
    border:1px solid rgba(45,189,116,0.15); padding:2px 8px;
  }

  .mr-match-col {
    padding:18px 20px; display:flex; flex-direction:column;
    align-items:flex-end; justify-content:center;
    border-left:1px solid rgba(255,255,255,0.06); min-width:120px;
  }
  .mr-match-pct {
    font-family:var(--serif); font-size:32px; font-weight:700;
    color:var(--green-3); line-height:1; letter-spacing:-.02em;
  }
  .mr-match-label {
    font-family:var(--mono); font-size:9px; color:rgba(255,255,255,0.25);
    letter-spacing:.12em; text-transform:uppercase; margin-top:3px;
  }
  .mr-vvs {
    font-family:var(--mono); font-size:10px; color:rgba(255,255,255,0.35); margin-top:10px;
  }
  .mr-vvs-bar {
    width:100%; height:2px; background:rgba(255,255,255,0.08); margin-top:4px;
  }
  .mr-vvs-bar-fill { height:100%; transition:width .5s; }
  .mr-fee {
    font-family:var(--mono); font-size:11px; font-weight:500;
    color:rgba(255,255,255,0.45); margin-top:6px;
  }

  /* ── Expand toggle hint ── */
  .mr-expand-hint {
    font-family:var(--mono); font-size:9px; color:rgba(255,255,255,0.20);
    letter-spacing:.08em; text-transform:uppercase; margin-top:8px;
    transition:color .2s;
  }
  .mr-card:hover .mr-expand-hint { color:rgba(255,255,255,0.35); }

  /* ── Expanded detail panel ── */
  .mr-detail {
    background:var(--navy-2); border:1px solid rgba(45,189,116,0.25);
    border-top:none; padding:0 20px 20px;
    margin-top:-1px;
    display:grid; grid-template-columns:1fr 1fr; gap:20px;
    animation:mr-detail-in .25s ease-out;
  }
  @keyframes mr-detail-in {
    from { opacity:0; transform:translateY(-8px); }
    to { opacity:1; transform:translateY(0); }
  }

  .mr-detail-heading {
    font-family:var(--mono); font-size:9px; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase;
    color:rgba(255,255,255,0.25); margin:16px 0 12px; padding-bottom:6px;
    border-bottom:1px solid rgba(255,255,255,0.06);
  }

  .mr-breakdown { display:flex; flex-direction:column; gap:10px; }
  .mr-breakdown-row {
    display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center;
  }
  .mr-breakdown-label {
    font-family:var(--sans); font-size:11px; color:rgba(255,255,255,0.50);
  }
  .mr-breakdown-val {
    font-family:var(--mono); font-size:11px; font-weight:700; min-width:28px; text-align:right;
  }
  .mr-breakdown-track {
    grid-column:1 / -1; height:3px; background:rgba(255,255,255,0.06); margin-top:-4px;
  }
  .mr-breakdown-fill { height:100%; transition:width .4s ease-out; }

  .mr-reasoning {
    font-family:var(--sans); font-size:12px; line-height:1.7;
    color:rgba(255,255,255,0.40); margin-top:4px;
  }

  .mr-detail-actions {
    display:flex; gap:8px; margin-top:14px; flex-wrap:wrap;
  }
  .mr-detail-cta {
    display:inline-flex; align-items:center; gap:6px;
    font-family:var(--sans); font-size:12px; font-weight:600;
    color:var(--green-3); text-decoration:none;
    padding:10px 20px;
    border:1px solid rgba(45,189,116,0.25);
    transition:all .15s;
  }
  .mr-detail-cta:hover {
    background:var(--green); color:#fff; border-color:var(--green);
  }

  /* ── Save button (inline in card) ── */
  .mr-save-btn {
    display:inline-flex; align-items:center; gap:5px;
    font-family:var(--sans); font-size:11px; font-weight:600;
    letter-spacing:.04em; padding:6px 14px;
    background:transparent; cursor:pointer;
    transition:all .2s; border:none; outline:none;
  }
  .mr-save-btn.unsaved {
    border:1px solid rgba(255,255,255,0.12);
    color:rgba(255,255,255,0.5);
  }
  .mr-save-btn.unsaved:hover {
    border-color:rgba(45,189,116,0.4); color:var(--green-3);
  }
  .mr-save-btn.saved {
    border:1px solid rgba(45,189,116,0.3);
    background:rgba(45,189,116,0.07); color:var(--green-3);
  }
  .mr-save-btn:disabled { opacity:0.6; cursor:default; }

  /* ── Auth gate ── */
  .mr-gate-wrap { position:relative; }
  .mr-blurred { filter:blur(5px); pointer-events:none; user-select:none; }
  .mr-gate {
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    background:linear-gradient(180deg,
      rgba(10,28,42,0) 0%,
      rgba(10,28,42,0.6) 40%,
      rgba(10,28,42,0.95) 100%);
    padding:20px;
  }
  .mr-gate-card {
    background:var(--navy-2); border:1px solid rgba(255,255,255,0.09);
    border-top:2px solid var(--green);
    padding:36px 32px; text-align:center;
    max-width:440px; width:100%;
    box-shadow:0 8px 48px rgba(0,0,0,0.5);
  }
  .mr-gate-eyebrow {
    font-family:var(--mono); font-size:10px; font-weight:700;
    letter-spacing:.18em; text-transform:uppercase;
    color:var(--green-3); margin-bottom:14px;
  }
  .mr-gate-title {
    font-family:var(--serif); font-size:24px; font-weight:700;
    color:#fff; margin-bottom:10px; line-height:1.15;
  }
  .mr-gate-sub {
    font-family:var(--sans); font-size:13px; color:rgba(255,255,255,0.35);
    line-height:1.7; margin-bottom:24px;
    border-top:1px solid rgba(255,255,255,0.06); padding-top:16px;
  }
  .mr-gate-btns { display:flex; gap:10px; }
  .mr-gate-btn-primary {
    flex:1; padding:13px; background:var(--green); color:#fff;
    font-family:var(--sans); font-size:13px; font-weight:600;
    text-decoration:none; text-align:center; display:block;
    transition:background .15s;
  }
  .mr-gate-btn-primary:hover { background:var(--green-2); }
  .mr-gate-btn-secondary {
    flex:1; padding:13px; background:none;
    border:1px solid rgba(255,255,255,0.10); color:rgba(255,255,255,0.40);
    font-family:var(--sans); font-size:13px;
    text-decoration:none; text-align:center; display:block;
    transition:all .15s;
  }
  .mr-gate-btn-secondary:hover {
    border-color:rgba(255,255,255,0.30); color:#fff;
  }
  .mr-gate-trust {
    display:flex; align-items:center; justify-content:center;
    gap:8px; margin-top:16px;
    font-family:var(--sans); font-size:11px; color:rgba(255,255,255,0.20);
  }
  .mr-gate-trust-dot {
    width:5px; height:5px; border-radius:50%;
    background:var(--green-3); flex-shrink:0;
  }

  /* ── Loading ── */
  .mr-loading { padding:80px 24px; text-align:center; }
  .mr-spinner {
    width:28px; height:28px; border:2px solid rgba(255,255,255,0.08);
    border-top-color:var(--green-3); border-radius:50%;
    animation:mr-spin .8s linear infinite; margin:0 auto;
  }
  @keyframes mr-spin { to { transform:rotate(360deg); } }
  .mr-loading-label {
    font-family:var(--sans); font-size:13px; color:rgba(255,255,255,0.35); margin-top:16px;
  }

  /* ── Empty state ── */
  .mr-empty { padding:60px 24px; text-align:center; }
  .mr-empty-title {
    font-family:var(--serif); font-size:22px; font-weight:700;
    color:#fff; margin-bottom:8px;
  }
  .mr-empty-sub { font-family:var(--sans); font-size:13px; color:rgba(255,255,255,0.35); margin-bottom:24px; }

  /* ── Actions ── */
  .mr-actions {
    display:flex; gap:12px; justify-content:center;
    flex-wrap:wrap; padding-top:24px;
  }
  .mr-act-btn {
    font-family:var(--sans); font-size:12px; padding:10px 24px;
    border:1px solid rgba(255,255,255,0.10); color:rgba(255,255,255,0.45);
    background:none; cursor:pointer; text-decoration:none;
    display:inline-block; transition:all .15s;
  }
  .mr-act-btn:hover { border-color:rgba(255,255,255,0.30); color:#fff; }

  /* ── Mobile ── */
  @media(max-width:600px){
    .mr-hero { padding:44px 16px 36px; }
    .mr-body { padding:24px 16px 60px; }
    .mr-card { grid-template-columns:1fr; }
    .mr-card-body { padding:14px 16px; }
    .mr-card:hover .mr-card-body { transform:none; }
    .mr-card.expanded .mr-card-body { transform:none; }
    .mr-match-col {
      border-left:none; border-top:1px solid rgba(255,255,255,0.06);
      flex-direction:row; align-items:center; gap:10px;
      padding:10px 16px; min-width:0;
    }
    .mr-match-pct { font-size:22px; }
    .mr-match-label { margin-top:0; }
    .mr-detail { grid-template-columns:1fr; padding:0 16px 16px; }
    .mr-gate-card { padding:24px 20px; }
    .mr-gate-btns { flex-direction:column; }
    .mr-actions { flex-direction:column; align-items:stretch; }
    .mr-act-btn { text-align:center; }
    .mr-stats-strip { gap:16px; padding:20px 16px; }
    .mr-stat-value { font-size:15px; }
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
  if (value >= 1000) return `$${Math.round(value / 1000).toLocaleString()}K AUM`;
  return `$${value.toLocaleString()} AUM`;
}

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

/* ── Inline save button ── */
function SaveButton({ crd, isSaved, isAuthed }: { crd: number; isSaved: boolean; isAuthed: boolean | null }) {
  const [saved, setSaved] = useState(isSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setSaved(isSaved); }, [isSaved]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthed) {
      window.location.href = '/auth/signup';
      return;
    }
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
      className={`mr-save-btn ${saved ? 'saved' : 'unsaved'}`}
      onClick={handleToggle}
      disabled={loading}
      title={saved ? 'Remove from saved' : 'Save this firm'}
    >
      <svg width="11" height="11" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" viewBox="0 0 11 11">
        <path d="M2 1.5h7a.5.5 0 0 1 .5.5v7.5l-4-2.5L1.5 9.5V2a.5.5 0 0 1 .5-.5Z" />
      </svg>
      {loading ? '…' : saved ? 'Saved' : 'Save'}
    </button>
  );
}

/* ── Firm card ── */
interface FirmCardProps {
  firm: MatchedFirm;
  rank: number;
  badges: FirmBadge[];
  isExpanded: boolean;
  onToggle: () => void;
  isSaved: boolean;
  isAuthed: boolean | null;
}

function FirmCard({ firm, rank, badges, isExpanded, onToggle, isSaved, isAuthed }: FirmCardProps) {
  const breakdowns = [
    { label: 'Fee Competitiveness', value: firm.feeCompetitiveness },
    { label: 'Client Growth', value: firm.clientGrowth },
    { label: 'Advisor Bandwidth', value: firm.advisorBandwidth },
  ];

  const firmName = firm.displayName || firm.name;
  const initials = firmName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="mr-card-wrap" style={{ '--delay': `${rank * 0.06}s` } as React.CSSProperties}>
      <div
        className={`mr-card${isExpanded ? ' expanded' : ''}`}
        onClick={(e) => { e.preventDefault(); onToggle(); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <div className="mr-card-body">
          <div className="mr-firm-header">
            <div className="mr-logo-inline">
              {firm.logoKey ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/firm-logos/${firm.logoKey}`}
                  alt={`${firmName} logo`}
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = 'none';
                    el.parentElement!.querySelector('.mr-logo-initials')?.removeAttribute('style');
                  }}
                />
              ) : null}
              <span className="mr-logo-initials" style={firm.logoKey ? { display: 'none' } : undefined}>
                {initials}
              </span>
            </div>
            <div className="mr-firm-name">{firmName}</div>
          </div>
          <div className="mr-firm-meta">
            {firm.city}, {firm.state} &middot; {formatAUM(firm.aum)}
            {firm.estimatedFee && firm.estimatedFee !== 'Contact firm' && (
              <> &middot; Est. {firm.estimatedFee}</>
            )}
          </div>
          {badges.length > 0 && (
            <div className="mr-badges">
              {badges.map((b, i) => (
                <span
                  key={i}
                  className="mr-badge"
                  style={{ color: b.color, background: `${b.color}12`, border: `1px solid ${b.color}30` }}
                >
                  <span className="mr-badge-dot" style={{ background: b.color }} />
                  {b.label}
                </span>
              ))}
            </div>
          )}
          {firm.reasons.length > 0 && (
            <div className="mr-reasons">
              {firm.reasons.slice(0, 4).map((r, i) => (
                <span key={i} className="mr-reason">{r}</span>
              ))}
            </div>
          )}
          <div className="mr-expand-hint">
            {isExpanded ? '▾ Collapse' : '▸ View breakdown'}
          </div>
        </div>

        <div className="mr-match-col">
          <div className="mr-match-pct">{firm.matchPercent}%</div>
          <div className="mr-match-label">match</div>
          {firm.visorScore != null && (
            <div className="mr-vvs">
              VVS {firm.visorScore}
              <div className="mr-vvs-bar">
                <div
                  className="mr-vvs-bar-fill"
                  style={{ width: `${firm.visorScore}%`, background: scoreColor(firm.visorScore) }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expandable detail panel */}
      {isExpanded && (
        <div className="mr-detail">
          <div>
            <div className="mr-detail-heading">Score Breakdown</div>
            <div className="mr-breakdown">
              {breakdowns.map((b) => (
                <div key={b.label}>
                  <div className="mr-breakdown-row">
                    <span className="mr-breakdown-label">{b.label}</span>
                    <span className="mr-breakdown-val" style={{ color: scoreColor(b.value) }}>{b.value}</span>
                  </div>
                  <div className="mr-breakdown-track">
                    <div className="mr-breakdown-fill" style={{ width: `${b.value}%`, background: scoreColor(b.value) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mr-detail-heading">Why This Firm</div>
            <p className="mr-reasoning">{buildReasoning(firm)}</p>
            <div className="mr-detail-actions">
              <Link
                href={`/firm/${firm.crd}`}
                className="mr-detail-cta"
                onClick={(e) => e.stopPropagation()}
              >
                View Full Profile →
              </Link>
              <SaveButton crd={firm.crd} isSaved={isSaved} isAuthed={isAuthed} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchResultsPage() {
  const [answers, setAnswers] = useState<MatchAnswer | null>(null);
  const [firms, setFirms] = useState<MatchedFirm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [expandedCrd, setExpandedCrd] = useState<number | null>(null);
  const [savedCrds, setSavedCrds] = useState<Set<number>>(new Set());

  const badgeMap = useMemo(() => computeBadges(firms), [firms]);

  useEffect(() => {
    const saved = sessionStorage.getItem('matchAnswers');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAnswers(parsed);
      fetchMatchedFirms(parsed);
    } else {
      window.location.href = '/match';
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthed(!!user);
      if (user) {
        // Fetch saved firms for this user
        supabase
          .from('user_favorites')
          .select('crd')
          .eq('user_id', user.id)
          .then(({ data }) => {
            if (data) setSavedCrds(new Set(data.map((d: { crd: number }) => d.crd)));
          });
      }
    });
  }, []);

  async function fetchMatchedFirms(matchAnswers: MatchAnswer) {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      const params = new URLSearchParams({
        netWorth: matchAnswers.netWorth,
        lifeTrigger: matchAnswers.lifeTrigger,
        location: matchAnswers.location,
        priorities: matchAnswers.priorities.join(','),
        feeSensitivity: matchAnswers.feeSensitivity,
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

      // Fetch logos for all matched firms
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
    const nw = LABEL_MAP.netWorth[answers.netWorth];
    const lt = LABEL_MAP.lifeTrigger[answers.lifeTrigger];
    const loc = LABEL_MAP.location[answers.location];
    if (nw) chips.push(nw);
    if (lt) chips.push(lt);
    if (loc) chips.push(loc);
  }

  const avgMatch = firms.length > 0
    ? Math.round(firms.reduce((s, f) => s + f.matchPercent, 0) / firms.length)
    : 0;
  const firmsWithScore = firms.filter((f) => f.visorScore != null);
  const avgVisor = firmsWithScore.length > 0
    ? Math.round(firmsWithScore.reduce((s, f) => s + (f.visorScore ?? 0), 0) / firmsWithScore.length)
    : 0;

  function toggleCard(crd: number) {
    setExpandedCrd((prev) => (prev === crd ? null : crd));
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

      <div className="mr-hero">
        <div className="mr-hero-inner">
          <div className="mr-eyebrow">Advisor Match</div>
          <h1 className="mr-title">Your Top Advisor Matches</h1>
          <p className="mr-hero-sub">Ranked by how well each firm fits your profile</p>
          {chips.length > 0 && (
            <div className="mr-chips">
              {chips.map((c, i) => (
                <span key={i} className="mr-chip">{c}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {firms.length > 0 && (
        <div className="mr-stats-strip">
          <div className="mr-stat">
            <div className="mr-stat-value">{firms.length}<span>+</span></div>
            <div className="mr-stat-label">Matches Found</div>
          </div>
          <div className="mr-stat-divider" />
          <div className="mr-stat">
            <div className="mr-stat-value">{avgMatch}<span>%</span></div>
            <div className="mr-stat-label">Avg Match</div>
          </div>
          {avgVisor > 0 && (
            <>
              <div className="mr-stat-divider" />
              <div className="mr-stat">
                <div className="mr-stat-value">{avgVisor}<span>/100</span></div>
                <div className="mr-stat-label">Avg Visor Index</div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mr-body">
        {firms.length === 0 ? (
          <div className="mr-empty">
            <p className="mr-empty-title">No matches found</p>
            <p className="mr-empty-sub">Try adjusting your preferences for broader results.</p>
            <Link href="/match" className="mr-act-btn">Retake Questionnaire</Link>
          </div>
        ) : (
          <>
            <FirmCard
              firm={firms[0]}
              rank={1}
              badges={badgeMap.get(firms[0].crd) || []}
              isExpanded={expandedCrd === firms[0].crd}
              onToggle={() => toggleCard(firms[0].crd)}
              isSaved={savedCrds.has(firms[0].crd)}
              isAuthed={isAuthed}
            />

            {firms.length > 1 && (
              <div className="mr-gate-wrap">
                <div className={isAuthed === false ? 'mr-blurred' : undefined}>
                  {firms.slice(1, 10).map((firm, i) => (
                    <FirmCard
                      key={firm.crd}
                      firm={firm}
                      rank={i + 2}
                      badges={badgeMap.get(firm.crd) || []}
                      isExpanded={expandedCrd === firm.crd}
                      onToggle={() => toggleCard(firm.crd)}
                      isSaved={savedCrds.has(firm.crd)}
                      isAuthed={isAuthed}
                    />
                  ))}
                </div>

                {isAuthed === false && (
                  <div className="mr-gate">
                    <div className="mr-gate-card">
                      <div className="mr-gate-eyebrow">Free account required</div>
                      <p className="mr-gate-title">See all {Math.min(firms.length, 10)} matches</p>
                      <p className="mr-gate-sub">
                        Create a free Visor Index account to unlock your full ranked list,
                        fee estimates, and Visor Index™ for each match.
                      </p>
                      <div className="mr-gate-btns">
                        <Link href="/auth/signup" className="mr-gate-btn-primary">Get Started Free</Link>
                        <Link href="/auth/login" className="mr-gate-btn-secondary">Sign In</Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mr-actions">
              <Link href="/match" className="mr-act-btn">← Retake Questionnaire</Link>
              <Link href="/search" className="mr-act-btn">Browse All Firms</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
