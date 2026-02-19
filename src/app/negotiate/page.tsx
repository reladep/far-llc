'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

// ── Industry data (copied from FeeCalculator.tsx) ────────────────────
const INDUSTRY_ALL = [
  { breakpoint: 500_000, label: '$500K', avg: 1.205, p25: 1.00, median: 1.00, p75: 1.49 },
  { breakpoint: 1_000_000, label: '$1M', avg: 1.058, p25: 0.90, median: 1.00, p75: 1.25 },
  { breakpoint: 5_000_000, label: '$5M', avg: 0.717, p25: 0.50, median: 0.70, p75: 0.90 },
  { breakpoint: 10_000_000, label: '$10M', avg: 0.581, p25: 0.40, median: 0.55, p75: 0.75 },
  { breakpoint: 25_000_000, label: '$25M', avg: 0.528, p25: 0.35, median: 0.50, p75: 0.75 },
  { breakpoint: 50_000_000, label: '$50M', avg: 0.505, p25: 0.30, median: 0.50, p75: 0.70 },
  { breakpoint: 100_000_000, label: '$100M', avg: 0.489, p25: 0.25, median: 0.50, p75: 0.65 },
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

function formatDollar(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return formatDollar(n);
}

function projectGrowth(principal: number, annualFeeRate: number, years: number, returnRate = 0.07) {
  let value = principal;
  let totalFees = 0;
  for (let y = 0; y < years; y++) {
    const fee = value * annualFeeRate;
    totalFees += fee;
    value = (value - fee) * (1 + returnRate);
  }
  return { value, totalFees };
}

// ── Metadata (exported for layout) ───────────────────────────────────
// Note: metadata export doesn't work in 'use client' files.
// We set title via <title> in the head instead.

export default function NegotiatePage() {
  const [rawAum, setRawAum] = useState('');
  const [rawFee, setRawFee] = useState('');
  const [feeMode, setFeeMode] = useState<'flat' | 'tiered' | 'dollar'>('flat');
  const [showResults, setShowResults] = useState(false);
  
  // Tiered fee support for percentage mode - start with 2 tiers
  const [feeTiers, setFeeTiers] = useState<{ min: number; max: number | null; fee: number }[]>([
    { min: 0, max: 500000, fee: 1.0 },
    { min: 500000, max: null, fee: 0.8 }
  ]);
  const [tierFeeRaw, setTierFeeRaw] = useState<Record<number, string>>({});
  const [showMinAumWarning, setShowMinAumWarning] = useState(false);
  const [showDollarFeeWarning, setShowDollarFeeWarning] = useState(false);
  
  const addFeeTier = useCallback(() => {
    if (feeTiers.length >= 7) return;
    const lastTier = feeTiers[feeTiers.length - 1];
    const newMin = lastTier.max || (lastTier.min * 2) || 500000;
    // New tier fee must be lower than the previous tier, capped at 3%
    const newFee = Math.max(0, Math.round((lastTier.fee - 0.1) * 100) / 100);
    setFeeTiers([...feeTiers, { min: newMin, max: null, fee: newFee }]);
  }, [feeTiers]);
  
  const updateFeeTier = useCallback((index: number, field: 'min' | 'max' | 'fee', value: number | null) => {
    const newTiers = [...feeTiers];
    if (field === 'fee' && typeof value === 'number') {
      // Cap at 3%
      value = Math.min(value, 3);
      // Enforce descending: must be less than previous tier's fee
      if (index > 0 && value >= newTiers[index - 1].fee) {
        value = Math.max(0, newTiers[index - 1].fee - 0.01);
        value = Math.round(value * 100) / 100;
      }
    }
    newTiers[index] = { ...newTiers[index], [field]: value };
    // Auto-fill next tier's min to match this tier's max
    if (field === 'max' && index < newTiers.length - 1 && value !== null) {
      newTiers[index + 1] = { ...newTiers[index + 1], min: value };
    }
    // If fee changed, cascade: ensure all subsequent tiers are still descending
    if (field === 'fee') {
      for (let i = index + 1; i < newTiers.length; i++) {
        if (newTiers[i].fee >= newTiers[i - 1].fee) {
          newTiers[i] = { ...newTiers[i], fee: Math.max(0, Math.round((newTiers[i - 1].fee - 0.01) * 100) / 100) };
        }
      }
    }
    setFeeTiers(newTiers);
  }, [feeTiers]);
  
  const removeFeeTier = useCallback((index: number) => {
    if (feeTiers.length <= 2) return;
    const newTiers = feeTiers.filter((_, i) => i !== index);
    setFeeTiers(newTiers);
  }, [feeTiers]);

  const aum = useMemo(() => {
    const num = parseInt(rawAum.replace(/[^0-9]/g, ''), 10);
    // Max $30M for dollar mode, $1B for percent modes
    const maxAum = feeMode === 'dollar' ? 30_000_000 : 1_000_000_000;
    return isNaN(num) ? 0 : Math.min(num, maxAum);
  }, [rawAum, feeMode]);

  // Calculate effective fee percentage based on mode
  const feePercent = useMemo(() => {
    if (feeMode === 'dollar') {
      // Dollar amount -> convert to percentage, capped at 3%
      const num = parseFloat(rawFee.replace(/[^0-9.]/g, ''));
      if (isNaN(num) || aum === 0) return 0;
      return Math.min((num / aum) * 100, 3);
    } else if (feeMode === 'tiered') {
      // Blended/weighted fee across all tiers
      if (feeTiers.length > 0 && aum > 0) {
        let totalFee = 0;
        let remaining = aum;
        for (const tier of feeTiers) {
          if (remaining <= 0) break;
          const tierMax = tier.max ?? Infinity;
          const tierSize = Math.min(remaining, tierMax - tier.min);
          if (tierSize > 0) {
            totalFee += tierSize * (Math.min(tier.fee, 3) / 100);
            remaining -= tierSize;
          }
        }
        return aum > 0 ? (totalFee / aum) * 100 : 0;
      }
      return 0;
    } else {
      // Flat percentage
      const num = parseFloat(rawFee);
      return isNaN(num) ? 0 : Math.max(0, Math.min(num, 3));
    }
  }, [rawFee, feeMode, aum, feeTiers]);

  const hasValidInput = aum >= 10_000 && feePercent > 0;

  const bracket = useMemo(() => (aum > 0 ? getClosestBreakpoint(aum) : null), [aum]);

  const annualFee = aum * (feePercent / 100);
  const medianFee = bracket ? aum * (bracket.median / 100) : 0;
  const feeDiff = annualFee - medianFee;
  const bps = Math.round(feePercent * 100);
  const medianBps = bracket ? Math.round(bracket.median * 100) : 0;

  const isOverpaying = bracket ? feePercent > bracket.median + 0.005 : false;
  const isSignificantlyOver = bracket ? feePercent > bracket.p75 : false;
  const isUnder = bracket ? feePercent < bracket.median - 0.005 : false;

  // 10-year compounding impact
  const tenYearCurrent = useMemo(() => projectGrowth(aum, feePercent / 100, 10), [aum, feePercent]);
  const tenYearMedian = useMemo(() => bracket ? projectGrowth(aum, bracket.median / 100, 10) : null, [aum, bracket]);
  const compoundingCost = tenYearMedian ? tenYearMedian.value - tenYearCurrent.value : 0;

  // Gauge positioning
  const gaugeMax = bracket ? Math.max(bracket.p75 * 1.4, feePercent * 1.15) : 2;
  const pctPos = (val: number) => Math.min((val / gaugeMax) * 100, 100);

  const handleAumChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    if (!digits) { setRawAum(''); setShowResults(false); return; }
    let num = parseInt(digits, 10);
    const maxAum = feeMode === 'dollar' ? 30_000_000 : 1_000_000_000;
    if (num > maxAum) num = maxAum;
    setRawAum(num.toLocaleString('en-US'));
  }, [feeMode]);

  const handleFeeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (feeMode === 'dollar') {
      // Strip to digits only, parse as integer, cap at 3% of AUM
      const digits = val.replace(/[^0-9]/g, '');
      if (!digits) { setRawFee(''); return; }
      let num = parseInt(digits, 10);
      if (isNaN(num)) { setRawFee(''); return; }
      const maxDollar = aum > 0 ? Math.floor(aum * 0.03) : 999_999_999;
      if (num > maxDollar && aum > 0) {
        num = maxDollar;
        setShowDollarFeeWarning(true);
        setTimeout(() => setShowDollarFeeWarning(false), 4000);
      }
      setRawFee(num.toLocaleString('en-US'));
      return;
    }
    if (feeMode === 'flat') {
      // Only allow digits, one decimal, max 2 decimal places, max 3%
      if (val !== '' && !/^\d*\.?\d{0,2}$/.test(val)) return;
      const num = parseFloat(val);
      if (!isNaN(num) && num > 3) {
        setRawFee('3');
        return;
      }
    }
    setRawFee(val);
  }, [feeMode, aum]);

  const handleCalculate = useCallback(() => {
    if (aum > 0 && aum < 10_000) {
      setShowMinAumWarning(true);
      setTimeout(() => setShowMinAumWarning(false), 3000);
      return;
    }
    if (hasValidInput) setShowResults(true);
  }, [hasValidInput, aum]);

  // Negotiation talking points
  const talkingPoints = useMemo(() => {
    if (!bracket || !hasValidInput) return [];
    const points: { icon: string; text: string; link?: string }[] = [];

    if (isOverpaying) {
      points.push({
        icon: '💰',
        text: `Your portfolio of ${formatCompact(aum)} qualifies for lower rates at most advisory firms. You're currently paying ${bps} bps — the industry median for your asset level is ${medianBps} bps.`,
      });
    }

    // Breakpoint advice
    const nextBreakpoint = INDUSTRY_ALL.find((b) => b.breakpoint > aum);
    if (nextBreakpoint && (nextBreakpoint.breakpoint - aum) / aum < 0.5) {
      points.push({
        icon: '📊',
        text: `Ask about breakpoints — many firms reduce fees above ${nextBreakpoint.label}. You're ${formatCompact(nextBreakpoint.breakpoint - aum)} away from the next tier.`,
      });
    }

    points.push({
      icon: '🎯',
      text: `Reference the industry median of ${medianBps} bps (${bracket.median.toFixed(2)}%) for portfolios near ${bracket.label}. Data-backed negotiation is the most effective approach.`,
    });

    points.push({
      icon: '📋',
      text: `Request a formal fee schedule review. Advisors expect this conversation — it signals you're informed, not adversarial.`,
    });

    if (feeDiff > 0) {
      points.push({
        icon: '📈',
        text: `Emphasize the long-term impact: the ${(feePercent - bracket.median).toFixed(2)}% difference costs you ${formatCompact(compoundingCost)} over 10 years in lost portfolio growth.`,
      });
    }

    if (isSignificantlyOver) {
      points.push({
        icon: '🔍',
        text: `Your fees are above the 75th percentile. If your advisor won't negotiate, it may be worth exploring other options.`,
        link: '/search',
      });
    }

    return points;
  }, [bracket, hasValidInput, aum, bps, medianBps, feePercent, feeDiff, compoundingCost, isOverpaying, isSignificantlyOver]);

  const feeColor = isSignificantlyOver
    ? 'text-red-600'
    : isOverpaying
    ? 'text-amber-600'
    : 'text-green-600';

  const feeBgColor = isSignificantlyOver
    ? 'bg-red-500'
    : isOverpaying
    ? 'bg-amber-500'
    : 'bg-green-500';

  const feeLabel = isSignificantlyOver
    ? 'Above 75th Percentile'
    : isOverpaying
    ? 'Above Median'
    : isUnder
    ? 'Below Median'
    : 'At Median';

  return (
    <>
      <title>Fee Negotiator — Are You Overpaying Your Advisor? | FAR</title>
      <meta name="description" content="Find out if you're overpaying your financial advisor. Compare your fees to industry benchmarks and get a personalized negotiation playbook." />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary-50 to-bg-primary border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20 text-center">
            <Badge className="mb-4">Free Tool</Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
              Are You Overpaying Your Advisor?
            </h1>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              Compare your advisory fees to industry benchmarks and get a personalized
              negotiation playbook — backed by data from thousands of SEC-registered firms.
            </p>
          </div>
        </section>

        {/* Input Section */}
        <section className="mx-auto max-w-2xl px-4 -mt-8 relative z-10">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-6">
                {/* AUM Input */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Your Portfolio Value (AUM)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary font-medium">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 1,000,000"
                      value={rawAum}
                      onChange={handleAumChange}
                      className="w-full h-12 rounded-lg border border-border bg-bg-primary pl-8 pr-4 text-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Fee Input */}
                <div>
                  {/* Three-mode toggle */}
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text-primary">Your Fee</label>
                    <div className="flex rounded-lg bg-secondary-100 p-1">
                      <button
                        type="button"
                        onClick={() => { setFeeMode('flat'); setRawFee(''); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          feeMode === 'flat' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Flat %
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFeeMode('tiered'); setRawFee(''); setTierFeeRaw({}); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          feeMode === 'tiered' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Tiered %
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFeeMode('dollar'); setRawFee(''); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          feeMode === 'dollar' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Dollar
                      </button>
                    </div>
                  </div>
                  
                  {feeMode === 'tiered' ? (
                    /* Tiered fee inputs */
                    <div className="space-y-3">
                      {feeTiers.map((tier, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs text-text-tertiary w-8">From</span>
                            <div className="relative flex-1">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={tier.min === 0 ? '0' : tier.min.toLocaleString()}
                                readOnly
                                className="w-full h-10 rounded-lg border border-border bg-secondary-100 pl-6 pr-2 text-sm text-text-secondary cursor-not-allowed"
                              />
                            </div>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs text-text-tertiary w-6">To</span>
                            <div className="relative flex-1">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                              {index === feeTiers.length - 1 ? (
                                <input
                                  type="text"
                                  value="∞"
                                  readOnly
                                  className="w-full h-10 rounded-lg border border-border bg-secondary-100 pl-6 pr-2 text-sm text-text-secondary cursor-not-allowed"
                                />
                              ) : (
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Enter amount"
                                  value={tier.max !== null ? tier.max.toLocaleString() : ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    updateFeeTier(index, 'max', val === '' ? null : parseInt(val, 10));
                                  }}
                                  className="w-full h-10 rounded-lg border border-border bg-bg-primary pl-6 pr-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400"
                                />
                              )}
                            </div>
                          </div>
                          <div className="w-20 flex items-center gap-1">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={tierFeeRaw[index] !== undefined ? tierFeeRaw[index] : (tier.fee > 0 ? tier.fee.toString() : '')}
                              onFocus={() => {
                                if (tierFeeRaw[index] === undefined) {
                                  setTierFeeRaw(prev => ({ ...prev, [index]: tier.fee > 0 ? tier.fee.toString() : '' }));
                                }
                              }}
                              onBlur={() => {
                                // Clear raw tracking on blur so it shows the clamped value
                                setTierFeeRaw(prev => { const n = { ...prev }; delete n[index]; return n; });
                              }}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
                                  setTierFeeRaw(prev => ({ ...prev, [index]: raw }));
                                  const val = parseFloat(raw);
                                  updateFeeTier(index, 'fee', isNaN(val) ? 0 : val);
                                }
                              }}
                              className="w-full h-10 rounded-lg border border-border bg-bg-primary px-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 text-right"
                            />
                            <span className="text-text-tertiary text-sm">%</span>
                          </div>
                          {feeTiers.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeFeeTier(index)}
                              className="text-red-400 hover:text-red-300 text-sm px-2"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {feeTiers.length < 7 && (
                        <button
                          type="button"
                          onClick={addFeeTier}
                          className="text-sm text-primary hover:text-primary-700 font-medium"
                        >
                          + Add Tier
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Flat % or Dollar input */
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary font-medium">
                        {feeMode === 'dollar' ? '$' : '%'}
                      </span>
                      <input
                        type="text"
                        inputMode={feeMode === 'dollar' ? 'numeric' : 'decimal'}
                        placeholder={feeMode === 'dollar' ? 'e.g. 10,000' : 'e.g. 1.00'}
                        value={rawFee}
                        onChange={handleFeeChange}
                        className="w-full h-12 rounded-lg border border-border bg-bg-primary pl-8 pr-4 text-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary transition-colors"
                      />
                    </div>
                  )}
                  
                  {/* Warning for >3% fee in flat mode */}
                  {feeMode === 'flat' && rawFee && (() => {
                    const inputFee = parseFloat(rawFee);
                    if (!isNaN(inputFee) && inputFee > 3) {
                      return (
                        <p className="text-xs text-red-400 mt-2">
                          Maximum allowable fee is 3%. If you're paying more than that, contact us ASAP so we can help you fire that firm!
                        </p>
                      );
                    }
                    return null;
                  })()}
                  
                  {showDollarFeeWarning && (
                    <p className="text-xs text-red-400 mt-2">
                      Maximum fee is 3% of your portfolio ({formatDollar(Math.floor(aum * 0.03))}). If you&apos;re paying more than that, contact us ASAP so we can help you fire that firm!
                    </p>
                  )}
                  
                  {feeMode === 'dollar' && aum > 0 && feePercent > 0 && (
                    <p className="text-xs text-text-tertiary mt-1">
                      = {feePercent.toFixed(2)}% of your portfolio
                    </p>
                  )}
                  
                  {(feeMode === 'flat' || feeMode === 'tiered') && aum > 0 && feePercent > 0 && (
                    <p className="text-xs text-text-tertiary mt-2">
                      {feeMode === 'tiered' && `Based on your AUM of ${formatCompact(aum)}, `}your effective fee is <span className="font-medium text-text-primary">{feePercent.toFixed(2)}%</span>
                    </p>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!hasValidInput}
                  onClick={handleCalculate}
                >
                  Analyze My Fees
                </Button>

                {showMinAumWarning && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center animate-in fade-in duration-300">
                    <p className="text-sm text-amber-700 font-medium">Minimum Portfolio Value is $10,000</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Results */}
        {showResults && hasValidInput && bracket && (
          <section className={`mx-auto max-w-2xl px-4 mt-8 pb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>

            {/* Fee Comparison Gauge */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Fee Comparison</CardTitle>
                  <Badge className={
                    isSignificantlyOver
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : isOverpaying
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-green-100 text-green-700 border-green-200'
                  }>
                    {feeLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary mb-4">
                  Your fee vs. industry benchmarks for portfolios near {bracket.label}
                </p>

                {/* Horizontal gauge */}
                <div className="relative mb-2">
                  <div className="h-8 bg-secondary-100 rounded-full overflow-hidden relative">
                    {/* P25-P75 shaded range */}
                    <div
                      className="absolute top-0 h-full bg-secondary-200 rounded-full"
                      style={{
                        left: `${pctPos(bracket.p25)}%`,
                        width: `${pctPos(bracket.p75) - pctPos(bracket.p25)}%`,
                      }}
                    />
                    {/* Median line */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-text-tertiary z-10"
                      style={{ left: `${pctPos(bracket.median)}%` }}
                    />
                    {/* User fee marker */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md z-20 ${feeBgColor}`}
                      style={{ left: `${pctPos(feePercent)}%` }}
                    />
                  </div>
                </div>

                {/* Gauge labels */}
                <div className="flex justify-between text-[11px] text-text-tertiary mb-4 mt-2">
                  <span>P25: {bracket.p25.toFixed(2)}%</span>
                  <span className="font-medium text-text-secondary">Median: {bracket.median.toFixed(2)}%</span>
                  <span>P75: {bracket.p75.toFixed(2)}%</span>
                </div>

                {/* Your fee callout */}
                <div className={`text-center py-3 rounded-lg ${
                  isSignificantlyOver ? 'bg-red-50' : isOverpaying ? 'bg-amber-50' : 'bg-green-50'
                }`}>
                  <span className="text-sm text-text-secondary">Your fee: </span>
                  <span className={`text-lg font-bold ${feeColor}`}>{feePercent.toFixed(2)}%</span>
                  <span className="text-sm text-text-secondary"> ({bps} bps)</span>
                </div>
              </CardContent>
            </Card>

            {/* Dollar Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dollar Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-secondary-50 p-4">
                    <p className="text-xs text-text-tertiary mb-1">You Pay Annually</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCompact(annualFee)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary-50 p-4">
                    <p className="text-xs text-text-tertiary mb-1">Median Advisor Charges</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCompact(medianFee)}</p>
                  </div>
                  <div className={`rounded-lg p-4 ${feeDiff > 0 ? 'bg-red-50' : feeDiff < 0 ? 'bg-green-50' : 'bg-secondary-50'}`}>
                    <p className="text-xs text-text-tertiary mb-1">
                      {feeDiff > 0 ? 'You Overpay By' : feeDiff < 0 ? 'You Save' : 'Difference'}
                    </p>
                    <p className={`text-2xl font-bold ${feeDiff > 0 ? 'text-red-600' : feeDiff < 0 ? 'text-green-600' : 'text-text-primary'}`}>
                      {feeDiff === 0 ? '$0' : formatCompact(Math.abs(feeDiff))}
                    </p>
                    <p className="text-xs text-text-tertiary">/year</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 10-Year Compounding Impact */}
            {tenYearMedian && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">10-Year Compounding Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary mb-4">
                    Assuming 7% annual market return, here&apos;s how fees compound over a decade.
                  </p>

                  <div className="space-y-3">
                    {/* Median fee projection */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">At median fee ({bracket.median.toFixed(2)}%)</span>
                        <span className="font-semibold text-green-600">{formatCompact(tenYearMedian.value)}</span>
                      </div>
                      <div className="h-4 bg-secondary-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-700"
                          style={{ width: `${(tenYearMedian.value / Math.max(tenYearMedian.value, tenYearCurrent.value) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Current fee projection */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">At your fee ({feePercent.toFixed(2)}%)</span>
                        <span className={`font-semibold ${feeColor}`}>{formatCompact(tenYearCurrent.value)}</span>
                      </div>
                      <div className="h-4 bg-secondary-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${feeBgColor}`}
                          style={{ width: `${(tenYearCurrent.value / Math.max(tenYearMedian.value, tenYearCurrent.value) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {compoundingCost > 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-100 text-center">
                      <p className="text-sm text-text-secondary">
                        Over 10 years, that fee difference costs you
                      </p>
                      <p className="text-3xl font-bold text-red-600 mt-1">
                        {formatCompact(compoundingCost)}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">in lost portfolio value</p>
                    </div>
                  )}

                  {compoundingCost <= 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-100 text-center">
                      <p className="text-sm text-text-secondary">
                        Your fees are at or below the median — you&apos;re in good shape! 🎉
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Negotiation Playbook */}
            {talkingPoints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Negotiation Playbook</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary mb-4">
                    Use these data-backed talking points in your next fee conversation.
                  </p>
                  <div className="space-y-4">
                    {talkingPoints.map((point, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="text-xl flex-shrink-0 mt-0.5">{point.icon}</span>
                        <div>
                          <p className="text-sm text-text-primary leading-relaxed">{point.text}</p>
                          {point.link && (
                            <Link
                              href={point.link}
                              className="text-sm text-primary hover:text-primary-700 font-medium mt-1 inline-block"
                            >
                              Browse advisors →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <div className="text-center py-4">
              <p className="text-text-secondary mb-4">
                Want to see what other advisors charge for your portfolio size?
              </p>
              <Link href="/search">
                <Button variant="primary" size="lg">
                  Find a Lower-Cost Advisor
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Bottom padding when no results */}
        {!showResults && <div className="pb-16" />}
      </div>
    </>
  );
}
