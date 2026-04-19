import { describe, it, expect } from 'vitest';

/**
 * Tests for the pure data-processing logic extracted from the dashboard page.
 * Covers AUM formatting, empty-state detection, and match profile logic.
 */

// ── AUM Formatting (mirrors the inline logic in dashboard/page.tsx line ~240) ──

function formatAum(aum: number | null): string {
  if (!aum) return '';
  if (aum >= 1e9) return `$${(aum / 1e9).toFixed(1)}B`;
  if (aum >= 1e6) return `$${(aum / 1e6).toFixed(0)}M`;
  return `$${Math.round(aum / 1000)}K`;
}

describe('AUM formatting', () => {
  it('returns empty string for null AUM', () => {
    expect(formatAum(null)).toBe('');
  });

  it('returns empty string for zero AUM', () => {
    expect(formatAum(0)).toBe('');
  });

  it('formats billions with one decimal', () => {
    expect(formatAum(1_500_000_000)).toBe('$1.5B');
    expect(formatAum(1_000_000_000)).toBe('$1.0B');
    expect(formatAum(23_400_000_000)).toBe('$23.4B');
  });

  it('formats millions as whole number', () => {
    expect(formatAum(250_000_000)).toBe('$250M');
    expect(formatAum(1_000_000)).toBe('$1M');
    expect(formatAum(999_999_999)).toBe('$1000M'); // just under 1B
  });

  it('formats thousands', () => {
    expect(formatAum(500_000)).toBe('$500K');
    expect(formatAum(50_000)).toBe('$50K');
    expect(formatAum(999_999)).toBe('$1000K'); // just under 1M
  });

  it('handles very small AUM', () => {
    expect(formatAum(1_000)).toBe('$1K');
    expect(formatAum(100)).toBe('$0K');
  });
});

// ── Empty State Detection ──

function isEmptyState(savedCount: number | null, alertCount: number | null, hasMatch: boolean): boolean {
  return (savedCount ?? 0) === 0 && (alertCount ?? 0) === 0 && !hasMatch;
}

describe('Empty state detection', () => {
  it('returns true when all values are zero/false', () => {
    expect(isEmptyState(0, 0, false)).toBe(true);
  });

  it('returns true when counts are null', () => {
    expect(isEmptyState(null, null, false)).toBe(true);
  });

  it('returns false when savedCount > 0', () => {
    expect(isEmptyState(1, 0, false)).toBe(false);
  });

  it('returns false when alertCount > 0', () => {
    expect(isEmptyState(0, 3, false)).toBe(false);
  });

  it('returns false when hasMatch is true', () => {
    expect(isEmptyState(0, 0, true)).toBe(false);
  });

  it('returns false when all values have data', () => {
    expect(isEmptyState(48, 3, true)).toBe(false);
  });
});

// ── Match Profile Logic ──

function getMatchStatus(answers: Record<string, unknown> | null): { hasMatch: boolean } {
  return { hasMatch: !!answers };
}

function formatMatchDate(updatedAt: string | null): string | null {
  if (!updatedAt) return null;
  return new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

describe('Match profile logic', () => {
  it('hasMatch is false when answers is null', () => {
    expect(getMatchStatus(null).hasMatch).toBe(false);
  });

  it('hasMatch is true when answers exist', () => {
    expect(getMatchStatus({ q1: 'a' }).hasMatch).toBe(true);
  });

  it('formats date correctly', () => {
    // Use a UTC midnight date to avoid timezone shifting the day
    expect(formatMatchDate('2026-04-04T12:00:00Z')).toBe('Apr 4');
  });

  it('returns null for null date', () => {
    expect(formatMatchDate(null)).toBeNull();
  });
});

// ── Location formatting (mirrors FirmRow logic) ──

function formatLocation(city: string | null, state: string | null): string {
  return [city, state].filter(Boolean).join(', ');
}

describe('Location formatting', () => {
  it('formats city and state', () => {
    expect(formatLocation('New York', 'NY')).toBe('New York, NY');
  });

  it('shows only state when city is null', () => {
    expect(formatLocation(null, 'CA')).toBe('CA');
  });

  it('shows only city when state is null', () => {
    expect(formatLocation('Boston', null)).toBe('Boston');
  });

  it('returns empty string when both null', () => {
    expect(formatLocation(null, null)).toBe('');
  });
});

// ── Plan tier display logic (mirrors layout.tsx) ──

function getPlanLabel(tier: string | null | undefined): string {
  switch (tier) {
    case 'none': return 'No Plan';
    case 'trial': return 'Trial Access';
    case 'consumer': return 'Consumer';
    case 'enterprise': return 'Enterprise';
    default: return 'Free';
  }
}

function shouldShowPlanBanner(tier: string | null | undefined): boolean {
  return !tier || tier === 'none';
}

describe('Plan tier logic', () => {
  it('maps "none" to "No Plan"', () => {
    expect(getPlanLabel('none')).toBe('No Plan');
  });

  it('maps "trial" to "Trial Access"', () => {
    expect(getPlanLabel('trial')).toBe('Trial Access');
  });

  it('maps "consumer" to "Consumer"', () => {
    expect(getPlanLabel('consumer')).toBe('Consumer');
  });

  it('maps "enterprise" to "Enterprise"', () => {
    expect(getPlanLabel('enterprise')).toBe('Enterprise');
  });

  it('defaults to "Free" for null/undefined', () => {
    expect(getPlanLabel(null)).toBe('Free');
    expect(getPlanLabel(undefined)).toBe('Free');
  });

  it('shows plan banner when tier is none', () => {
    expect(shouldShowPlanBanner('none')).toBe(true);
  });

  it('shows plan banner when tier is null/undefined', () => {
    expect(shouldShowPlanBanner(null)).toBe(true);
    expect(shouldShowPlanBanner(undefined)).toBe(true);
  });

  it('hides plan banner for active tiers', () => {
    expect(shouldShowPlanBanner('trial')).toBe(false);
    expect(shouldShowPlanBanner('consumer')).toBe(false);
    expect(shouldShowPlanBanner('enterprise')).toBe(false);
  });
});

// ── Score color thresholds ──

function scoreColor(v: number): string {
  return v >= 70 ? '#2DBD74' : v >= 50 ? '#F59E0B' : '#EF4444';
}

describe('Score color thresholds', () => {
  it('returns green for 70+', () => {
    expect(scoreColor(70)).toBe('#2DBD74');
    expect(scoreColor(100)).toBe('#2DBD74');
  });

  it('returns amber for 50–69', () => {
    expect(scoreColor(50)).toBe('#F59E0B');
    expect(scoreColor(69)).toBe('#F59E0B');
  });

  it('returns red for < 50', () => {
    expect(scoreColor(49)).toBe('#EF4444');
    expect(scoreColor(0)).toBe('#EF4444');
  });

  it('handles boundary at 70 exactly', () => {
    expect(scoreColor(70)).toBe('#2DBD74');
    expect(scoreColor(69)).toBe('#F59E0B');
  });

  it('handles boundary at 50 exactly', () => {
    expect(scoreColor(50)).toBe('#F59E0B');
    expect(scoreColor(49)).toBe('#EF4444');
  });
});
