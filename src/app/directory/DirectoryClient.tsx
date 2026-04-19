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
const SANS  = "'Inter', sans-serif";
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
        .dir-gate-content {
          pointer-events: none; user-select: none; position: relative;
          filter: blur(1.5px); max-height: 600px; overflow: hidden;
          mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
        }
        .dir-browse-link:hover { color: ${C.green2} !important; }
        .dir-gate-card {
          position: absolute; top: 140px; left: 50%; transform: translateX(-50%);
          width: calc(100% - 48px); max-width: 480px;
          background: #0F2538; border: 1px solid rgba(255,255,255,.09); border-top: 2px solid #1A7A4A;
          box-shadow: 0 8px 48px rgba(0,0,0,0.5);
          padding: 36px 40px; text-align: left; z-index: 30;
        }
        .dir-gc-eyebrow {
          display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
          font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #2DBD74;
        }
        .dir-gc-eyebrow svg { width: 12px; height: 12px; }
        .dir-gc-headline {
          font-family: 'Cormorant Garamond', serif; font-size: clamp(22px, 2.5vw, 30px);
          font-weight: 700; line-height: 1.2; letter-spacing: -.02em; color: #fff; margin-bottom: 12px;
        }
        .dir-gc-sub {
          font-size: 13px; color: rgba(255,255,255,.55); line-height: 1.7;
          border-top: 1px solid rgba(255,255,255,.06); padding-top: 16px; margin-bottom: 24px;
        }
        .dir-gc-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
        .dir-gc-cta-primary {
          display: inline-flex; align-items: center; padding: 12px 28px;
          background: #1A7A4A; color: #fff; font-size: 13px; font-weight: 600;
          text-decoration: none; transition: background .15s;
        }
        .dir-gc-cta-primary:hover { background: #22995E; }
        .dir-gc-cta-secondary {
          display: inline-flex; align-items: center; padding: 12px 28px;
          border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.6);
          font-size: 13px; text-decoration: none; transition: all .15s;
        }
        .dir-gc-cta-secondary:hover { border-color: rgba(255,255,255,.3); color: #fff; }
        @media (max-width: 640px) {
          .dir-gate-card { top: 120px; padding: 28px 20px; max-width: calc(100% - 32px); }
          .dir-gc-ctas { flex-wrap: nowrap; }
          .dir-gc-cta-primary, .dir-gc-cta-secondary { padding: 12px 16px; font-size: 12px; white-space: nowrap; }
        }
        @media (max-width: 480px) {
          .dir-hero { padding: 28px 16px 36px !important; }
        }
      ` }} />

      <div style={{ fontFamily: SANS, minHeight: '100vh', background: '#0A1C2A' }}>

        {/* ── Hero ── */}
        <div className="dir-hero" style={{ background: '#0A1C2A', padding: '44px 48px 52px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(45,189,116,.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: '#2DBD74', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 1, background: '#2DBD74', display: 'inline-block' }} />
              Advisor Directory
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 7vw, 42px)', fontWeight: 700, color: '#fff', letterSpacing: '-.025em', lineHeight: 1.06, marginBottom: 0 }}>
              Search firms <em style={{ fontStyle: 'normal', color: '#2DBD74' }}>near you</em>
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.38)', lineHeight: 1.75, maxWidth: 500, marginTop: 12 }}>
              Every SEC-registered investment advisory firm, organized by state. Click any state to browse firms, scores, fees, and regulatory history.
            </p>
          </div>
        </div>

        {/* ── Map + Stats (gated or interactive) ── */}
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 400, color: C.ink3, fontFamily: MONO, fontSize: 12, gap: 10, background: C.white }}>
            <span style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid ${C.green3}`,
              borderTopColor: 'transparent', borderRadius: '50%', animation: 'dir-spin .8s linear infinite' }} />
            Loading…
          </div>
        ) : (
          <div style={{ position: 'relative', background: C.white }}>

            {/* Gate wrap for unauthed */}
            <div className={isGated ? 'dir-gate-content' : undefined}>
              <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px 0' }}>

                {/* Map section header — hidden for gated, shown for authed */}
                {!isGated && (
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink }}>
                      Browse by State
                    </div>
                    <div style={{ fontSize: 11, color: C.ink3, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green3, display: 'inline-block' }} />
                      Click any state to view firms
                    </div>
                  </div>
                )}

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
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em',
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
                      <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink3 }}>{cell.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gate overlay elements for unauthed */}
            {isGated && (
              <>
                <div className="dir-gate-card">
                  <div className="dir-gc-eyebrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    UNLOCK FULL DIRECTORY
                  </div>
                  <h2 className="dir-gc-headline">
                    Every firm. Every state. Full transparency.
                  </h2>
                  <p className="dir-gc-sub">
                    Get Visor Index scores, fee breakdowns, growth trends, regulatory history, firm alerts, and more when you sign up today.
                  </p>
                  <div className="dir-gc-ctas">
                    <Link href="/auth/signup" className="dir-gc-cta-primary">Get Full Access →</Link>
                    <Link href="/pricing" className="dir-gc-cta-secondary">View Pricing</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
