'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { formatAUM, scoreColor } from '@/lib/utils';
import { FirmTable, FirmTableDetail } from '@/components/firms/table';
import type { FirmTableColumn, MobileDataItem, SortState, GateConfig } from '@/components/firms/table';

/* ── Types ── */

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

/* ── Helpers ── */

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
      existing.push({ label: 'Highest Visor Index', color: '#2DBD74' });
      map.set(best.crd, existing);
    }
  }

  return map;
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

/* ── Column definitions ── */

const matchColumns: FirmTableColumn<MatchedFirm>[] = [
  {
    key: 'match',
    label: 'Match',
    width: '80px',
    align: 'center',
    renderCell: (f) => (
      <div>
        <div className="font-serif text-[20px] font-bold text-[#2DBD74] leading-none tracking-[-0.02em]">
          {f.matchPercent}%
        </div>
        <div className="text-[8px] uppercase tracking-[0.1em] text-[#5A7568] font-mono mt-0.5">match</div>
      </div>
    ),
  },
  {
    key: 'visor',
    label: 'Visor',
    width: '80px',
    align: 'center',
    renderCell: (f) => {
      if (f.visorScore == null) return <span className="text-[10px] text-[#CAD8D0] font-mono">—</span>;
      return (
        <div>
          <div className="text-[14px] font-bold font-sans leading-none" style={{ color: scoreColor(f.visorScore) }}>
            {f.visorScore}
          </div>
          <div className="h-[2px] bg-[#CAD8D0] mt-1 mx-auto max-w-[48px] rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-[width] duration-500"
              style={{ width: `${f.visorScore}%`, background: scoreColor(f.visorScore) }}
            />
          </div>
        </div>
      );
    },
  },
  {
    key: 'fee',
    label: 'Est. Fee',
    width: '90px',
    align: 'center',
    renderCell: (f) => (
      <span className="text-[11px] font-medium text-[#5A7568] font-mono">
        {f.estimatedFee && f.estimatedFee !== 'Contact firm' ? f.estimatedFee : '—'}
      </span>
    ),
  },
];

const matchMobileData: MobileDataItem<MatchedFirm>[] = [
  {
    label: 'Match',
    renderValue: (f) => <span className="text-[#2DBD74]">{f.matchPercent}%</span>,
  },
  {
    label: 'Visor',
    renderValue: (f) => {
      if (f.visorScore == null) return '—';
      return <span style={{ color: scoreColor(f.visorScore) }}>{f.visorScore}</span>;
    },
  },
  { label: 'AUM', renderValue: (f) => formatAUM(f.aum) },
  {
    label: 'Fee',
    renderValue: (f) => f.estimatedFee && f.estimatedFee !== 'Contact firm' ? f.estimatedFee : '—',
  },
];

function matchSortComparator(state: SortState, a: MatchedFirm, b: MatchedFirm): number {
  let cmp = 0;
  switch (state.key) {
    case 'match': cmp = a.matchPercent - b.matchPercent; break;
    case 'visor': cmp = (a.visorScore ?? 0) - (b.visorScore ?? 0); break;
    case 'alpha': {
      const na = (a.displayName || a.name).toLowerCase();
      const nb = (b.displayName || b.name).toLowerCase();
      cmp = na < nb ? -1 : na > nb ? 1 : 0;
      break;
    }
    case 'fee': {
      const fa = parseFloat(a.estimatedFee?.replace(/[^0-9.]/g, '') || '999');
      const fb = parseFloat(b.estimatedFee?.replace(/[^0-9.]/g, '') || '999');
      cmp = fa - fb;
      break;
    }
  }
  return state.direction === 'desc' ? -cmp : cmp;
}

const matchGateConfig: GateConfig = {
  eyebrowText: 'Unlock All Matches',
  title: 'See your top matches, ranked without conflicts.',
  subtitle: 'You pay us, not the firms. That means every match is ranked by what\u2019s best for you. Get full results, fee breakdowns, and Visor Index scores.',
  primaryCta: { label: 'Get Full Access →', href: '/auth/signup' },
  secondaryCta: { label: 'View Pricing', href: '/pricing' },
  previewCount: 4,
};

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

/* ── Match detail panel ── */

