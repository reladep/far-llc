'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';

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

  // Color for comparison
  const getCompColor = (firmRate: number, median: number) => {
    if (firmRate < median - 0.005) return 'text-green-700';
    if (firmRate > median + 0.005) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getBgColor = (firmRate: number, median: number) => {
    if (firmRate < median - 0.005) return 'bg-green-500';
    if (firmRate > median + 0.005) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Fee Calculator</h2>
        <p className="text-xs text-slate-500 mb-4">
          {hasFirmFees
            ? 'Enter your investable assets to see fees, projections, and industry comparison'
            : 'Enter your investable assets to see estimated fees based on industry averages'}
        </p>
        
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter investable assets"
            value={rawInput}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-7 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {amount > 0 && (
          <div className="mt-6 space-y-6">
            {/* Industry averages disclaimer */}
            {!hasFirmFees && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-sm font-medium text-amber-800">⚠️ Industry Averages</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  This firm does not disclose a standard fee schedule. The estimates below are based on industry averages for comparable firms and may not reflect actual fees.
                </p>
              </div>
            )}
            {/* Top-level result */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-green-50 p-4 overflow-hidden">
                <p className="text-xs text-slate-500">{hasFirmFees ? 'Estimated Annual Fee' : 'Est. Annual Fee (Industry Median)'}</p>
                <p className="text-xl font-bold text-green-700 truncate">{formatCompact(annualFee)}</p>
                <p className="text-xs text-slate-500">{effectiveRate.toFixed(2)}% effective rate</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 overflow-hidden">
                <p className="text-xs text-slate-500">Quarterly Cost</p>
                <p className="text-xl font-bold text-slate-700 truncate">{formatCompact(annualFee / 4)}</p>
                <p className="text-xs text-slate-500">per quarter</p>
              </div>
            </div>

            {/* Industry Comparison */}
            {industryBp && (
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Industry Comparison <span className="text-xs font-normal text-slate-400">(closest to {industryBp.label} • 207 firms)</span>
                </h3>
                
                {/* Visual bar comparison */}
                <div className="space-y-3">
                  {/* This firm */}
                  {hasFirmFees && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-semibold ${getCompColor(effectiveRate, industryBp.median)}`}>This Firm</span>
                      <span className={`font-semibold ${getCompColor(effectiveRate, industryBp.median)}`}>{effectiveRate.toFixed(2)}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getBgColor(effectiveRate, industryBp.median)}`} style={{ width: `${Math.min((effectiveRate / Math.max(industryBp.p75 * 1.3, effectiveRate * 1.1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                  )}

                  {/* P25 / Median / P75 range */}
                  <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden mt-2">
                    {/* P25-P75 range */}
                    <div
                      className="absolute top-0 h-full bg-slate-200 rounded-full"
                      style={{
                        left: `${(industryBp.p25 / Math.max(industryBp.p75 * 1.3, effectiveRate * 1.1)) * 100}%`,
                        width: `${((industryBp.p75 - industryBp.p25) / Math.max(industryBp.p75 * 1.3, effectiveRate * 1.1)) * 100}%`,
                      }}
                    />
                    {/* Median line */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-slate-500"
                      style={{ left: `${(industryBp.median / Math.max(industryBp.p75 * 1.3, effectiveRate * 1.1)) * 100}%` }}
                    />
                    {/* Firm marker */}
                    <div
                      className={`absolute top-0.5 w-3 h-3 rounded-full border-2 border-white shadow ${getBgColor(effectiveRate, industryBp.median)}`}
                      style={{ left: `${Math.min((effectiveRate / Math.max(industryBp.p75 * 1.3, effectiveRate * 1.1)) * 100, 98)}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 -mt-1">
                    <span>P25: {industryBp.p25.toFixed(2)}%</span>
                    <span>Median: {industryBp.median.toFixed(2)}%</span>
                    <span>P75: {industryBp.p75.toFixed(2)}%</span>
                  </div>

                  {/* Verdict */}
                  {hasFirmFees ? (
                    <p className={`text-sm font-medium mt-1 ${getCompColor(effectiveRate, industryBp.median)}`}>
                      {effectiveRate < industryBp.median - 0.005
                        ? `✓ ${(industryBp.median - effectiveRate).toFixed(2)}% below median — below average cost`
                        : effectiveRate > industryBp.median + 0.005
                        ? `⚠ ${(effectiveRate - industryBp.median).toFixed(2)}% above median — above average cost`
                        : '— At the industry median'}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">
                      Showing industry median fee for this asset level. Actual fees at this firm may differ.
                    </p>
                  )}

                  {segmentMedian !== null && (
                    <p className="text-xs text-slate-500">
                      {getSegmentLabel(firmAum)} median: {segmentMedian.toFixed(2)}%
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Portfolio Value Projections */}
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Portfolio Value Net of Fees</h3>
              <p className="text-[10px] text-slate-400 mb-3">Assumes 7% annual return</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="py-2 text-xs text-slate-500 font-medium">Horizon</th>
                      <th className="py-2 text-xs text-slate-500 font-medium text-right">No Fees</th>
                      <th className="py-2 text-xs text-slate-500 font-medium text-right">With Fees</th>
                      <th className="py-2 text-xs text-slate-500 font-medium text-right">Total Fees Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[5, 10, 20].map((y) => {
                      const noFee = projectNoFee(amount, y);
                      const withFee = projectGrowth(amount, effectiveRate / 100, y);
                      return (
                        <tr key={y} className="border-b border-slate-100">
                          <td className="py-2 font-medium text-slate-700">{y} years</td>
                          <td className="py-2 text-right text-slate-600 truncate">{formatCompact(noFee)}</td>
                          <td className="py-2 text-right text-slate-900 font-medium truncate">{formatCompact(withFee.value)}</td>
                          <td className="py-2 text-right text-red-600 truncate">{formatCompact(withFee.totalFees)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 10bp Lower Scenario */}
            {effectiveRate > 0.10 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">💡 What if fees were 10bp lower?</h3>
                <p className="text-xs text-blue-700 mb-3">
                  {effectiveRate.toFixed(2)}% → {lowerRate.toFixed(2)}% ({formatCompact(annualFee)} → {formatCompact(lowerFee)}/yr)
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[5, 10, 20].map((y) => {
                    const current = projectGrowth(amount, effectiveRate / 100, y);
                    const lower = projectGrowth(amount, lowerRate / 100, y);
                    const savings = lower.value - current.value;
                    return (
                      <div key={y} className="rounded-lg bg-white/70 p-2">
                        <p className="text-xs text-blue-500">{y}yr savings</p>
                        <p className="text-sm font-bold text-blue-800 truncate">{formatCompact(savings)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Link
              href={`/compare?add=${crd}`}
              className="block w-full text-center rounded-lg bg-green-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Compare This Firm
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
