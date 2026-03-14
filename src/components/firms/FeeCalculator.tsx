'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface FeeTier {
  min_aum: string | null;
  max_aum: number | null;
  fee_pct: number | null;
}

interface FeeCalculatorProps {
  feeTiers: FeeTier[] | null;
  crd: string;
  firmAum?: number | null;
  industryOnly?: boolean;
}

// ── Hardcoded industry averages ──────────────────────────────────────
const INDUSTRY_ALL = [
  { breakpoint: 500_000, label: '$500K', avg: 1.205, p25: 1.00, median: 1.00, p75: 1.49 },
  { breakpoint: 1_000_000, label: '$1M', avg: 1.058, p25: 0.90, median: 1.00, p75: 1.25 },
  { breakpoint: 5_000_000, label: '$5M', avg: 0.717, p25: 0.50, median: 0.70, p75: 0.90 },
  { breakpoint: 10_000_000, label: '$10M', avg: 0.581, p25: 0.40, median: 0.55, p75: 0.75 },
  { breakpoint: 25_000_000, label: '$25M', avg: 0.528, p25: 0.35, median: 0.50, p75: 0.75 },
  { breakpoint: 50_000_000, label: '$50M', avg: 0.505, p25: 0.30, median: 0.50, p75: 0.70 },
  { breakpoint: 100_000_000, label: '$100M', avg: 0.489, p25: 0.25, median: 0.50, p75: 0.65 },
];

const INDUSTRY_SMALL = [
  { breakpoint: 500_000, avg: 1.237, median: 1.15 },
  { breakpoint: 1_000_000, avg: 1.084, median: 1.00 },
  { breakpoint: 5_000_000, avg: 0.782, median: 0.75 },
  { breakpoint: 10_000_000, avg: 0.687, median: 0.60 },
];

const INDUSTRY_MID = [
  { breakpoint: 500_000, avg: 1.113, median: 1.00 },
  { breakpoint: 1_000_000, avg: 1.004, median: 1.00 },
  { breakpoint: 5_000_000, avg: 0.743, median: 0.75 },
  { breakpoint: 10_000_000, avg: 0.664, median: 0.62 },
];

function getClosestBreakpoint(amount: number) {
  let closest = INDUSTRY_ALL[0];
  for (const bp of INDUSTRY_ALL) {
    if (Math.abs(amount - bp.breakpoint) <= Math.abs(amount - closest.breakpoint)) {
      closest = bp;
    }
  }
  return closest;
}

function getSegmentLabel(firmAum: number | null | undefined): string {
  if (!firmAum) return 'All Firms';
  if (firmAum < 1_000_000_000) return 'Small Firms (<$1B AUM)';
  if (firmAum <= 10_000_000_000) return 'Mid Firms ($1-10B AUM)';
  return 'All Firms';
}

function getSegmentMedian(amount: number, firmAum: number | null | undefined): number | null {
  const data = !firmAum ? null : firmAum < 1_000_000_000 ? INDUSTRY_SMALL : firmAum <= 10_000_000_000 ? INDUSTRY_MID : null;
  if (!data) return null;
  let closest = data[0];
  for (const bp of data) {
    if (Math.abs(amount - bp.breakpoint) <= Math.abs(amount - closest.breakpoint)) {
      closest = bp;
    }
  }
  return closest.median;
}

const MAX_INPUT = 1_000_000_000;

function formatDollar(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return formatDollar(n);
}

function calcTieredFee(amount: number, tiers: FeeTier[]): number {
  if (tiers.length === 0) return 0;

  const sorted = [...tiers]
    .filter((t) => t.fee_pct != null)
    .sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'));

  if (sorted.length === 0) return 0;

  // Single tier — flat fee across all AUM
  if (sorted.length === 1) {
    return amount * (sorted[0].fee_pct! / 100);
  }

  let totalFee = 0;
  let remaining = amount;

  for (let i = 0; i < sorted.length && remaining > 0; i++) {
    const tierMin = parseInt(sorted[i].min_aum || '0');
    const tierMax = sorted[i].max_aum;
    const pct = sorted[i].fee_pct! / 100;

    const bracketSize = tierMax ? tierMax - tierMin : remaining;
    const taxable = Math.min(remaining, bracketSize);
    totalFee += taxable * pct;
    remaining -= taxable;
  }

  return totalFee;
}

function projectGrowth(principal: number, annualFeeRate: number, years: number, returnRate: number = 0.07) {
  let value = principal;
  let totalFees = 0;
  for (let y = 0; y < years; y++) {
    const fee = value * annualFeeRate;
    totalFees += fee;
    value = (value - fee) * (1 + returnRate);
  }
  return { value, totalFees };
}

