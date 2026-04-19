'use client';

import { useState, useMemo } from 'react';
import {
  type FeeTier, type CalcResult,
  INDUSTRY_ALL, INDUSTRY_SMALL, INDUSTRY_MID,
  getClosestBreakpoint, getIndustryMedianRate, calcTieredFee, synthesizeRangeTiers, synthesizeMaxOnlyTiers,
} from '@/lib/fee-utils';

interface FeeCalculatorProps {
  feeTiers: FeeTier[] | null;
  crd: string;
  firmAum?: number | null;
  industryOnly?: boolean;
  // Integrated card props
  feeTypeDisplay?: string;
  feeNotes?: string | null;
  minAccount?: number | null;
  minFee?: number | null;
  sortedFeeTiers?: FeeTier[];
  // Range data for synthetic tier generation
  feeRangeMin?: number | null;
  feeRangeMax?: number | null;
  avgClientSize?: number | null;
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

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000).toLocaleString()}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return formatAUM(num);
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

// Determine which tier index is active for a given amount
function getActiveTierIndex(amount: number, tiers: FeeTier[]): number {
  if (amount <= 0 || tiers.length === 0) return -1;
  const sorted = [...tiers].sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'));
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (amount >= parseInt(sorted[i].min_aum || '0')) return i;
  }
  return 0;
}

