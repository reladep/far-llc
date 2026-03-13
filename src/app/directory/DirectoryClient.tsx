'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import Link from 'next/link';

// ── Design tokens ───────────────────────────────────────────────────────────
const C = {
  navy: '#0A1C2A', navy2: '#0F2538',
  green: '#1A7A4A', green2: '#22995E', green3: '#2DBD74',
  white: '#F6F8F7', ink: '#0C1810', ink2: '#2E4438', ink3: '#5A7568', rule: '#CAD8D0',
};
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', sans-serif";
const MONO  = "'DM Mono', monospace";

const W = 960, H = 560;

// ── FIPS ↔ abbr mappings ───────────────────────────────────────────────────
const FIPS_TO_ABBR: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT',
  '10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL',
  '18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD',
  '25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE',
  '32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
  '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',
  '47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY',
};

const ABBR_TO_FIPS: Record<string, string> = Object.fromEntries(
  Object.entries(FIPS_TO_ABBR).map(([fips, abbr]) => [abbr, fips])
);

// ── Props ───────────────────────────────────────────────────────────────────
export interface StateCount {
  code: string;   // 2-letter abbr
  name: string;
  count: number;
}

interface Props {
  states: StateCount[];
  totalFirms: number;
}

// ── Tooltip state ───────────────────────────────────────────────────────────
interface TooltipState {
  x: number;
  y: number;
  name: string;
  count: number;
}

// ── US Map sub-component ────────────────────────────────────────────────────
interface USMapProps {
  selectedFips: string | null;
  onSelect: (fips: string) => void;
  stateCountByFips: Record<string, number>;
  stateNameByFips: Record<string, string>;
  interactive: boolean;
}

