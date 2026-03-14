'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import Link from 'next/link';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:  '#0A1C2A', navy2: '#0F2538', navy3: '#162F45',
  green: '#1A7A4A', green2: '#22995E', green3: '#2DBD74',
  white: '#F6F8F7', ink: '#0C1810', ink2: '#2E4438', ink3: '#5A7568', rule: '#CAD8D0',
};
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', sans-serif";
const MONO  = "'DM Mono', monospace";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StateFirm {
  crd: number;
  primary_business_name: string | null;
  display_name: string | null;
  main_office_city: string | null;
  aum: number | null;
  employee_total: number | null;
  employee_investment: number | null;
  final_score?: number | null;
  stars?: number | null;
}

interface Props {
  stateCode: string;   // e.g. "NY"
  stateName: string;   // e.g. "New York"
  firms: StateFirm[];
  totalAUM: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9)  return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6)  return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

// ── VVS Score ring ────────────────────────────────────────────────────────────
function VVSRing({ score }: { score: number | null | undefined }) {
  if (score == null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.ink3, opacity: 0.4 }}>N/A</span>
      </div>
    );
  }
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? C.green3 : score >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={44} height={44} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(0,0,0,.06)" strokeWidth={3} />
        <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 700, color, lineHeight: 1, position: 'relative', zIndex: 1 }}>
        {score}
      </span>
    </div>
  );
}

