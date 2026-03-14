'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const supabase = createSupabaseBrowserClient();

// ─── PROTECTED INTERFACES ─────────────────────────────────────────────────────
interface FirmBasic {
  crd: number;
  primary_business_name: string;
  display_name?: string | null;
}

interface FeeTier {
  min_aum: string | null;
  max_aum: number | null;
  fee_pct: number | null;
}

interface FirmComparison {
  crd: number;
  name: string;
  location: string;
  aum: string;
  aumRaw: number | null;
  employees: string;
  feeMin: string;
  wealthTier: string;
  clientBase: string;
  website: string;
  feeTiers: FeeTier[];
}

// ─── PROTECTED CONSTANTS & HELPERS ───────────────────────────────────────────
const INDUSTRY_MEDIANS = [
  { breakpoint: 500_000, median: 1.00 },
  { breakpoint: 1_000_000, median: 1.00 },
  { breakpoint: 5_000_000, median: 0.70 },
  { breakpoint: 10_000_000, median: 0.55 },
  { breakpoint: 25_000_000, median: 0.50 },
  { breakpoint: 50_000_000, median: 0.50 },
  { breakpoint: 100_000_000, median: 0.50 },
];

function getIndustryMedian(amount: number): number {
  let closest = INDUSTRY_MEDIANS[0];
  for (const bp of INDUSTRY_MEDIANS) {
    if (Math.abs(amount - bp.breakpoint) <= Math.abs(amount - closest.breakpoint)) closest = bp;
  }
  return closest.median;
}

function calcTieredFee(amount: number, tiers: FeeTier[]): number {
  if (tiers.length === 0) return 0;
  const sorted = [...tiers].filter(t => t.fee_pct != null).sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'));
  let totalFee = 0, remaining = amount;
  for (const tier of sorted) {
    if (remaining <= 0) break;
    const tierMin = parseInt(tier.min_aum || '0');
    const tierMax = tier.max_aum;
    const bracketSize = tierMax ? tierMax - tierMin : remaining;
    const taxable = Math.min(remaining, bracketSize);
    totalFee += taxable * (tier.fee_pct! / 100);
    remaining -= taxable;
  }
  return totalFee;
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function SectionHeader({ id, title, meta }: { id: string; title: string; meta: string }) {
  return (
    <div
      id={id}
      style={{
        display: 'grid',
        gridTemplateColumns: '188px repeat(4, 1fr)',
        padding: '28px 0 10px',
        borderBottom: '2px solid #0C1810',
        marginTop: 8,
      }}
    >
      <div style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 19,
        fontWeight: 700,
        color: '#0C1810',
        gridColumn: '1/-1',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
      }}>
        {title}
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 400, color: '#5A7568', letterSpacing: 0 }}>{meta}</span>
      </div>
    </div>
  );
}