const CSS = `
  .fc-wrap {
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568;
    --rule:#CAD8D0; --amber:#F59E0B; --red:#EF4444;
    --serif:'Cormorant Garamond',serif; --sans:'Inter',sans-serif; --mono:'DM Mono',monospace;
  }
  .fc-wrap {
    background:#fff; border:0.5px solid var(--rule); border-radius:10px;
    box-shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
    overflow:hidden;
  }

  /* Zone 1: Summary strip */
  .fc-summary { display:grid; grid-template-columns:1fr 1fr; }
  .fc-summary-cell { padding:18px 20px; text-align:center; }
  .fc-summary-cell + .fc-summary-cell { border-left:0.5px solid var(--rule); }
  .fc-summary-label { font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:8px; }
  .fc-summary-val { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--ink); line-height:1; letter-spacing:-.02em; margin-bottom:4px; }
  .fc-summary-sub { font-family:var(--sans); font-size:13px; color:var(--ink-3); line-height:1.6; }

  /* Zone 2: Calculator */
  .fc-calc { padding:18px 20px; border-top:0.5px solid var(--rule); }
  .fc-input-label {
    font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase;
    color:var(--ink-3); margin-bottom:6px;
  }
  .fc-input-hint { font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-top:4px; }
  .fc-detail-toggle {
    all:unset; cursor:pointer; display:flex; align-items:center; gap:6px;
    font-family:var(--sans); font-size:13px; font-weight:600; color:var(--green);
    margin-top:12px; transition:color .15s;
  }
  .fc-detail-toggle:hover { color:var(--green-2); }
  .fc-detail-toggle svg { transition:transform .2s; }
  .fc-input-wrap {
    display:flex; align-items:center; gap:0;
    border:1px solid var(--rule); background:var(--white); margin-bottom:4px; border-radius:4px;
  }
  .fc-prefix {
    padding:10px 12px; font-family:var(--mono); font-size:13px; color:var(--ink-3);
    border-right:1px solid var(--rule); background:#fff; flex-shrink:0; border-radius:4px 0 0 4px;
  }
  .fc-input {
    flex:1; border:none; background:transparent; outline:none;
    font-family:var(--mono); font-size:13px; color:var(--ink);
    padding:10px 12px;
  }
  .fc-input::placeholder { color:var(--ink-3); }
  .fc-input-wrap:focus-within {
    border-color:var(--green-3); box-shadow:0 0 0 2px rgba(45,189,116,.15);
  }
  .fc-min-note {
    font-size:10px; font-family:var(--mono); color:var(--amber); margin-bottom:8px;
  }
  .fc-industry-note {
    font-size:13px; color:var(--amber); margin-bottom:16px; padding:10px 14px;
    border:1px solid rgba(245,158,11,.2); background:rgba(245,158,11,.04);
    font-family:var(--sans); line-height:1.6;
  }
  .fc-output-grid {
    display:grid; grid-template-columns:1fr 1fr 1fr; gap:0;
    border:1px solid var(--rule); margin-top:16px; margin-bottom:16px; border-radius:4px; overflow:hidden;
  }
  .fc-out-cell { padding:14px 16px; border-right:1px solid var(--rule); text-align:center; }
  .fc-out-cell:last-child { border-right:none; }
  .fc-out-label { font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:6px; font-family:var(--sans); }
  .fc-out-val { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--ink); line-height:1; letter-spacing:-.02em; }
  .fc-out-sub { font-size:10px; color:var(--ink-3); margin-top:4px; font-family:var(--mono); }
  .fc-compare-section { margin-bottom:12px; }
  .fc-compare-label { font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:6px; font-family:var(--sans); }
  .fc-compare-track { height:8px; background:var(--green-pale); position:relative; margin-bottom:6px; border-radius:4px; }
  .fc-compare-median { position:absolute; top:-3px; height:14px; width:2px; background:var(--ink-3); border-radius:1px; }
  .fc-compare-dot { position:absolute; top:50%; transform:translate(-50%,-50%); width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 1px 3px rgba(0,0,0,.15); }
  .fc-compare-labels { display:flex; justify-content:space-between; font-family:var(--mono); font-size:10px; color:var(--ink-3); }
  .fc-compare-verdict { font-size:13px; font-weight:600; margin-top:6px; font-family:var(--sans); display:flex; align-items:center; gap:6px; }
  .fc-seg-note { font-size:10px; color:var(--ink-3); margin-top:4px; font-family:var(--mono); }
  .fc-proj-label { font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:6px; font-family:var(--sans); }
  .fc-proj-table { border:1px solid var(--rule); border-radius:4px; overflow:hidden; }
  .fc-proj-head { display:grid; grid-template-columns:60px 1fr 1fr 1fr; padding:6px 14px; border-bottom:1px solid var(--rule); background:var(--white); }
  .fc-proj-head span { font-size:9px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); font-family:var(--sans); }
  .fc-proj-head span:not(:first-child) { text-align:right; }
  .fc-proj-row { display:grid; grid-template-columns:60px 1fr 1fr 1fr; padding:7px 14px; border-bottom:0.5px solid rgba(0,0,0,.05); align-items:center; }
  .fc-proj-row:last-child { border-bottom:none; }
  .fc-proj-year { font-size:12px; font-weight:600; color:var(--ink-2); font-family:var(--mono); }
  .fc-proj-cell { font-family:var(--mono); font-size:12px; color:var(--ink-2); text-align:right; }
  .fc-proj-cell.fees { color:#C53030; }
  .fc-nego-section { margin-top:12px; padding:12px 14px; border:1px solid var(--rule); background:var(--white); border-radius:4px; }
  .fc-nego-label { font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:6px; font-family:var(--sans); }
  .fc-nego-sub { font-size:10px; color:var(--ink-3); margin-bottom:8px; font-family:var(--mono); line-height:1.5; }
  .fc-nego-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
  .fc-nego-cell { padding:8px 10px; border:0.5px solid var(--rule); background:#fff; border-radius:4px; text-align:center; }
  .fc-nego-cell-label { font-size:9px; color:var(--ink-3); margin-bottom:2px; text-transform:uppercase; letter-spacing:.1em; font-weight:600; font-family:var(--sans); }
  .fc-nego-cell-val { font-family:var(--serif); font-size:18px; font-weight:700; color:var(--green); }
  .fc-nego-cta {
    display:flex; align-items:center; justify-content:center; gap:6px;
    margin-top:10px; padding:10px; border-radius:4px;
    background:var(--green); color:#fff; text-decoration:none;
    font-family:var(--sans); font-size:13px; font-weight:600;
    transition:background .15s;
  }
  .fc-nego-cta:hover { background:var(--green-2); }
  .fc-nego-cta svg { transition:transform .15s; }
  .fc-nego-cta:hover svg { transform:translateX(3px); }
  .fc-cta {
    display:flex; align-items:center; justify-content:center; gap:8px;
    width:100%; margin-top:16px;
    background:var(--green); color:#fff;
    font-family:var(--sans); font-size:13px; font-weight:600;
    padding:12px; text-decoration:none; border:none; cursor:pointer;
    transition:background .2s; border-radius:4px;
  }
  .fc-cta:hover { background:var(--green-2); }
  .fc-cta-secondary {
    display:block; text-align:center; margin-top:8px;
    font-family:var(--sans); font-size:13px; font-weight:600; color:var(--green);
    text-decoration:none; transition:color .15s;
  }
  .fc-cta-secondary:hover { color:var(--green-2); }

  /* Zone 3: Tier schedule */
  .fc-tiers { border-top:0.5px solid var(--rule); }
  .fc-tiers-head {
    display:grid; grid-template-columns:1fr 1fr; padding:8px 20px;
    border-bottom:0.5px solid var(--rule); background:var(--white);
  }
  .fc-tiers-head span { font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); text-align:center; }
  .fc-tier {
    display:grid; grid-template-columns:1fr 1fr; align-items:center;
    padding:10px 20px; transition:background .12s;
    min-height:40px; border-bottom:0.5px solid rgba(0,0,0,.05);
  }
  .fc-tier:last-child { border-bottom:none; }
  .fc-tier:hover { background:rgba(45,189,116,.03); }
  .fc-tier.active { background:rgba(45,189,116,.06); border-left:2px solid var(--green-3); padding-left:18px; }
  .fc-tier-label { font-family:var(--sans); font-size:13px; color:var(--ink-2); text-align:center; }
  .fc-tier-rate { font-family:var(--mono); font-size:13px; font-weight:400; color:var(--ink-2); text-align:center; }

  @media (max-width:640px) {
    .fc-output-grid { grid-template-columns:1fr; }
    .fc-out-cell { border-right:none; border-bottom:1px solid var(--rule); }
    .fc-out-cell:last-child { border-bottom:none; }
    .fc-out-val { font-size:22px; }
    .fc-proj-head { grid-template-columns:50px 1fr 1fr 1fr; padding:6px 10px; }
    .fc-proj-row { grid-template-columns:50px 1fr 1fr 1fr; padding:6px 10px; }
  }
`;