function projectNoFee(principal: number, years: number, returnRate: number = 0.07) {
  return principal * Math.pow(1 + returnRate, years);
}

const CSS = `
  .fc-wrap {
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568;
    --rule:#CAD8D0; --amber:#F59E0B; --red:#EF4444;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }
  .fc-wrap { background:#fff; border:1px solid var(--rule); overflow:hidden; }
  .fc-head {
    padding:18px 24px 0; display:flex; align-items:baseline; justify-content:space-between;
  }
  .fc-head-title {
    font-family:var(--serif); font-size:18px; font-weight:700; color:var(--ink);
    letter-spacing:-.01em;
  }
  .fc-head-sub { font-size:11px; color:var(--ink-3); font-family:var(--mono); }
  .fc-body { padding:20px 24px 24px; }
  .fc-input-wrap {
    display:flex; align-items:center; gap:0;
    border:1px solid var(--rule); background:var(--white); max-width:320px; margin-bottom:4px;
  }
  .fc-prefix {
    padding:10px 12px; font-family:var(--mono); font-size:13px; color:var(--ink-3);
    border-right:1px solid var(--rule); background:#fff; flex-shrink:0;
  }
  .fc-input {
    flex:1; border:none; background:transparent; outline:none;
    font-family:var(--mono); font-size:13px; color:var(--ink);
    padding:10px 12px;
  }
  .fc-input::placeholder { color:var(--ink-3); }
  .fc-industry-note {
    font-size:11px; color:var(--amber); margin-bottom:16px; padding:10px 14px;
    border:1px solid rgba(245,158,11,.2); background:rgba(245,158,11,.04);
    font-family:var(--sans); line-height:1.6;
  }
  .fc-output-grid {
    display:grid; grid-template-columns:1fr 1fr 1fr; gap:0;
    border:1px solid var(--rule); margin-top:20px; margin-bottom:20px;
  }
  .fc-out-cell { padding:16px 18px; border-right:1px solid var(--rule); }
  .fc-out-cell:last-child { border-right:none; }
  .fc-out-label { font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-3); margin-bottom:8px; }
  .fc-out-val { font-family:var(--serif); font-size:22px; font-weight:700; color:var(--ink); line-height:1; letter-spacing:-.02em; }
  .fc-out-sub { font-size:10px; color:var(--ink-3); margin-top:4px; font-family:var(--mono); }
  .fc-out-verdict { font-size:11px; font-weight:600; margin-top:4px; }
  .fc-compare-section { margin-bottom:20px; }
  .fc-compare-label {
    font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
    color:var(--ink-3); margin-bottom:10px;
  }
  .fc-compare-track {
    height:6px; background:var(--green-pale); position:relative; margin-bottom:6px;
    border-radius:0;
  }
  .fc-compare-median {
    position:absolute; top:-4px; height:14px; width:2px;
    background:var(--ink-3);
  }
  .fc-compare-dot {
    position:absolute; top:50%; transform:translate(-50%,-50%);
    width:10px; height:10px; border-radius:50%; border:2px solid #fff;
  }
  .fc-compare-labels {
    display:flex; justify-content:space-between;
    font-family:var(--mono); font-size:10px; color:var(--ink-3);
  }
  .fc-seg-note { font-size:11px; color:var(--ink-3); margin-top:6px; }
  .fc-proj-section { }
  .fc-proj-label {
    font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
    color:var(--ink-3); margin-bottom:10px;
  }
  .fc-proj-table { border:1px solid var(--rule); }
  .fc-proj-head {
    display:grid; grid-template-columns:80px 1fr 1fr 1fr;
    padding:8px 16px; border-bottom:1px solid var(--rule);
    background:var(--white);
  }
  .fc-proj-head span { font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); }
  .fc-proj-head span:not(:first-child) { text-align:right; }
  .fc-proj-row {
    display:grid; grid-template-columns:80px 1fr 1fr 1fr;
    padding:12px 16px; border-bottom:1px solid var(--rule); align-items:center;
  }
  .fc-proj-row:last-child { border-bottom:none; }
  .fc-proj-year { font-size:12px; font-weight:600; color:var(--ink-2); font-family:var(--mono); }
  .fc-proj-cell { font-family:var(--mono); font-size:12px; color:var(--ink-2); text-align:right; }
  .fc-proj-cell.fees { color:var(--red); }
  .fc-10bp {
    margin-top:16px; padding:16px 18px;
    border:1px solid rgba(26,122,74,.15); background:rgba(26,122,74,.03);
  }
  .fc-10bp-title { font-size:12px; font-weight:600; color:var(--ink-2); margin-bottom:4px; }
  .fc-10bp-sub { font-size:11px; color:var(--ink-3); margin-bottom:12px; }
  .fc-10bp-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .fc-10bp-cell { padding:10px 12px; border:1px solid var(--rule); background:#fff; }
  .fc-10bp-cell-label { font-size:10px; color:var(--ink-3); margin-bottom:4px; text-transform:uppercase; letter-spacing:.1em; font-weight:600; }
  .fc-10bp-cell-val { font-family:var(--serif); font-size:16px; font-weight:700; color:var(--green); }
  .fc-cta {
    display:flex; align-items:center; justify-content:center; gap:8px;
    width:100%; margin-top:20px;
    background:var(--green); color:#fff;
    font-family:var(--sans); font-size:12px; font-weight:600;
    padding:11px; text-decoration:none; border:none; cursor:pointer;
    transition:background .2s; letter-spacing:.04em;
  }
  .fc-cta:hover { background:var(--green-2); }
`;

