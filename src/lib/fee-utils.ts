// ── Shared formatting utilities ──────────────────────────────────────────────

export function formatDollar(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return formatDollar(n);
}

export function projectGrowth(principal: number, annualFeeRate: number, years: number, returnRate = 0.07) {
  let value = principal;
  let totalFees = 0;
  for (let y = 0; y < years; y++) {
    const fee = value * annualFeeRate;
    totalFees += fee;
    value = (value - fee) * (1 + returnRate);
  }
  return { value, totalFees };
}

// ── Shared fee calculation utilities ─────────────────────────────────────────

export interface FeeTier {
  min_aum: string | null;
  max_aum: number | null;
  fee_pct: number | null;
}

// ── Industry benchmarks ─────────────────────────────────────────────────────
// Computed from Visor Index database (207 firms with disclosed fee tiers, 2026-03-29)
export const INDUSTRY_ALL = [
  { breakpoint: 500_000, label: '$500K', avg: 1.262, p25: 1.00, median: 1.175, p75: 1.50 },
  { breakpoint: 1_000_000, label: '$1M', avg: 1.213, p25: 1.00, median: 1.075, p75: 1.375 },
  { breakpoint: 2_000_000, label: '$2M', avg: 1.108, p25: 0.90, median: 1.00, p75: 1.212 },
  { breakpoint: 5_000_000, label: '$5M', avg: 0.954, p25: 0.79, median: 0.89, p75: 1.05 },
  { breakpoint: 10_000_000, label: '$10M', avg: 0.801, p25: 0.637, median: 0.75, p75: 0.925 },
  { breakpoint: 25_000_000, label: '$25M', avg: 0.637, p25: 0.46, median: 0.592, p75: 0.78 },
  { breakpoint: 50_000_000, label: '$50M', avg: 0.562, p25: 0.376, median: 0.535, p75: 0.711 },
  { breakpoint: 100_000_000, label: '$100M', avg: 0.517, p25: 0.315, median: 0.515, p75: 0.677 },
];

export const INDUSTRY_SMALL = [
  { breakpoint: 500_000, avg: 1.273, median: 1.25 },
  { breakpoint: 1_000_000, avg: 1.209, median: 1.125 },
  { breakpoint: 5_000_000, avg: 0.925, median: 0.865 },
  { breakpoint: 10_000_000, avg: 0.79, median: 0.722 },
];

export const INDUSTRY_MID = [
  { breakpoint: 500_000, avg: 1.176, median: 1.00 },
  { breakpoint: 1_000_000, avg: 1.149, median: 1.00 },
  { breakpoint: 5_000_000, avg: 0.975, median: 0.935 },
  { breakpoint: 10_000_000, avg: 0.839, median: 0.80 },
];

export function getClosestBreakpoint(amount: number) {
  let closest = INDUSTRY_ALL[0];
  for (const bp of INDUSTRY_ALL) {
    if (Math.abs(amount - bp.breakpoint) <= Math.abs(amount - closest.breakpoint)) {
      closest = bp;
    }
  }
  return closest;
}

export function getIndustryMedianRate(amount: number): number {
  return getClosestBreakpoint(amount).median / 100;
}

// ── Core tiered fee calculation ─────────────────────────────────────────────
export interface CalcResult {
  totalFee: number;
  usedIndustryFallback: boolean;
  fallbackTierMin: number | null;
}

export function calcTieredFee(amount: number, tiers: FeeTier[]): CalcResult {
  if (tiers.length === 0) return { totalFee: 0, usedIndustryFallback: false, fallbackTierMin: null };
  const sorted = [...tiers].sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'));
  const validSorted = sorted.filter((t) => t.fee_pct != null);
  if (validSorted.length === 0) return { totalFee: 0, usedIndustryFallback: false, fallbackTierMin: null };
  if (validSorted.length === 1 && sorted.length === 1) {
    return { totalFee: amount * (validSorted[0].fee_pct! / 100), usedIndustryFallback: false, fallbackTierMin: null };
  }

  let totalFee = 0;
  let remaining = amount;
  let usedIndustryFallback = false;
  let fallbackTierMin: number | null = null;

  for (let i = 0; i < sorted.length && remaining > 0; i++) {
    const tierMin = parseInt(sorted[i].min_aum || '0');
    const tierMax = sorted[i].max_aum;
    const isNegotiated = sorted[i].fee_pct == null;
    const bracketSize = tierMax ? tierMax - tierMin : remaining;
    const taxable = Math.min(remaining, bracketSize);

    if (isNegotiated) {
      const midpoint = tierMin + taxable / 2;
      const fallbackRate = getIndustryMedianRate(midpoint);
      totalFee += taxable * fallbackRate;
      usedIndustryFallback = true;
      fallbackTierMin = tierMin;
    } else {
      totalFee += taxable * (sorted[i].fee_pct! / 100);
    }
    remaining -= taxable;
  }

  return { totalFee, usedIndustryFallback, fallbackTierMin };
}

// Simple version returning just the fee number (for compare page / quick calcs)
export function calcTieredFeeSimple(amount: number, tiers: FeeTier[]): number {
  return calcTieredFee(amount, tiers).totalFee;
}