export default function FeeCalculator({
  feeTiers, crd, firmAum, industryOnly = false,
  feeTypeDisplay, feeNotes, minAccount, minFee, sortedFeeTiers,
  feeRangeMin, feeRangeMax, avgClientSize,
}: FeeCalculatorProps) {
  const [rawInput, setRawInput] = useState(() =>
    minAccount ? minAccount.toLocaleString('en-US') : ''
  );
  const [showDetail, setShowDetail] = useState(false);

  const amount = useMemo(() => {
    const num = parseInt(rawInput.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return 0;
    return Math.min(num, MAX_INPUT);
  }, [rawInput]);

  // Use real tiers, or synthesize from range data if available, or flat rate
  const tiers = useMemo(() => {
    if (feeTiers && feeTiers.length > 0) return feeTiers;
    if (feeRangeMin != null && feeRangeMax != null && avgClientSize && avgClientSize > 0) {
      return synthesizeRangeTiers(feeRangeMin, feeRangeMax, avgClientSize);
    }
    if (feeRangeMax != null && avgClientSize && avgClientSize > 0) {
      return synthesizeMaxOnlyTiers(feeRangeMax, avgClientSize);
    }
    if (feeRangeMax != null) {
      return [{ min_aum: '0', max_aum: null, fee_pct: feeRangeMax }];
    }
    return [];
  }, [feeTiers, feeRangeMin, feeRangeMax, avgClientSize]);
  const isSynthetic = (feeTiers == null || feeTiers.length === 0) && tiers.length > 0;
  const displayTiers = isSynthetic
    ? [...tiers].sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'))
    : sortedFeeTiers || [];
  const industryBp = useMemo(() => amount > 0 ? getClosestBreakpoint(amount) : null, [amount]);
  const segmentMedian = useMemo(() => amount > 0 ? getSegmentMedian(amount, firmAum) : null, [amount, firmAum]);

  const isBelowMin = minAccount != null && amount > 0 && amount < minAccount;
  const useMinFeeFloor = isBelowMin && minFee != null;

  const feeResult = useMemo((): CalcResult => {
    if (useMinFeeFloor) return { totalFee: minFee!, usedIndustryFallback: false, fallbackTierMin: null };
    if (tiers.length > 0 && !industryOnly) return calcTieredFee(amount, tiers);
    if (industryBp && amount > 0) return { totalFee: amount * (industryBp.median / 100), usedIndustryFallback: false, fallbackTierMin: null };
    return { totalFee: 0, usedIndustryFallback: false, fallbackTierMin: null };
  }, [amount, tiers, industryOnly, industryBp, useMinFeeFloor, minFee]);
  const annualFee = feeResult.totalFee;
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

  const verdictColor = (firmRate: number, median: number) => {
    if (firmRate < median - 0.005) return '#1A7A4A';
    if (firmRate > median + 0.005) return '#EF4444';
    return '#F59E0B';
  };

  const activeTierIdx = getActiveTierIndex(amount, displayTiers);

  return (
    <div className="fc-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Zone 1: Summary strip */}
      {feeTypeDisplay && (
        <div className="fc-summary">
          <div className="fc-summary-cell">
            <div className="fc-summary-label">Fee Structure</div>
            <div className="fc-summary-val">{feeTypeDisplay}</div>
          </div>
          <div className="fc-summary-cell">
            <div className="fc-summary-label">Est. Minimum Annual Fee</div>
            <div className="fc-summary-val">
              {minFee ? formatCurrency(minFee) : minAccount ? `${formatAUM(minAccount)} min` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Zone 2: Tier schedule (above calculator) */}
      {displayTiers.length > 0 && (
        <div className="fc-tiers">
          <div className="fc-tiers-head">
            <span>AUM Tier</span>
            <span>Annual Rate</span>
          </div>
          {displayTiers.map((tier, i) => {
            const minVal = parseInt(tier.min_aum || '0');
            const isFirst = i === 0 && minVal === 0;
            const isLast = !tier.max_aum;
            const tierLabel = isFirst
              ? `Up to ${formatCurrency(displayTiers[1]?.min_aum ? parseInt(displayTiers[1].min_aum) : tier.max_aum || 0)}`
              : isLast
                ? `${formatCurrency(minVal)}+`
                : `${formatCurrency(minVal)} – ${formatCurrency(tier.max_aum!)}`;
            return (
              <div key={i} className={`fc-tier${i === activeTierIdx ? ' active' : ''}`}>
                <span className="fc-tier-label">{tierLabel}</span>
                <span className="fc-tier-rate">
                  {tier.fee_pct != null
                    ? `${tier.fee_pct}%`
                    : feeResult.usedIndustryFallback && i === activeTierIdx
                      ? `Negotiated · est. ${(getIndustryMedianRate(amount) * 100).toFixed(2)}%`
                      : 'Negotiated'}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {isSynthetic && feeRangeMax != null && feeRangeMin == null && (
        <div className="fc-industry-note" style={{ marginTop: 8 }}>
          Fee tiers estimated from the disclosed maximum rate ({feeRangeMax}%) and industry data. Actual fees may be lower — contact the firm for their current schedule.
        </div>
      )}

      {/* Zone 3: Calculator */}
      <div className="fc-calc">
        <div className="fc-input-label">Your Portfolio Value</div>
        <div className="fc-input-wrap">
          <span className="fc-prefix">$</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter Portfolio Value"
            value={rawInput}
            onChange={handleChange}
            className="fc-input"
          />
        </div>
        {minAccount && amount === minAccount && (
          <div className="fc-input-hint">Pre-filled with {formatAUM(minAccount)} investment minimum · edit to see other estimates</div>
        )}
        {!hasFirmFees && amount === 0 && (
          <div className="fc-input-hint">Estimates based on industry averages — firm fees not disclosed</div>
        )}
        {isBelowMin && !useMinFeeFloor && (
          <div className="fc-min-note">Below stated investment minimum of {formatAUM(minAccount)}</div>
        )}
        {useMinFeeFloor && (
          <div className="fc-min-note">Minimum annual fee of {formatCurrency(minFee!)} applies for accounts below {formatAUM(minAccount)}</div>
        )}

        {feeResult.usedIndustryFallback && feeResult.fallbackTierMin != null && (
          <div className="fc-min-note" style={{ color: 'var(--ink-3)' }}>
            Rate above {formatAUM(feeResult.fallbackTierMin)} estimated from industry median — contact firm for negotiated rate
          </div>
        )}

        {amount > 0 && (
          <>
            {!hasFirmFees && (
              <div className="fc-industry-note">
                This firm does not disclose a standard fee schedule. Estimates below are based on industry averages for comparable firms.
              </div>
            )}

            {/* Top-line results — always visible */}
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

            {/* Toggle for detailed analysis */}
            <button className="fc-detail-toggle" onClick={() => setShowDetail(!showDetail)} aria-expanded={showDetail}>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 10 10"
                style={{ transform: showDetail ? 'rotate(90deg)' : 'rotate(0)' }}>
                <path d="M3 1.5l4 3.5-4 3.5" />
              </svg>
              {showDetail ? 'Hide detailed analysis' : 'Show detailed analysis'}
            </button>

            {/* Detailed analysis — collapsed by default */}
            {showDetail && (
              <>
                {industryBp && (
                  <div className="fc-compare-section" style={{ marginTop: 12 }}>
                    <div className="fc-compare-label">Industry Comparison · {industryBp.label} Peer Group</div>
                    <div className="fc-compare-track">
                      <div className="fc-compare-median" style={{ left: `${Math.min((industryBp.median / Math.max(industryBp.p75 * 1.3, effectiveRate * 1.1, 0.01)) * 100, 98)}%` }} />
                      <div className="fc-compare-dot" style={{ left: `${Math.min((effectiveRate / Math.max(industryBp.p75 * 1.3, effectiveRate * 1.1, 0.01)) * 100, 98)}%`, background: verdictColor(effectiveRate, industryBp.median) }} />
                    </div>
                    <div className="fc-compare-labels">
                      <span>P25: {industryBp.p25.toFixed(2)}%</span>
                      <span>Median: {industryBp.median.toFixed(2)}%</span>
                      <span>P75: {industryBp.p75.toFixed(2)}%</span>
                    </div>
                    {hasFirmFees && (
                      <div className="fc-compare-verdict" style={{ color: verdictColor(effectiveRate, industryBp.median) }}>
                        {effectiveRate < industryBp.median - 0.005
                          ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />{(industryBp.median - effectiveRate).toFixed(2)}% below median</>
                          : effectiveRate > industryBp.median + 0.005
                          ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />{(effectiveRate - industryBp.median).toFixed(2)}% above median</>
                          : <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />At the industry median</>}
                      </div>
                    )}
                    {segmentMedian !== null && (
                      <div className="fc-seg-note">{getSegmentLabel(firmAum)} median: {segmentMedian.toFixed(2)}%</div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <div className="fc-proj-label">Portfolio Projection · 7% Annual Return</div>
                  <div className="fc-proj-table">
                    <div className="fc-proj-head">
                      <span>Horizon</span><span>No Fees</span><span>With Fees</span><span>Fees Paid</span>
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

                {effectiveRate > 0.10 && (
                  <div className="fc-nego-section">
                    <div className="fc-nego-label">Fee Negotiation Impact</div>
                    <div className="fc-nego-sub">
                      Estimated savings if you negotiated a 10bp reduction: {effectiveRate.toFixed(2)}% &rarr; {lowerRate.toFixed(2)}%
                    </div>
                    <div className="fc-nego-grid">
                      {[5, 10, 20].map((y) => {
                        const current = projectGrowth(amount, effectiveRate / 100, y);
                        const lower = projectGrowth(amount, lowerRate / 100, y);
                        const savings = lower.value - current.value;
                        return (
                          <div key={y} className="fc-nego-cell">
                            <div className="fc-nego-cell-label">{y}yr Savings</div>
                            <div className="fc-nego-cell-val">{formatCompact(savings)}</div>
                          </div>
                        );
                      })}
                    </div>
                    <a
                      href={`/negotiate?crd=${crd}&aum=${amount}&fee=${effectiveRate.toFixed(2)}`}
                      className="fc-nego-cta"
                    >
                      See your negotiation plan
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 14 14">
                        <path d="M5 3l4 4-4 4" />
                      </svg>
                    </a>
                  </div>
                )}
              </>
            )}

          </>
        )}
      </div>
    </div>
  );
}