function ScoreRow({
  label, tip, strong, scores,
}: {
  label: string; tip?: string; strong?: boolean; scores: (number | null)[];
}) {
  return (
    <div
      className="compare-ct-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '188px repeat(4, 1fr)',
        borderBottom: '1px solid #CAD8D0',
      }}
    >
      <div style={{
        padding: '13px 16px 13px 0',
        display: 'flex', alignItems: 'center', gap: 5,
        borderRight: '1px solid #CAD8D0',
        fontSize: 12, color: strong ? '#0C1810' : '#5A7568', fontWeight: strong ? 600 : 500,
      }}>
        {label}
        {tip && <span title={tip} style={{ fontSize: 10, color: '#CAD8D0', cursor: 'default' }}>ⓘ</span>}
      </div>
      {Array.from({ length: 4 }).map((_, col) => {
        const score = col < scores.length ? scores[col] : null;
        const scoreColor = score == null ? '#CAD8D0'
          : score >= 80 ? '#2DBD74'
          : score >= 50 ? '#F59E0B'
          : '#EF4444';
        return (
          <div key={col} style={{
            padding: '13px 20px',
            display: 'flex', alignItems: 'center',
            borderRight: col < 3 ? '1px solid #CAD8D0' : 'none',
          }}>
            {score != null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: strong ? 19 : 15, fontWeight: 700, width: 26, flexShrink: 0, lineHeight: 1, color: scoreColor }}>{score}</span>
                <div style={{ flex: 1, height: 3, background: '#CAD8D0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${score}%`, background: scoreColor }} />
                </div>
              </div>
            ) : (
              <span style={{ color: '#CAD8D0', fontSize: 18 }}>—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DataRow({ label, values, strong, serif }: {
  label: string; values: string[]; strong?: boolean; serif?: boolean;
}) {
  return (
    <div
      className="compare-ct-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '188px repeat(4, 1fr)',
        borderBottom: '1px solid #CAD8D0',
      }}
    >
      <div style={{
        padding: '13px 16px 13px 0',
        display: 'flex', alignItems: 'center',
        borderRight: '1px solid #CAD8D0',
        fontSize: 12, color: strong ? '#0C1810' : '#5A7568', fontWeight: strong ? 600 : 500,
      }}>
        {label}
      </div>
      {Array.from({ length: 4 }).map((_, col) => {
        const val = col < values.length ? values[col] : null;
        return (
          <div key={col} style={{
            padding: '13px 20px',
            display: 'flex', alignItems: 'center',
            borderRight: col < 3 ? '1px solid #CAD8D0' : 'none',
          }}>
            {val != null && val !== '—' ? (
              serif !== false ? (
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 700, color: '#0C1810' }}>{val}</span>
              ) : (
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#2E4438' }}>{val}</span>
              )
            ) : (
              <span style={{ color: '#CAD8D0', fontSize: 18 }}>—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ComparePage() {
  // ─── PROTECTED STATE ─────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const router = useRouter();
  const [results, setResults] = useState<FirmBasic[]>([]);
  const [selected, setSelected] = useState<FirmBasic[]>([]);
  const [comparisonData, setComparisonData] = useState<FirmComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [initialLoad, setInitialLoad] = useState(true);
  const [feeInput, setFeeInput] = useState('10,000,000');

  // ─── PRESENTATION STATE ───────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [activeSection, setActiveSection] = useState('vvs');
  const [showSearch, setShowSearch] = useState(false);

  // Session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  // ─── PROTECTED EFFECTS ────────────────────────────────────────────────────
  // Handle ?add=CRD parameter from firm profile Compare button
  useEffect(() => {
    if (!initialLoad) return;
    const params = new URLSearchParams(window.location.search);
    const addCrds = params.get('add');
    if (addCrds) {
      const crds = addCrds.split(',').map(c => parseInt(c)).filter(c => !isNaN(c));
      if (crds.length > 0) {
        Promise.all([
          supabase.from('firmdata_current').select('crd, primary_business_name').in('crd', crds),
          supabase.from('firm_names').select('crd, display_name').in('crd', crds),
        ]).then(([{ data }, { data: names }]) => {
          if (data && data.length > 0) {
            const nameMap = new Map((names || []).map(n => [n.crd, n.display_name]));
            const firms = data.map(d => ({ crd: d.crd, primary_business_name: d.primary_business_name!, display_name: nameMap.get(d.crd) || null }));
            setSelected(firms.slice(0, 4));
          }
        });
        router.replace('/compare');
      }
    }
    setInitialLoad(false);
  }, [initialLoad, router]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('firmdata_current')
        .select('crd, primary_business_name')
        .ilike('primary_business_name', `%${query}%`)
        .limit(10);
      if (!data) { setResults([]); return; }
      const crds = data.map(d => d.crd);
      const { data: names } = await supabase.from('firm_names').select('crd, display_name').in('crd', crds);
      const nameMap = new Map((names || []).map(n => [n.crd, n.display_name]));
      setResults(data.filter(d => d.primary_business_name).map(d => ({
        crd: d.crd,
        primary_business_name: d.primary_business_name!,
        display_name: nameMap.get(d.crd) || null,
      })) as FirmBasic[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch comparison data when selected changes
  const fetchComparison = useCallback(async () => {
    if (selected.length === 0) { setComparisonData([]); return; }
    setLoading(true);
    const data: FirmComparison[] = [];
    for (const firm of selected) {
      const [{ data: current }, { data: fees }, { data: profile }, { data: web }] = await Promise.all([
        supabase.from('firmdata_current').select('aum, employee_total, main_office_city, main_office_state').eq('crd', firm.crd).single(),
        supabase.from('firmdata_feetiers').select('fee_pct, min_aum').eq('crd', firm.crd),
        supabase.from('firmdata_profile_text').select('wealth_tier, client_base').eq('crd', firm.crd).single(),
        supabase.from('firmdata_website').select('website').eq('crd', firm.crd).single(),
      ]);
      const minFee = fees && fees.length > 0
        ? Math.min(...fees.filter((f: { fee_pct: number | null }) => f.fee_pct != null).map((f: { fee_pct: number | null }) => f.fee_pct!))
        : null;
      data.push({
        crd: firm.crd,
        name: firm.display_name || firm.primary_business_name,
        location: current ? `${current.main_office_city || ''}, ${current.main_office_state || ''}` : 'N/A',
        aum: formatAUM(current?.aum),
        aumRaw: current?.aum || null,
        employees: current?.employee_total?.toLocaleString() || 'N/A',
        feeMin: minFee != null ? `${minFee}%` : 'N/A',
        wealthTier: profile?.wealth_tier || 'N/A',
        clientBase: profile?.client_base || 'N/A',
        website: web?.website || 'N/A',
        feeTiers: (fees || []) as FeeTier[],
      });
    }
    setComparisonData(data);
    setLoading(false);
  }, [selected]);

  useEffect(() => { fetchComparison(); }, [fetchComparison]);

  // ─── PROTECTED HANDLERS ───────────────────────────────────────────────────
  const addFirm = (firm: FirmBasic) => {
    if (selected.length >= 4 || selected.some(s => s.crd === firm.crd)) return;
    setSelected([...selected, firm]);
    setQuery('');
    setResults([]);
    setShowSearch(false);
  };

  const removeFirm = (crd: number) => {
    setSelected(selected.filter(s => s.crd !== crd));
  };

  // IntersectionObserver for jump nav
  useEffect(() => {
    const ids = ['vvs', 'aum', 'clients', 'regulatory', 'fees'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.1, rootMargin: '-100px 0px -60% 0px' }
    );
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [comparisonData, session]);

  // ─── FEE CALCULATOR DERIVED VALUES ───────────────────────────────────────
  const feeAmount = parseInt(feeInput.replace(/[^0-9]/g, ''), 10) || 0;
  const industryMedian = getIndustryMedian(feeAmount || 10_000_000);
  const PEER_RATE = 0.0102;
  const GROSS_RETURN = 0.07;

  function growNet(a: number, g: number, fr: number, y: number) {
    return a * Math.pow(1 + g - fr, y);
  }

  const isGated = session === null;

  const jumpLinks = [
    { id: 'vvs', label: 'Visor Score™' },
    { id: 'aum', label: 'AUM & Growth' },
    { id: 'clients', label: 'Client Profile' },
    { id: 'regulatory', label: 'Regulatory' },
    { id: 'fees', label: 'Fee Calculator' },
  ];

  const feeDisplayStr = feeAmount >= 1e9
    ? `$${(feeAmount / 1e9).toFixed(1)}B`
    : feeAmount >= 1e6
    ? `$${(feeAmount / 1e6).toFixed(1)}M`
    : feeAmount >= 1e3
    ? `$${(feeAmount / 1e3).toFixed(0)}K`
    : '—';

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style suppressHydrationWarning>{`
        .compare-page { background: #F6F8F7; color: #0C1810; }
        .compare-ct-row:hover { background: rgba(26,122,74,.028); }
        .jn-link { font-size: 11px; font-weight: 500; color: rgba(255,255,255,.3); padding: 11px 20px 11px 0; margin-right: 4px; white-space: nowrap; text-decoration: none; border-bottom: 2px solid transparent; transition: all .15s; letter-spacing: .04em; display: inline-block; }
        .jn-link:hover { color: rgba(255,255,255,.65); }
        .jn-link.on { color: #2DBD74; border-bottom-color: #2DBD74; }
        .gate-content-wrap { pointer-events: none; user-select: none; position: relative; }
        .gate-content-wrap::after { content: ''; position: absolute; inset: 0; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); -webkit-mask-image: linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.5) 12%,rgba(0,0,0,1) 28%,rgba(0,0,0,1) 100%); mask-image: linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.5) 12%,rgba(0,0,0,1) 28%,rgba(0,0,0,1) 100%); pointer-events: none; z-index: 2; }
        .gate-content-wrap { -webkit-mask-image: linear-gradient(to bottom,rgba(0,0,0,1) 0%,rgba(0,0,0,1) 22%,rgba(0,0,0,.4) 45%,rgba(0,0,0,0) 65%); mask-image: linear-gradient(to bottom,rgba(0,0,0,1) 0%,rgba(0,0,0,1) 22%,rgba(0,0,0,.4) 45%,rgba(0,0,0,0) 65%); }
        .fh-remove-btn { background: none; border: none; cursor: pointer; color: rgba(255,255,255,.2); font-size: 15px; line-height: 1; flex-shrink: 0; padding: 0 2px; transition: color .15s; margin-left: auto; }
        .fh-remove-btn:hover { color: rgba(255,255,255,.7); }
        .fh-add-slot { opacity: 0.3; transition: opacity .2s; }
        .fh-add-slot:hover { opacity: 0.65; }
        .fee-slider-input { -webkit-appearance: none; appearance: none; width: 100%; height: 2px; background: #CAD8D0; outline: none; cursor: pointer; }
        .fee-slider-input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #1A7A4A; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #1A7A4A; cursor: pointer; }
        .fee-slider-input::-moz-range-thumb { width: 16px; height: 16px; background: #1A7A4A; border-radius: 50%; border: 2px solid #fff; cursor: pointer; }
        .search-result-btn { display: block; width: 100%; text-align: left; padding: 10px 14px; background: #fff; border: none; border-bottom: 1px solid #CAD8D0; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #0C1810; transition: background .1s; }
        .search-result-btn:hover, .search-result-btn.active { background: rgba(26,122,74,.06); }
        .gc-cta-link { display: flex; width: 100%; align-items: center; justify-content: center; gap: 10px; background: #1A7A4A; color: #fff; padding: 15px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; text-decoration: none; transition: background .15s; margin-bottom: 12px; }
        .gc-cta-link:hover { background: #22995E; }

        /* ── Mobile responsive ────────────────────────────────────────── */
        @media (max-width: 768px) {
          .compare-page .cp-header-wrap { padding: 24px 16px 0 !important; }
          .compare-page .cp-header-wrap .cp-jump-nav { margin: 0 -16px !important; padding: 0 16px !important; overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .compare-page .cp-firm-header { padding: 0 16px !important; }
          .compare-page .cp-table-wrap { padding: 0 0 32px !important; }
          .compare-page .cp-fee-section { padding: 0 16px !important; margin-bottom: 40px !important; }
          .compare-page .cp-fee-body { grid-template-columns: 1fr !important; }
          .compare-page .cp-fee-input-row { flex-direction: column !important; gap: 12px !important; padding: 16px !important; }
          .compare-page .cp-fee-input-row .cp-slider-wrap { width: 100% !important; }
          .compare-page .cp-gate-card { top: 120px !important; padding: 28px 20px !important; max-width: calc(100% - 32px) !important; }
          .compare-page .cp-gate-perks { padding: 12px 14px !important; }
          .compare-page .cp-gate-firms { flex-direction: column !important; }
          .compare-page .cp-gate-firms > div { border-right: none !important; border-bottom: 1px solid #CAD8D0; }
          .compare-page .cp-gate-firms > div:last-child { border-bottom: none; }
          .compare-page .cp-empty-state { padding: 48px 16px !important; }
          .compare-page .cp-search-modal-inner { margin: 0 16px; }
        }
      `}</style>

      <div className="compare-page" style={{ minHeight: '100vh' }}>

        {/* ── PAGE HEADER (dark navy) ─────────────────────────────────────── */}
        <div className="cp-header-wrap" style={{ background: '#0A1C2A', padding: '32px 48px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: '#2DBD74', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 1, background: '#2DBD74', display: 'inline-block' }} />
              Side-by-Side Comparison
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 700, color: '#fff', letterSpacing: '-.02em', marginBottom: 4 }}>
              Compare Firms
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginBottom: 22 }}>
              Up to 4 firms · Scores, fees, growth, and client profile
            </p>
            {/* Jump nav */}
            <div className="cp-jump-nav" style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,.07)', margin: '0 -48px', padding: '0 48px' }}>
              {jumpLinks.map(link => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className={`jn-link${activeSection === link.id ? ' on' : ''}`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── GATE WRAP ───────────────────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <div className={isGated ? 'gate-content-wrap' : ''}>

            {/* ── STICKY FIRM HEADER ───────────────────────────────────── */}
            <div style={{
              position: 'sticky', top: 52, zIndex: 500,
              background: '#0A1C2A',
              borderBottom: '2px solid rgba(255,255,255,.07)',
              boxShadow: '0 4px 20px rgba(0,0,0,.15)',
              overflowX: 'auto',
            }}>
              <div className="cp-firm-header" style={{
                display: 'grid',
                gridTemplateColumns: '188px repeat(4, 1fr)',
                maxWidth: 1200, margin: '0 auto',
                padding: '0 48px',
                minWidth: 700,
              }}>
                {/* Gutter label */}
                <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,.07)' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)' }}>
                    {selected.length} {selected.length === 1 ? 'firm' : 'firms'}
                  </span>
                </div>

                {/* Filled firm slots */}
                {Array.from({ length: 4 }).map((_, col) => {
                  const firm = col < comparisonData.length ? comparisonData[col] : null;
                  const sel = col < selected.length ? selected[col] : null;
                  const isLast = col === 3;

                  if (firm || sel) {
                    const displayName = firm?.name || sel?.display_name || sel?.primary_business_name || '';
                    const crd = firm?.crd || sel?.crd;
                    return (
                      <div key={col} style={{
                        padding: '14px 20px',
                        borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,.07)',
                        display: 'flex', alignItems: 'center', gap: 10,
                        position: 'relative', minWidth: 0,
                      }}>
                        <div style={{
                          width: 28, height: 28, flexShrink: 0,
                          background: 'rgba(255,255,255,.07)',
                          border: '1px solid rgba(255,255,255,.1)',
                          display: 'grid', placeItems: 'center',
                          fontFamily: 'Cormorant Garamond, serif',
                          fontSize: 11, fontWeight: 700,
                          color: 'rgba(255,255,255,.5)',
                        }}>
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>
                          {displayName}
                        </span>
                        <button
                          className="fh-remove-btn"
                          onClick={() => crd && removeFirm(crd)}
                        >×</button>
                      </div>
                    );
                  }

                  // Empty slot
                  return (
                    <div
                      key={col}
                      className="fh-add-slot"
                      onClick={() => !isGated && setShowSearch(true)}
                      style={{
                        padding: '14px 20px',
                        borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        cursor: isGated ? 'default' : 'pointer',
                      }}
                    >
                      <div style={{ width: 22, height: 22, border: '1px solid rgba(255,255,255,.35)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 10 10">
                          <line x1="5" y1="1" x2="5" y2="9" /><line x1="1" y1="5" x2="9" y2="5" />
                        </svg>
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap' }}>Add a firm</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: '#5A7568', fontFamily: 'DM Mono, monospace', letterSpacing: '.08em' }}>
                Loading comparison data…
              </div>
            )}

            {/* ── COMPARISON TABLE ─────────────────────────────────────── */}
            <div className="cp-table-wrap" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px 48px', overflowX: 'auto' }}>
              <div style={{ minWidth: 700 }}>

                {/* VISOR SCORE™ */}
                <SectionHeader id="vvs" title="Visor Value Score™" meta="Based on SEC ADV · Updated 2025" />
                <ScoreRow label="Overall Score" strong scores={comparisonData.map(() => null)} />
                <ScoreRow label="Disclosure Quality" tip="Completeness and clarity of ADV filings including brochure quality and update frequency." scores={comparisonData.map(() => null)} />
                <ScoreRow label="Fee Transparency" tip="How explicitly the firm discloses its fee structure, tiers, and billing practices." scores={comparisonData.map(() => null)} />
                <ScoreRow label="Fee Competitiveness" tip="Fees benchmarked against peers of similar AUM and client profile." scores={comparisonData.map(() => null)} />
                <ScoreRow label="Conflict-Free" tip="Conflicts of interest including referral arrangements and third-party compensation." scores={comparisonData.map(() => null)} />
                <ScoreRow label="AUM Growth" tip="AUM growth rate over 3 and 5 years vs. peer median." scores={comparisonData.map(() => null)} />
                <ScoreRow label="Advisor Bandwidth" tip="Ratio of clients to advisory staff — lower is better for client attention." scores={comparisonData.map(() => null)} />
                <ScoreRow label="Derivatives Risk" tip="Use of complex instruments such as options or leveraged products in client portfolios." scores={comparisonData.map(() => null)} />

                {/* AUM & GROWTH */}
                <SectionHeader id="aum" title="AUM & Growth" meta="SEC ADV · Annual filings" />
                <DataRow label="Current AUM" strong values={comparisonData.map(f => f.aum)} />
                <DataRow label="1-Year Growth" values={comparisonData.map(() => '—')} serif={false} />
                <DataRow label="5-Year Growth" values={comparisonData.map(() => '—')} serif={false} />
                <DataRow label="AUM per Advisor" values={comparisonData.map(() => '—')} serif={false} />
                <DataRow label="Employees" values={comparisonData.map(f => f.employees)} serif={false} />

                {/* CLIENT PROFILE */}
                <SectionHeader id="clients" title="Client Profile" meta="ADV Part 1 · Schedule D" />
                <DataRow label="Wealth Tier" values={comparisonData.map(f => f.wealthTier)} serif={false} />
                <DataRow label="Client Base" values={comparisonData.map(f => f.clientBase)} serif={false} />
                <DataRow label="Total Clients" values={comparisonData.map(() => '—')} serif={false} />
                <DataRow label="Avg. Client Size" values={comparisonData.map(() => '—')} />
                <DataRow label="Minimum Account" values={comparisonData.map(() => '—')} />
                <DataRow label="Location" values={comparisonData.map(f => f.location)} serif={false} />

                {/* REGULATORY */}
                <SectionHeader id="regulatory" title="Regulatory & Conflicts" meta="IAPD · SEC EDGAR · ADV Part 2A" />
                <DataRow label="Fee Structure" values={comparisonData.map(f => f.feeMin)} serif={false} />
                <DataRow label="Disciplinary History" values={comparisonData.map(() => '—')} serif={false} />
                <DataRow label="Affiliated Businesses" values={comparisonData.map(() => '—')} serif={false} />
                <DataRow label="PE / Inst. Ownership" values={comparisonData.map(() => '—')} serif={false} />
                <DataRow label="Proprietary Products" values={comparisonData.map(() => '—')} serif={false} />
                <DataRow label="12b-1 / Trail Fees" values={comparisonData.map(() => '—')} serif={false} />

              </div>
            </div>

            {/* ── FEE CALCULATOR ───────────────────────────────────────── */}
            <div id="fees" className="cp-fee-section" style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 48px' }}>
              <div style={{ padding: '28px 0 10px', borderBottom: '2px solid #0C1810', marginBottom: 24, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 19, fontWeight: 700, color: '#0C1810' }}>Fee Calculator</span>
                <span style={{ fontSize: 10, color: '#5A7568' }}>Enter your portfolio value to compare estimated fees across all firms</span>
              </div>

              {/* Full-width input row */}
              <div className="cp-fee-input-row" style={{ background: '#fff', border: '1px solid #CAD8D0', borderTop: '2px solid #1A7A4A', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5A7568', whiteSpace: 'nowrap' }}>Portfolio Value</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CAD8D0', background: '#F6F8F7', flexShrink: 0 }}>
                  <span style={{ padding: '0 12px', fontFamily: 'Cormorant Garamond, serif', fontSize: 19, color: '#5A7568', borderRight: '1px solid #CAD8D0', lineHeight: '44px' }}>$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={feeInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, '');
                      if (!digits) { setFeeInput(''); return; }
                      let num = parseInt(digits, 10);
                      if (num > 1_000_000_000) num = 1_000_000_000;
                      setFeeInput(num.toLocaleString('en-US'));
                    }}
                    style={{ border: 'none', background: 'none', outline: 'none', fontFamily: 'DM Mono, monospace', fontSize: 14, color: '#0C1810', padding: '10px 14px', width: 180 }}
                  />
                </div>
                <div className="cp-slider-wrap" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input
                    type="range"
                    className="fee-slider-input"
                    min={5_000_000}
                    max={50_000_000}
                    step={500_000}
                    value={Math.min(Math.max(feeAmount || 10_000_000, 5_000_000), 50_000_000)}
                    onChange={(e) => {
                      const num = parseInt(e.target.value);
                      setFeeInput(num.toLocaleString('en-US'));
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5A7568' }}>
                    <span>$5M</span><span>$15M</span><span>$25M</span><span>$35M</span><span>$50M+</span>
                  </div>
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, color: '#0C1810', whiteSpace: 'nowrap', minWidth: 80 }}>
                  {feeDisplayStr}
                </div>
              </div>

              {/* Two-column fee body */}
              {comparisonData.length > 0 && feeAmount > 0 ? (
                <div className="cp-fee-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#CAD8D0', border: '1px solid #CAD8D0' }}>

                  {/* Left: fee bars */}
                  <div style={{ background: '#fff', padding: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      Annual Fee by Firm
                      <span style={{ flex: 1, height: 1, background: '#CAD8D0', display: 'inline-block' }} />
                    </div>
                    {comparisonData.map(firm => {
                      const annual = firm.feeTiers.length > 0 ? calcTieredFee(feeAmount, firm.feeTiers) : feeAmount * (industryMedian / 100);
                      const rate = feeAmount > 0 ? annual / feeAmount : 0;
                      const above = rate > PEER_RATE;
                      const barW = Math.min((rate * 100) / 1.6 * 100, 100);
                      const barColor = above ? '#F59E0B' : '#1A7A4A';
                      const diff = (Math.abs(rate - PEER_RATE) * 100).toFixed(2);
                      const rateStr = (rate * 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
                      return (
                        <div key={firm.crd} style={{ marginBottom: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#0C1810' }}>{firm.name}</span>
                            <div>
                              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 700, color: '#0C1810' }}>{formatCompact(annual)}</span>
                              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5A7568', marginLeft: 4 }}>({rateStr}%)</span>
                            </div>
                          </div>
                          <div style={{ height: 6, background: '#CAD8D0', borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${barW}%`, background: barColor, transition: 'width .5s cubic-bezier(.16,1,.3,1)' }} />
                          </div>
                          <div style={{ fontSize: 10, height: 14, color: barColor }}>{diff}% {above ? 'above' : 'below'} peer median</div>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: 14, fontSize: 10, color: '#5A7568', paddingTop: 16, borderTop: '1px solid #CAD8D0', marginTop: 16, flexWrap: 'wrap' }}>
                      <span>Peer median ({(PEER_RATE * 100).toFixed(2)}%)</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1A7A4A', flexShrink: 0, display: 'inline-block' }} />
                        Below median
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', flexShrink: 0, display: 'inline-block' }} />
                        Above median
                      </span>
                    </div>
                  </div>

                  {/* Right: projection tables */}
                  <div style={{ background: '#fff', padding: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      Portfolio Impact Over Time
                      <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10, color: '#5A7568' }}>(7% annual return)</span>
                      <span style={{ flex: 1, height: 1, background: '#CAD8D0', display: 'inline-block' }} />
                    </div>

                    {[10, 20].map(yr => {
                      const noFeeValue = feeAmount * Math.pow(1 + GROSS_RETURN, yr);
                      const projRows = comparisonData.map(firm => {
                        const annual = firm.feeTiers.length > 0 ? calcTieredFee(feeAmount, firm.feeTiers) : feeAmount * (industryMedian / 100);
                        const rate = feeAmount > 0 ? annual / feeAmount : 0;
                        const value = growNet(feeAmount, GROSS_RETURN, rate, yr);
                        return { firm, annual, value };
                      });
                      const bestValue = Math.max(...projRows.map(r => r.value));

                      return (
                        <div key={yr} style={{ marginBottom: 24 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#2E4438', marginBottom: 8 }}>
                            {yr}-Year Projection
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                {['Firm', 'Annual Fee', 'Portfolio Value', 'Fees Paid'].map(h => (
                                  <th key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.13em', textTransform: 'uppercase', color: '#5A7568', padding: '6px 8px', borderBottom: '1px solid #CAD8D0', textAlign: h === 'Firm' ? 'left' : 'right' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {projRows.map(({ firm, annual, value }) => {
                                const isBest = value === bestValue;
                                return (
                                  <tr key={firm.crd}>
                                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #CAD8D0', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: isBest ? 600 : 500, color: isBest ? '#1A7A4A' : '#0C1810' }}>{firm.name}</td>
                                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #CAD8D0', fontFamily: 'DM Mono, monospace', fontSize: 11, color: isBest ? '#1A7A4A' : '#2E4438', textAlign: 'right' }}>{formatCompact(annual)}</td>
                                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #CAD8D0', fontFamily: 'DM Mono, monospace', fontSize: 11, color: isBest ? '#1A7A4A' : '#2E4438', textAlign: 'right' }}>{formatCompact(value)}</td>
                                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #CAD8D0', fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#DC2626', textAlign: 'right' }}>−{formatCompact(noFeeValue - value)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}

                    <div style={{ fontSize: 10, color: '#5A7568', lineHeight: 1.6, fontStyle: 'italic', paddingTop: 14, borderTop: '1px solid #CAD8D0', marginTop: 14 }}>
                      Estimates based on disclosed fee schedules. Actual fees may be negotiated and will vary. Peer comparison uses national median for fee-only advisors at equivalent AUM. Projections assume a constant blended fee rate and 7% gross annual return.
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid #CAD8D0', padding: '48px 24px', textAlign: 'center', color: '#5A7568', fontSize: 13 }}>
                  {comparisonData.length === 0 ? 'Add firms above to compare fees' : 'Enter a portfolio value above to see the fee comparison'}
                </div>
              )}
            </div>

          </div>{/* /gate-content-wrap */}

          {/* Gate overlay */}
          {isGated && (
            <>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '54%', background: '#F6F8F7', pointerEvents: 'none', zIndex: 5 }} />

              {/* Gate card */}
              <div className="cp-gate-card" style={{
                position: 'absolute', top: 220, left: '50%', transform: 'translateX(-50%)',
                width: '100%', maxWidth: 520,
                background: '#fff', border: '1px solid #CAD8D0', borderTop: '2px solid #0A1C2A',
                boxShadow: '0 32px 80px rgba(10,28,42,.13), 0 4px 20px rgba(10,28,42,.07)',
                padding: '40px 44px', textAlign: 'center', zIndex: 50,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#2DBD74', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <span style={{ width: 20, height: 1, background: '#2DBD74', display: 'inline-block' }} />
                  Free to join
                  <span style={{ width: 20, height: 1, background: '#2DBD74', display: 'inline-block' }} />
                </div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 700, color: '#0C1810', letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 10 }}>
                  Unlock the full comparison
                </h2>
                <p style={{ fontSize: 13, color: '#5A7568', lineHeight: 1.75, maxWidth: 380, margin: '0 auto 24px' }}>
                  See scores, fees, AUM growth, client profile, regulatory history, and fee impact across all firms — side by side.
                </p>

                {/* Firm teaser row */}
                <div className="cp-gate-firms" style={{ display: 'flex', border: '1px solid #CAD8D0', marginBottom: 24 }}>
                  {selected.length > 0 ? selected.slice(0, 4).map((firm, i) => (
                    <div key={firm.crd} style={{ flex: 1, padding: '12px 14px', borderRight: i < selected.length - 1 ? '1px solid #CAD8D0' : 'none', textAlign: 'center' }}>
                      <div style={{ width: 26, height: 26, background: '#0A1C2A', display: 'grid', placeItems: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.45)', margin: '0 auto 5px' }}>
                        {(firm.display_name || firm.primary_business_name).slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#0C1810', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(firm.display_name || firm.primary_business_name).split(' ')[0]}
                      </div>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#2DBD74' }}>Score —</div>
                    </div>
                  )) : (
                    <div style={{ flex: 1, padding: '16px 14px', textAlign: 'center', color: '#CAD8D0', fontSize: 12 }}>
                      Search for firms to compare
                    </div>
                  )}
                </div>

                {/* Perks */}
                <div className="cp-gate-perks" style={{ display: 'flex', flexDirection: 'column', gap: 7, textAlign: 'left', marginBottom: 24, padding: '14px 18px', background: '#F6F8F7', border: '1px solid #CAD8D0' }}>
                  {[
                    'Full Visor Value Score™ breakdown across 8 sub-metrics',
                    'AUM growth, client profile, and advisor bandwidth data',
                    'Regulatory history, conflict flags, and ownership structure',
                    'Fee Calculator — 10 & 20-year compounding impact side by side',
                  ].map(perk => (
                    <div key={perk} style={{ fontSize: 12, color: '#5A7568', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5 }}>
                      <span style={{ color: '#1A7A4A', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {perk}
                    </div>
                  ))}
                </div>

                <Link href="/auth/signup" className="gc-cta-link">
                  Create Free Account <span style={{ fontSize: 16 }}>→</span>
                </Link>
                <div style={{ fontSize: 11, color: '#5A7568' }}>
                  Already have an account?{' '}
                  <Link href="/auth/login" style={{ color: '#0C1810', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid #CAD8D0' }}>Sign in</Link>
                </div>
              </div>

              <div style={{ height: 580 }} />
            </>
          )}
        </div>{/* /gate-wrap */}

        {/* ── EMPTY STATE (signed in, no firms) ──────────────────────────── */}
        {!isGated && session !== undefined && selected.length === 0 && !showSearch && (
          <div className="cp-empty-state" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 48px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, border: '1px solid #CAD8D0', display: 'grid', placeItems: 'center', margin: '0 auto 24px', opacity: 0.5 }}>
              <svg width="22" height="22" fill="none" stroke="#5A7568" strokeWidth="1.5" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="9" /><line x1="11" y1="7" x2="11" y2="15" /><line x1="7" y1="11" x2="15" y2="11" />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, color: '#0C1810', marginBottom: 8 }}>No firms selected</h2>
            <p style={{ fontSize: 13, color: '#5A7568', lineHeight: 1.75, marginBottom: 28 }}>
              Search for up to 4 firms to compare their scores, fees, and client profile side by side.
            </p>
            <button
              onClick={() => setShowSearch(true)}
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#fff', background: '#1A7A4A', border: 'none', padding: '12px 28px', cursor: 'pointer' }}
            >
              Search Firms →
            </button>
          </div>
        )}

        {/* ── SEARCH MODAL ─────────────────────────────────────────────────── */}
        {showSearch && !isGated && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,28,42,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120 }}
            onClick={e => { if (e.target === e.currentTarget) { setShowSearch(false); setQuery(''); setResults([]); } }}
          >
            <div className="cp-search-modal-inner" style={{ background: '#fff', width: '100%', maxWidth: 520, border: '1px solid #CAD8D0', borderTop: '2px solid #1A7A4A', padding: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 12 }}>Add a Firm to Compare</div>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(-1); }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, results.length - 1)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, -1)); }
                  else if (e.key === 'Enter' && selectedIndex >= 0) { e.preventDefault(); if (results[selectedIndex] && selected.length < 4) addFirm(results[selectedIndex]); }
                  else if (e.key === 'Escape') { setShowSearch(false); setQuery(''); setResults([]); }
                }}
                placeholder="Search firms by name…"
                style={{ width: '100%', border: '1px solid #CAD8D0', background: '#F6F8F7', padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#0C1810', outline: 'none', marginBottom: 4 }}
              />
              {results.length > 0 && (
                <div style={{ border: '1px solid #CAD8D0', maxHeight: 240, overflowY: 'auto' }}>
                  {results.map((r, idx) => (
                    <button
                      key={r.crd}
                      onClick={() => addFirm(r)}
                      className={`search-result-btn${idx === selectedIndex ? ' active' : ''}`}
                    >
                      {r.display_name || r.primary_business_name}
                      <span style={{ color: '#CAD8D0', fontSize: 11, marginLeft: 8 }}>#{r.crd}</span>
                    </button>
                  ))}
                </div>
              )}
              {query.length >= 2 && results.length === 0 && (
                <p style={{ fontSize: 12, color: '#5A7568', padding: '10px 0' }}>No results for &ldquo;{query}&rdquo;</p>
              )}
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {selected.map(firm => (
                  <div key={firm.crd} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1A7A4A', background: '#E6F4ED', border: '1px solid rgba(26,122,74,.25)', padding: '4px 10px' }}>
                    {firm.display_name || firm.primary_business_name}
                    <button onClick={() => removeFirm(firm.crd)} style={{ color: '#1A7A4A', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
                <span style={{ fontSize: 11, color: '#5A7568' }}>
                  {selected.length === 0 ? 'No firms selected yet' : selected.length < 4 ? `${4 - selected.length} slot${4 - selected.length !== 1 ? 's' : ''} remaining` : 'Maximum 4 firms'}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