function MatchDetailPanel({
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
    <FirmTableDetail
      leftContent={
        <>
          <h4 className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5A7568] mb-3 font-mono">
            Firm Details
          </h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#5A7568] font-sans">AUM</span>
              <span className="text-[#0C1810] font-semibold font-sans">{formatAUM(firm.aum)}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#5A7568] font-sans">Estimated Fee</span>
              <span className="text-[#0C1810] font-semibold font-sans">{firm.estimatedFee || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#5A7568] font-sans">Location</span>
              <span className="text-[#0C1810] font-semibold font-sans">{firm.city}, {firm.state}</span>
            </div>
            {firm.reasons.length > 0 && (
              <div className="mt-1">
                <div className="text-[#5A7568] font-sans text-[12px] mb-1">Match Tags</div>
                <div className="flex flex-wrap gap-1">
                  {firm.reasons.slice(0, 4).map((r, i) => (
                    <span
                      key={i}
                      className="text-[8px] font-bold uppercase tracking-[0.06em] text-[#2DBD74] bg-[rgba(45,189,116,0.08)] border border-[rgba(45,189,116,0.15)] px-1.5 py-0.5 font-mono"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      }
      rightContent={
        <>
          <h4 className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5A7568] mb-3 font-mono">
            Match Breakdown
          </h4>
          <div className="flex flex-col gap-2">
            {breakdowns.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-[#5A7568] font-sans">{b.label}</span>
                  <span className="text-[11px] font-bold font-mono min-w-[28px] text-right" style={{ color: scoreColor(b.value) }}>
                    {b.value}
                  </span>
                </div>
                <div className="h-[3px] bg-[#CAD8D0] rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-[width] duration-400 ease-out"
                    style={{ width: `${b.value}%`, background: scoreColor(b.value) }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[12px] leading-[1.7] text-[#5A7568] mt-3 font-sans">
            {buildReasoning(firm)}
          </p>
        </>
      }
      actions={
        <>
          <Link
            href={`/firm/${firm.crd}`}
            className="text-[11px] font-semibold text-[#0C1810] border border-[#CAD8D0] px-4 py-2 hover:border-[rgba(26,122,74,0.3)] hover:text-[#0C1810] transition-all font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            View Full Profile →
          </Link>
          <SaveButton crd={firm.crd} isSaved={isSaved} isAuthed={isAuthed} />
        </>
      }
    />
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

  const badgeMap = useMemo(() => computeBadges(firms), [firms]);

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

      {/* Stats strip */}
      {firms.length > 0 && isAuthed !== false && (
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

      {/* Firm table */}
      <div className="max-w-[960px] mx-auto px-6 py-8 max-sm:px-4 max-sm:py-5">
        <FirmTable<MatchedFirm>
          firms={firms}
          columns={matchColumns}
          getKey={(f) => f.crd}
          getFirmInfo={(f) => ({
            name: f.displayName || f.name,
            city: f.city,
            state: f.state,
            logoKey: f.logoKey,
            extra: (() => {
              const badges = badgeMap.get(f.crd) || [];
              if (badges.length === 0) return undefined;
              return (
                <div className="flex flex-wrap gap-1 mt-1">
                  {badges.map((b, i) => (
                    <span
                      key={i}
                      className="text-[8px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 inline-flex items-center gap-1 font-mono"
                      style={{ color: b.color, background: `${b.color}12`, border: `1px solid ${b.color}30` }}
                    >
                      <span className="w-[3px] h-[3px] rounded-full shrink-0" style={{ background: b.color }} />
                      {b.label}
                    </span>
                  ))}
                </div>
              );
            })(),
          })}
          renderDetail={(f, auth, saved) => (
            <MatchDetailPanel firm={f} isAuthed={auth} isSaved={saved} />
          )}
          mobileData={matchMobileData}
          sortComparator={matchSortComparator}
          defaultSort={{ key: 'match', direction: 'desc' }}
          gate={isAuthed === false ? matchGateConfig : null}
          isAuthed={isAuthed}
          savedKeys={savedCrds}
          logoWidth="40px"
          displayCount={10}
          loading={loading}
        />

        {/* Bottom actions */}
        {!loading && firms.length > 0 && (
          <div className="flex gap-3 justify-center flex-wrap pt-6 max-sm:flex-col max-sm:items-stretch">
            <Link
              href="/match"
              className="text-[12px] font-sans px-6 py-2.5 border border-[#CAD8D0] text-[#5A7568] hover:border-[#5A7568] hover:text-[#0C1810] transition-all text-center"
            >
              ← Retake Questionnaire
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