// ── Synthetic tier generation for range-type firms ──────────────────────────
// For firms that disclose a fee range (min–max) but no tier breakpoints,
// synthesize 5 tiers anchored on the firm's average client size.
// Wider breakpoint multipliers push the min rate to truly large clients,
// and an industry p25 floor prevents unrealistically low rates.
export function synthesizeRangeTiers(
  feeRangeMin: number,
  feeRangeMax: number,
  avgClientSize: number,
): FeeTier[] {
  if (feeRangeMax <= 0 || avgClientSize <= 0) return [];

  const MAX_AUM = 1_000_000_000; // $1B cap

  // Wider breakpoints: min rate only applies at 5× avg client (truly large clients)
  const bpMultipliers = [0, 0.5, 1, 2, 5];
  const breakpoints = bpMultipliers.map(m => {
    const raw = m * avgClientSize;
    return Math.min(Math.round(raw / 1_000_000) * 1_000_000, MAX_AUM);
  });

  // Deduplicate breakpoints that collapsed to the same value after rounding/capping
  const uniqueBps = [breakpoints[0]];
  for (let i = 1; i < breakpoints.length; i++) {
    if (breakpoints[i] > uniqueBps[uniqueBps.length - 1]) uniqueBps.push(breakpoints[i]);
  }

  // Institutional firms (avg client > $50M) get pure interpolation;
  // retail/wealth firms get an industry p25 floor to prevent unrealistic rates.
  const isInstitutional = avgClientSize > 50_000_000;

  const tiers: FeeTier[] = [];
  for (let i = 0; i < uniqueBps.length; i++) {
    const t = i / (uniqueBps.length - 1); // 0 → 1
    const interpolated = feeRangeMax - t * (feeRangeMax - feeRangeMin);

    let rate = interpolated;
    if (!isInstitutional) {
      // Industry p25 floor: use the midpoint of this tier's AUM range
      const tierMin = uniqueBps[i];
      const tierMax = i < uniqueBps.length - 1 ? uniqueBps[i + 1] : tierMin * 2;
      const midpoint = tierMin + (tierMax - tierMin) / 2;
      const p25Floor = getClosestBreakpoint(midpoint).p25;
      rate = Math.max(interpolated, p25Floor);
    }

    const maxAum = i < uniqueBps.length - 1 ? uniqueBps[i + 1] : null;

    tiers.push({
      min_aum: String(uniqueBps[i]),
      max_aum: maxAum,
      fee_pct: Math.round(rate * 10000) / 10000,
    });
  }

  return tiers;
}

/**
 * Compute the blended effective p25 rate for a given AUM.
 * Walks INDUSTRY_ALL as a tiered fee schedule — applies each band's p25
 * to the portion of AUM in that band, then returns the weighted effective rate.
 */
export function computeEffectiveP25(aum: number): number {
  if (aum <= 0) return 0;
  const bands: { min: number; max: number; p25: number }[] = [];
  for (let i = 0; i < INDUSTRY_ALL.length; i++) {
    const min = i === 0 ? 0 : (INDUSTRY_ALL[i - 1].breakpoint + INDUSTRY_ALL[i].breakpoint) / 2;
    const max = i === INDUSTRY_ALL.length - 1 ? Infinity : (INDUSTRY_ALL[i].breakpoint + INDUSTRY_ALL[i + 1].breakpoint) / 2;
    bands.push({ min, max, p25: INDUSTRY_ALL[i].p25 });
  }
  let totalFee = 0;
  let remaining = aum;
  for (const band of bands) {
    if (remaining <= 0) break;
    const bandSize = band.max === Infinity ? remaining : band.max - band.min;
    const taxable = Math.min(remaining, bandSize);
    totalFee += taxable * (band.p25 / 100);
    remaining -= taxable;
  }
  return (totalFee / aum) * 100;
}

/** Recommended negotiation ask rate = the p25 for the closest AUM bracket. */
export function computeAskRate(aum: number): number {
  if (aum <= 0) return 0;
  return getClosestBreakpoint(aum).p25;
}

/** Client leverage level based on absolute AUM tier + firm-relative weight. */
export type LeverageLevel = 'low' | 'moderate' | 'high' | 'very-high';

export function computeLeverage(
  aum: number,
  firmAum?: number | null,
  firmClientTotal?: number | null,
): LeverageLevel {
  const tier = aum < 2_000_000 ? 'retail'
    : aum < 10_000_000 ? 'mid'
    : aum < 20_000_000 ? 'large'
    : aum < 50_000_000 ? 'hnw'
    : 'uhnw';

  let relativeBoost = 0;
  if (firmAum && firmClientTotal && firmClientTotal > 0) {
    const avgClient = firmAum / firmClientTotal;
    const ratio = aum / avgClient;
    if (ratio >= 3) relativeBoost = 2;
    else if (ratio >= 1.5) relativeBoost = 1;
    else if (ratio < 0.5) relativeBoost = -1;
  }

  const levels: LeverageLevel[] = ['low', 'moderate', 'high', 'very-high'];
  const baseIndex = tier === 'retail' ? 0 : tier === 'mid' ? 1 : tier === 'large' ? 2 : 3;
  const finalIndex = Math.max(0, Math.min(3, baseIndex + relativeBoost));
  return levels[finalIndex];
}

/** Get the next INDUSTRY_ALL breakpoint above the given AUM, or null. */
export function getNextBreakpoint(aum: number) {
  return INDUSTRY_ALL.find(bp => bp.breakpoint > aum) ?? null;
}