function USMap({ selectedFips, onSelect, stateCountByFips, stateNameByFips, interactive }: USMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [pathGen, setPathGen] = useState<any>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ geoAlbersUsa, geoPath }, topoClient, usAtlas] = await Promise.all([
          import('d3-geo'),
          import('topojson-client'),
          import('us-atlas/states-10m.json'),
        ]);
        if (cancelled) return;
        const proj = geoAlbersUsa().scale(1280).translate([W / 2, H / 2]);
        const path = geoPath().projection(proj);
        const us = (usAtlas as any).default ?? usAtlas;
        const feats = (topoClient.feature as any)(us, us.objects.states).features;
        setFeatures(feats);
        setPathGen(() => path);
        setStatus('ok');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getFill = useCallback((id: string) => {
    if (id === selectedFips) return C.green;
    if (id === hovered) return C.green2;
    return stateCountByFips[id] ? '#c8dfd5' : '#e8f0ed';
  }, [selectedFips, hovered, stateCountByFips]);

  const handleMouseMove = useCallback((e: React.MouseEvent, f: any) => {
    if (!interactive || !svgRef.current) return;
    const abbr = FIPS_TO_ABBR[f.id];
    if (!abbr) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip({
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
      name: stateNameByFips[f.id] || abbr,
      count: stateCountByFips[f.id] || 0,
    });
    setHovered(f.id);
  }, [interactive, stateCountByFips, stateNameByFips]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setHovered(null);
  }, []);

  if (status === 'loading') {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.ink3, fontFamily: MONO, fontSize: 12, gap: 10 }}>
        <span style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid ${C.green3}`,
          borderTopColor: 'transparent', borderRadius: '50%', animation: 'dir-spin .8s linear infinite' }} />
        Loading map…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#DC2626', fontSize: 13 }}>
        Could not load map. Please refresh.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseLeave={handleMouseLeave}>
        {features.map((f: any) => (
          <path key={f.id}
            d={pathGen(f)}
            fill={getFill(f.id)}
            stroke="#fff"
            strokeWidth={0.8}
            strokeLinejoin="round"
            style={{ cursor: (interactive && stateCountByFips[f.id]) ? 'pointer' : 'default', transition: 'fill .12s' }}
            onMouseMove={e => handleMouseMove(e, f)}
            onMouseEnter={e => handleMouseMove(e, f)}
            onClick={() => {
              if (interactive && stateCountByFips[f.id]) onSelect(f.id);
            }}
          />
        ))}

        {tooltip && (
          <g
            transform={`translate(${Math.min(tooltip.x + 16, W - 190)},${Math.max(tooltip.y - 76, 8)})`}
            style={{ pointerEvents: 'none' }}
          >
            <rect width={178} height={66} fill={C.navy} />
            <rect width={178} height={2} fill={C.green3} />
            <text x={12} y={22} fontFamily={SERIF} fontSize={14} fontWeight={700} fill="#fff">
              {tooltip.name}
            </text>
            <text x={12} y={38} fontFamily={MONO} fontSize={10} fill={C.green3}>
              {tooltip.count.toLocaleString()} registered firms
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function DirectoryClient({ states, totalFirms }: Props) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [selectedFips, setSelectedFips] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  // Build lookup maps from server-provided state counts
  const stateCountByFips = useMemo(() => {
    const m: Record<string, number> = {};
    states.forEach(s => {
      const fips = ABBR_TO_FIPS[s.code];
      if (fips) m[fips] = s.count;
    });
    return m;
  }, [states]);

  const stateNameByFips = useMemo(() => {
    const m: Record<string, string> = {};
    states.forEach(s => {
      const fips = ABBR_TO_FIPS[s.code];
      if (fips) m[fips] = s.name;
    });
    return m;
  }, [states]);

  const selectedState = selectedFips ? {
    fips: selectedFips,
    abbr: FIPS_TO_ABBR[selectedFips],
    name: stateNameByFips[selectedFips] || '—',
    count: stateCountByFips[selectedFips] || 0,
  } : null;

  const isGated = session === null;
  const isLoading = session === undefined;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dir-spin { to { transform: rotate(360deg); } }
        .dir-gate-content { pointer-events: none; user-select: none; position: relative; }
        .dir-gate-content::after {
          content: '';
          position: absolute; inset: 0;
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.4) 10%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 100%);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.4) 10%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 100%);
          pointer-events: none;
          z-index: 2;
        }
        .dir-gate-content {
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,.35) 42%, rgba(0,0,0,0) 62%);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,.35) 42%, rgba(0,0,0,0) 62%);
        }
        .dir-browse-link:hover { color: ${C.green2} !important; }
        .dir-gc-cta:hover { background: ${C.green2} !important; }
        .dir-gc-cta:hover .dir-gc-arrow { transform: translateX(4px); }
        .dir-gc-arrow { transition: transform .2s; display: inline-block; }
      ` }} />

      <div style={{ fontFamily: SANS, background: C.white, minHeight: '100vh', paddingTop: 52 }}>

        {/* ── Hero ── */}
        <div style={{ background: C.navy, padding: '40px 0 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', right: -60, top: -80, width: 420, height: 420, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,122,74,.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px', position: 'relative' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
              color: C.green3, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 1, background: C.green3, display: 'inline-block' }} />
              Advisor Directory
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, color: '#fff',
              letterSpacing: '-.02em', marginBottom: 6, lineHeight: 1.1 }}>
              Browse by State
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', lineHeight: 1.65,
              maxWidth: 480, marginBottom: 28 }}>
              Every SEC-registered investment advisory firm, organized by state. Click any state
              to browse firms, scores, fees, and regulatory history.
            </p>
            <div style={{ display: 'flex', gap: 0 }}>
              {[
                [totalFirms.toLocaleString(), 'Registered firms'],
                ['$48.2T', 'Total AUM covered'],
                [states.length.toString(), 'States indexed'],
                ['Feb 2025', 'Last updated'],
              ].map(([val, label], i) => (
                <div key={label} style={{
                  paddingLeft: i > 0 ? 28 : 0, marginLeft: i > 0 ? 28 : 0,
                  borderLeft: i > 0 ? '1px solid rgba(255,255,255,.08)' : 'none',
                }}>
                  <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: '#fff' }}>{val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Map + Stats (gated or interactive) ── */}
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 400, color: C.ink3, fontFamily: MONO, fontSize: 12, gap: 10 }}>
            <span style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid ${C.green3}`,
              borderTopColor: 'transparent', borderRadius: '50%', animation: 'dir-spin .8s linear infinite' }} />
            Loading…
          </div>
        ) : (
          <div style={{ position: 'relative' }}>

            {/* Gate wrap for unauthed */}
            <div className={isGated ? 'dir-gate-content' : undefined}>
              <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px 0' }}>

                {/* Map section header */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink }}>
                    Browse by State
                  </div>
                  <div style={{ fontSize: 11, color: C.ink3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green3, display: 'inline-block' }} />
                    Click any state to view firms
                  </div>
                </div>

                {/* Map card */}
                <div style={{ background: '#fff', border: `1px solid ${C.rule}`, borderTop: `2px solid ${C.ink}`,
                  padding: '20px 20px 12px', marginBottom: 1 }}>
                  <USMap
                    selectedFips={selectedFips}
                    onSelect={setSelectedFips}
                    stateCountByFips={stateCountByFips}
                    stateNameByFips={stateNameByFips}
                    interactive={!isGated}
                  />
                  {/* Legend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 8,
                    fontSize: 10, color: C.ink3 }}>
                    {[['#c8dfd5','Has firms'],['#1A7A4A','Selected'],['#e8f0ed','No data']].map(([bg, label]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 14, height: 10, background: bg, border: `1px solid ${C.rule}` }} />
                        <span style={{ fontFamily: MONO }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1,
                  background: C.rule, border: `1px solid ${C.rule}`, marginBottom: 40 }}>
                  {[
                    { label: 'Selected State', body: selectedState?.name ?? '—', sub: 'Click map to select' },
                    { label: 'Registered Firms', body: selectedState ? selectedState.count.toLocaleString() : '—', sub: 'SEC-registered RIAs' },
                    { label: 'Total AUM', body: '—', sub: 'Assets under management' },
                    { label: 'Action', body: null, sub: selectedState ? `View all firms in ${selectedState.name}` : 'Select a state first' },
                  ].map((cell, i) => (
                    <div key={i} style={{ background: '#fff', padding: '16px 20px' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em',
                        textTransform: 'uppercase', color: C.ink3, marginBottom: 6 }}>
                        {cell.label}
                      </div>
                      {i < 3 ? (
                        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700,
                          color: C.ink, lineHeight: 1, marginBottom: 4 }}>
                          {cell.body}
                        </div>
                      ) : selectedState ? (
                        <Link
                          href={`/directory/${selectedState.abbr.toLowerCase()}`}
                          className="dir-browse-link"
                          style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700,
                            color: C.green, textDecoration: 'none', display: 'block', marginBottom: 4 }}
                        >
                          Browse Firms →
                        </Link>
                      ) : (
                        <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700,
                          color: C.ink3, opacity: 0.35, marginBottom: 4 }}>
                          Browse Firms →
                        </div>
                      )}
                      <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink3 }}>{cell.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gate overlay elements for unauthed */}
            {isGated && (
              <>
                {/* White floor */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                  background: C.white, pointerEvents: 'none', zIndex: 5,
                }} />

                {/* Gate card */}
                <div style={{
                  position: 'absolute', top: 260, left: '50%', transform: 'translateX(-50%)',
                  width: '100%', maxWidth: 520,
                  background: '#fff', border: `1px solid ${C.rule}`, borderTop: `2px solid ${C.navy}`,
                  boxShadow: '0 32px 80px rgba(10,28,42,.13), 0 4px 20px rgba(10,28,42,.07)',
                  padding: '40px 44px', textAlign: 'center', zIndex: 50,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em',
                    textTransform: 'uppercase', color: C.green3, marginBottom: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <span style={{ width: 20, height: 1, background: C.green3, display: 'inline-block' }} />
                    Members only
                    <span style={{ width: 20, height: 1, background: C.green3, display: 'inline-block' }} />
                  </div>
                  <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: C.ink,
                    letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 10 }}>
                    Unlock the full directory
                  </div>
                  <p style={{ fontSize: 13, color: C.ink3, lineHeight: 1.75,
                    maxWidth: 380, margin: '0 auto 24px' }}>
                    Browse every SEC-registered advisor by state — with Visor scores,
                    fee structures, AUM data, and regulatory history.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, textAlign: 'left',
                    marginBottom: 24, padding: '14px 18px', background: C.white, border: `1px solid ${C.rule}` }}>
                    {[
                      'All 14,280 registered firms across 50 states',
                      'VVS scores, fee structures, and AUM for every firm',
                      'Regulatory flags and disciplinary history',
                      'One-click to compare or negotiate from any firm',
                    ].map(perk => (
                      <div key={perk} style={{ fontSize: 12, color: C.ink3,
                        display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5 }}>
                        <span style={{ color: C.green, fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {perk}
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/auth/signup"
                    className="dir-gc-cta"
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 10,
                      background: C.green, color: '#fff', border: 'none', cursor: 'pointer',
                      padding: 15, fontFamily: SANS, fontSize: 13, fontWeight: 600,
                      letterSpacing: '.08em', textTransform: 'uppercase', textDecoration: 'none',
                      transition: 'background .15s', marginBottom: 12,
                    }}
                  >
                    Create Free Account
                    <span className="dir-gc-arrow" style={{ fontSize: 16 }}>→</span>
                  </Link>
                  <div style={{ fontSize: 11, color: C.ink3 }}>
                    Already have an account?{' '}
                    <Link href="/auth/login"
                      style={{ color: C.ink, fontWeight: 600, textDecoration: 'none',
                        borderBottom: `1px solid ${C.rule}` }}>
                      Sign in
                    </Link>
                  </div>
                </div>

                {/* Spacer below gate card */}
                <div style={{ height: 560 }} />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