export default function FeeCalculator({ feeTiers, crd, firmAum, industryOnly = false }: FeeCalculatorProps) {
  const [rawInput, setRawInput] = useState('');

  const amount = useMemo(() => {
    const num = parseInt(rawInput.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return 0;
    return Math.min(num, MAX_INPUT);
  }, [rawInput]);

  const tiers = feeTiers || [];
  const industryBp = useMemo(() => amount > 0 ? getClosestBreakpoint(amount) : null, [amount]);
  const segmentMedian = useMemo(() => amount > 0 ? getSegmentMedian(amount, firmAum) : null, [amount, firmAum]);

  const annualFee = useMemo(() => {
    if (tiers.length > 0 && !industryOnly) return calcTieredFee(amount, tiers);
    // Industry-only: use median as estimate
    if (industryBp && amount > 0) return amount * (industryBp.median / 100);
    return 0;
  }, [amount, tiers, industryOnly, industryBp]);
  const effectiveRate = amount > 0 ? (annualFee / amount) * 100 : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    if (!digits) { setRawInput(''); return; }
    let num = parseInt(digits, 10);
    if (num > MAX_INPUT) num = MAX_INPUT;
    setRawInput(num.toLocaleString('en-US'));
  };

  const validTiers = tiers.filter((t) => t.fee_pct != null);
  const hasFirmFees = validTiers.length > 0 && !industryOnly;

  const lowerRate = Math.max(effectiveRate - 0.10, 0);
  const lowerFee = amount * (lowerRate / 100);

  // Comparison color logic
  const verdictColor = (firmRate: number, median: number) => {
    if (firmRate < median - 0.005) return '#1A7A4A';
    if (firmRate > median + 0.005) return '#EF4444';
    return '#F59E0B';
  };

  return (
    <div className="fc-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="fc-head">
        <span className="fc-head-title">Fee Calculator</span>
        <span className="fc-head-sub">
          {hasFirmFees ? 'Firm schedule' : 'Industry estimate'}
        </span>
      </div>

      <div className="fc-body">
        {/* Input */}
        <div className="fc-input-wrap">
          <span className="fc-prefix">$</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter investable assets"
            value={rawInput}
            onChange={handleChange}
            className="fc-input"
          />
        </div>

        {!hasFirmFees && (
          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: "'DM Mono', monospace", marginBottom: 0 }}>
            Estimates based on industry averages — firm fees not disclosed
          </div>
        )}

        {amount > 0 && (
          <>
            {/* Industry averages disclaimer */}
            {!hasFirmFees && (
              <div className="fc-industry-note">
                ⚠ This firm does not disclose a standard fee schedule. Estimates below are based on industry averages for comparable firms.
              </div>
            )}

            {/* Output grid */}
            <div className="fc-output-grid">
              <div className="fc-out-cell">
                <div className="fc-out-label">{hasFirmFees ? 'Est. Annual Fee' : 'Est. Fee (Median)'}</div>
                <div className="fc-out-val">{formatCompact(annualFee)}</div>
                <div className="fc-out-sub">{effectiveRate.toFixed(2)}% effective</div>
              </div>
              <div className="fc-out-cell">
                <div className="fc-out-label">Quarterly Cost</div>
                <div className="fc-out-val">{formatCompact(annualFee / 4)}</div>
                <div className="fc-out-sub">per quarter</div>
              </div>
              {industryBp && (
                <div className="fc-out-cell">
                  <div className="fc-out-label">vs. Peer Median</div>
                  <div className="fc-out-val" style={{ color: verdictColor(effectiveRate, industryBp.median) }}>
                    {hasFirmFees
                      ? effectiveRate < industryBp.median - 0.005
                        ? `−${(industryBp.median - effectiveRate).toFixed(2)}%`
                        : effectiveRate > industryBp.median + 0.005
                        ? `+${(effectiveRate - industryBp.median).toFixed(2)}%`
                        : 'At median'
                      : `${industryBp.median.toFixed(2)}%`}
                  </div>
                  <div className="fc-out-sub">{industryBp.label} peer group</div>
                </div>
              )}
            </div>

            {/* Comparison track */}
            {industryBp && (
              <div className="fc-compare-section">
                <div className="fc-compare-label">Industry Comparison · {industryBp.label} peer group</div>
                <div className="fc-compare-track">
                  {/* median line */}
                  <div
                    className="fc-compare-median"
                    style={{ left: `${Math.min((industryBp.median / Math.max(industryBp.p75 * 1.3, effectiveRate * 1.1, 0.01)) * 100, 98)}%` }}
                  />
                  {/* firm dot */}
                  <div
                    className="fc-compare-dot"
                    style={{
                      left: `${Math.min((effectiveRate / Math.max(industryBp.p75 * 1.3, effectiveRate * 1.1, 0.01)) * 100, 98)}%`,
                      background: verdictColor(effectiveRate, industryBp.median),
                    }}
                  />
                </div>
                <div className="fc-compare-labels">
                  <span>P25: {industryBp.p25.toFixed(2)}%</span>
                  <span>Median: {industryBp.median.toFixed(2)}%</span>
                  <span>P75: {industryBp.p75.toFixed(2)}%</span>
                </div>
                {hasFirmFees && (
                  <div style={{ fontSize: 11, fontWeight: 600, marginTop: 8, color: verdictColor(effectiveRate, industryBp.median) }}>
                    {effectiveRate < industryBp.median - 0.005
                      ? `✓ ${(industryBp.median - effectiveRate).toFixed(2)}% below median — competitive`
                      : effectiveRate > industryBp.median + 0.005
                      ? `⚠ ${(effectiveRate - industryBp.median).toFixed(2)}% above median`
                      : '— At the industry median'}
                  </div>
                )}
                {segmentMedian !== null && (
                  <div className="fc-seg-note">
                    {getSegmentLabel(firmAum)} median: {segmentMedian.toFixed(2)}%
                  </div>
                )}
              </div>
            )}

            {/* Projections */}
            <div className="fc-proj-section">
              <div className="fc-proj-label">Portfolio Projection · 7% annual return assumed</div>
              <div className="fc-proj-table">
                <div className="fc-proj-head">
                  <span>Horizon</span>
                  <span>No Fees</span>
                  <span>With Fees</span>
                  <span>Fees Paid</span>
                </div>
                {[5, 10, 20].map((y) => {
                  const noFee = projectNoFee(amount, y);
                  const withFee = projectGrowth(amount, effectiveRate / 100, y);
                  return (
                    <div key={y} className="fc-proj-row">
                      <span className="fc-proj-year">{y}yr</span>
                      <span className="fc-proj-cell">{formatCompact(noFee)}</span>
                      <span className="fc-proj-cell">{formatCompact(withFee.value)}</span>
                      <span className="fc-proj-cell fees">{formatCompact(withFee.totalFees)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 10bp savings scenario */}
            {effectiveRate > 0.10 && (
              <div className="fc-10bp">
                <div className="fc-10bp-title">What if fees were 10bp lower?</div>
                <div className="fc-10bp-sub">
                  {effectiveRate.toFixed(2)}% → {lowerRate.toFixed(2)}% ({formatCompact(annualFee)} → {formatCompact(lowerFee)}/yr)
                </div>
                <div className="fc-10bp-grid">
                  {[5, 10, 20].map((y) => {
                    const current = projectGrowth(amount, effectiveRate / 100, y);
                    const lower = projectGrowth(amount, lowerRate / 100, y);
                    const savings = lower.value - current.value;
                    return (
                      <div key={y} className="fc-10bp-cell">
                        <div className="fc-10bp-cell-label">{y}yr savings</div>
                        <div className="fc-10bp-cell-val">{formatCompact(savings)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Link href={`/compare?add=${crd}`} className="fc-cta">
              Compare This Firm
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                <path d="M2 5.5h7M6 2.5l3 3-3 3" />
              </svg>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