// ── Firm row ──────────────────────────────────────────────────────────────────
function FirmRow({ firm }: { firm: StateFirm }) {
  const name = firm.display_name || firm.primary_business_name || 'Unknown Firm';
  return (
    <Link href={`/firm/${firm.crd}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="sdc-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 64px 120px 120px 80px 60px',
          alignItems: 'center',
          background: '#fff',
          borderBottom: `1px solid ${C.rule}`,
          padding: '0 20px',
          minHeight: 60,
          cursor: 'pointer',
          transition: 'background .1s',
        }}
      >
        {/* Firm name */}
        <div style={{ paddingRight: 16, minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
            {name}
          </div>
          {firm.display_name && firm.primary_business_name && firm.display_name !== firm.primary_business_name && (
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {firm.primary_business_name}
            </div>
          )}
        </div>
        {/* VVS Score */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <VVSRing score={firm.final_score} />
        </div>
        {/* AUM */}
        <div style={{ textAlign: 'right', paddingRight: 8 }}>
          <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.ink }}>
            {formatAUM(firm.aum)}
          </div>
        </div>
        {/* City */}
        <div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: C.ink3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {firm.main_office_city || '—'}
          </div>
        </div>
        {/* Employees */}
        <div style={{ textAlign: 'right', paddingRight: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.ink3 }}>
            {firm.employee_total?.toLocaleString() || '—'}
          </div>
        </div>
        {/* Arrow */}
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: MONO, fontSize: 14, color: C.rule }}>→</span>
        </div>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StateDirectoryClient({ stateCode, stateName, firms, totalAUM }: Props) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'aum' | 'score' | 'alpha' | 'employees'>('aum');
  const [displayCount, setDisplayCount] = useState(50);

  // Auth check
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  const sortedFirms = useMemo(() => {
    const copy = [...firms];
    if (sortBy === 'aum')       copy.sort((a, b) => (b.aum ?? 0) - (a.aum ?? 0));
    else if (sortBy === 'score') copy.sort((a, b) => (b.final_score ?? -1) - (a.final_score ?? -1));
    else if (sortBy === 'alpha') copy.sort((a, b) =>
      (a.display_name || a.primary_business_name || '').localeCompare(b.display_name || b.primary_business_name || ''));
    else if (sortBy === 'employees') copy.sort((a, b) => (b.employee_total ?? 0) - (a.employee_total ?? 0));
    return copy;
  }, [firms, sortBy]);

  const isGated   = session === null;
  const isLoading = session === undefined;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sdc-spin { to { transform: rotate(360deg); } }
        .sdc-row:hover { background: ${C.white} !important; }
        .sdc-sort-btn { background: none; border: 1px solid ${C.rule}; cursor: pointer;
          font-family: ${MONO}; font-size: 11px; color: ${C.ink3};
          padding: 6px 14px; transition: all .15s; }
        .sdc-sort-btn:hover, .sdc-sort-btn.active { border-color: ${C.ink}; color: ${C.ink}; }
        .sdc-sort-btn.active { background: ${C.ink}; color: #fff; border-color: ${C.ink}; }
        .sdc-gc-cta:hover { background: ${C.green2} !important; }
        .sdc-gc-cta:hover .sdc-gc-arrow { transform: translateX(4px); }
        .sdc-gc-arrow { transition: transform .2s; display: inline-block; }
        .sdc-gate-content { pointer-events: none; user-select: none; position: relative; }
        .sdc-gate-content::after {
          content: '';
          position: absolute; inset: 0;
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.4) 8%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 100%);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.4) 8%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 100%);
          pointer-events: none;
          z-index: 2;
        }
        .sdc-gate-content {
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,.3) 42%, rgba(0,0,0,0) 62%);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,.3) 42%, rgba(0,0,0,0) 62%);
        }
        .sdc-lm-btn { background: none; border: 1px solid ${C.rule}; cursor: pointer;
          font-family: ${MONO}; font-size: 12px; color: ${C.ink3};
          padding: 10px 32px; transition: all .15s; }
        .sdc-lm-btn:hover { border-color: ${C.ink}; color: ${C.ink}; }
      ` }} />

      <div style={{ fontFamily: SANS, background: C.white, minHeight: '100vh', paddingTop: 52 }}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div style={{ background: C.navy, padding: '36px 0 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', right: -60, top: -80, width: 420, height: 420, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,122,74,.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px', position: 'relative' }}>
            {/* Breadcrumb */}
            <div style={{ marginBottom: 18 }}>
              <Link href="/directory" style={{
                fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,.35)',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 10 }}>←</span> Directory
              </Link>
              <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,.2)', margin: '0 6px' }}>/</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{stateName}</span>
            </div>

            {/* Eyebrow */}
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
              color: C.green3, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 1, background: C.green3, display: 'inline-block' }} />
              {stateCode} · State Directory
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, color: '#fff',
              letterSpacing: '-.02em', marginBottom: 6, lineHeight: 1.1 }}>
              Financial Advisors in {stateName}
            </h1>

            {/* Meta stats */}
            <div style={{ display: 'flex', gap: 0, marginTop: 20 }}>
              {[
                [firms.length.toLocaleString(), 'Registered firms'],
                [formatAUM(totalAUM), 'Total AUM'],
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

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 300, gap: 10, color: C.ink3, fontFamily: MONO, fontSize: 12 }}>
            <span style={{ display: 'inline-block', width: 16, height: 16,
              border: `2px solid ${C.green3}`, borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'sdc-spin .8s linear infinite' }} />
            Loading…
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────────────── */}
        {!isLoading && (
          <div style={{ position: 'relative' }}>

            {/* ── Sticky toolbar ────────────────────────────────────────── */}
            <div style={{
              position: 'sticky', top: 52, zIndex: 30,
              background: 'rgba(246,248,247,.92)', backdropFilter: 'blur(16px)',
              borderBottom: `1px solid ${C.rule}`,
            }}>
              <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                height: 52 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.ink3,
                    textTransform: 'uppercase', letterSpacing: '.1em', marginRight: 4 }}>Sort:</span>
                  {([
                    ['aum',       'AUM'],
                    ['score',     'VVS Score'],
                    ['alpha',     'A–Z'],
                    ['employees', 'Employees'],
                  ] as const).map(([val, label]) => (
                    <button
                      key={val}
                      className={`sdc-sort-btn${sortBy === val ? ' active' : ''}`}
                      onClick={() => setSortBy(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.ink3 }}>
                  {firms.length.toLocaleString()} firms
                </div>
              </div>
            </div>

            {/* ── Firm list (gated or full) ──────────────────────────────── */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 48px 80px' }}>

              {/* Column headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 64px 120px 120px 80px 60px',
                padding: '0 20px 10px',
                borderBottom: `1px solid ${C.rule}`,
                marginBottom: 1,
              }}>
                {['Firm', 'VVS', 'AUM', 'City', 'Emp.', ''].map((h, i) => (
                  <div key={i} style={{
                    fontFamily: MONO, fontSize: 10, fontWeight: 700,
                    letterSpacing: '.14em', textTransform: 'uppercase', color: C.ink3,
                    textAlign: i === 2 || i === 4 ? 'right' : 'left', paddingRight: i === 2 || i === 4 ? 8 : 0,
                    display: i === 1 ? 'flex' : 'block', justifyContent: 'center',
                  }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Gate wrap for unauthed */}
              <div
                className={isGated ? 'sdc-gate-content' : undefined}
                style={{ position: isGated ? 'relative' : undefined }}
              >
                {/* Rows */}
                {sortedFirms.slice(0, isGated ? 8 : displayCount).map(firm => (
                  <FirmRow key={firm.crd} firm={firm} />
                ))}
              </div>

              {/* Gate overlay elements */}
              {isGated && (
                <>
                  {/* White floor */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
                    background: C.white, pointerEvents: 'none', zIndex: 5,
                  }} />

                  {/* Gate card */}
                  <div style={{
                    position: 'relative', margin: '0 auto',
                    width: '100%', maxWidth: 520, zIndex: 50,
                    background: '#fff', border: `1px solid ${C.rule}`,
                    borderTop: `2px solid ${C.navy}`,
                    boxShadow: '0 32px 80px rgba(10,28,42,.13), 0 4px 20px rgba(10,28,42,.07)',
                    padding: '40px 44px', textAlign: 'center',
                    marginTop: -160,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em',
                      textTransform: 'uppercase', color: C.green3, marginBottom: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      <span style={{ width: 20, height: 1, background: C.green3, display: 'inline-block' }} />
                      Members only
                      <span style={{ width: 20, height: 1, background: C.green3, display: 'inline-block' }} />
                    </div>
                    <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: C.ink,
                      letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 10 }}>
                      Unlock {firms.length.toLocaleString()} {stateName} firms
                    </div>
                    <p style={{ fontSize: 13, color: C.ink3, lineHeight: 1.75,
                      maxWidth: 380, margin: '0 auto 24px' }}>
                      See every advisor with Visor scores, fee structures,
                      AUM data, and regulatory history — all in one place.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, textAlign: 'left',
                      marginBottom: 24, padding: '14px 18px', background: C.white, border: `1px solid ${C.rule}` }}>
                      {[
                        `All ${firms.length.toLocaleString()} ${stateName} RIAs, ranked by score`,
                        'VVS scores, fee structures, and AUM for every firm',
                        'Regulatory flags and disciplinary history',
                        'One-click to compare or negotiate from any listing',
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
                      className="sdc-gc-cta"
                      style={{
                        display: 'flex', width: '100%', alignItems: 'center',
                        justifyContent: 'center', gap: 10,
                        background: C.green, color: '#fff',
                        padding: 15, fontFamily: SANS, fontSize: 13, fontWeight: 600,
                        letterSpacing: '.08em', textTransform: 'uppercase',
                        textDecoration: 'none', transition: 'background .15s', marginBottom: 12,
                      }}
                    >
                      Create Free Account
                      <span className="sdc-gc-arrow" style={{ fontSize: 16 }}>→</span>
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

                  {/* Spacer */}
                  <div style={{ height: 80 }} />
                </>
              )}

              {/* Load more (authed only) */}
              {!isGated && firms.length > displayCount && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 12, paddingTop: 32 }}>
                  <button
                    className="sdc-lm-btn"
                    onClick={() => setDisplayCount(n => n + 50)}
                  >
                    Load 50 more
                  </button>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: C.ink3 }}>
                    Showing {Math.min(displayCount, firms.length).toLocaleString()} of {firms.length.toLocaleString()} firms
                  </div>
                </div>
              )}

              {/* No firms state */}
              {firms.length === 0 && (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: SERIF, fontSize: 22, color: C.ink3, marginBottom: 8 }}>
                    No firms found in {stateName}
                  </div>
                  <Link href="/directory" style={{ fontFamily: MONO, fontSize: 12, color: C.green,
                    textDecoration: 'none' }}>
                    ← Back to directory
                  </Link>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
}
