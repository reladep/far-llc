import { describe, it, expect, vi } from 'vitest';

// Mock the scores module which creates a Supabase client at import time
vi.mock('@/lib/scores', () => ({
  getFirmScores: vi.fn().mockResolvedValue(new Map()),
}));

import {
  clientVector,
  serviceVector,
  cosineSim,
  aumProximity,
  totalClientsFromRow,
  avgClientAum,
  dominantReason,
} from '@/lib/similar-firms';

// ── clientVector ──

describe('clientVector', () => {
  it('returns 12-element zero vector for null', () => {
    const v = clientVector(null);
    expect(v).toHaveLength(12);
    expect(v.every(x => x === 0)).toBe(true);
  });

  it('returns 12-element zero vector for undefined', () => {
    expect(clientVector(undefined)).toHaveLength(12);
  });

  it('extracts numeric values from firm row', () => {
    const row = {
      client_hnw_number: 100,
      client_non_hnw_number: 200,
      client_pension_number: 0,
      client_charitable_number: 5,
    };
    const v = clientVector(row);
    expect(v[0]).toBe(100);
    expect(v[1]).toBe(200);
    expect(v[2]).toBe(0);
    expect(v[3]).toBe(5);
  });

  it('coerces non-numeric values to 0', () => {
    const row = { client_hnw_number: 'abc', client_non_hnw_number: null };
    const v = clientVector(row);
    expect(v[0]).toBe(0);
    expect(v[1]).toBe(0);
  });
});

// ── serviceVector ──

describe('serviceVector', () => {
  it('returns 6-element zero vector for null', () => {
    const v = serviceVector(null);
    expect(v).toHaveLength(6);
    expect(v.every(x => x === 0)).toBe(true);
  });

  it('maps "Y" to 1, anything else to 0', () => {
    const row = {
      services_financial_planning: 'Y',
      services_mgr_selection: 'N',
      services_pension_consulting: 'Y',
      services_port_management_individuals: '',
      services_port_management_institutional: null,
      services_port_management_pooled: 'Y',
    };
    expect(serviceVector(row)).toEqual([1, 0, 1, 0, 0, 1]);
  });
});

// ── cosineSim ──

describe('cosineSim', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSim([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSim([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it('returns 0 when one vector is all zeros', () => {
    expect(cosineSim([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it('returns 0 when both vectors are all zeros', () => {
    expect(cosineSim([0, 0], [0, 0])).toBe(0);
  });

  it('returns 1 for proportional vectors', () => {
    expect(cosineSim([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 5);
  });

  it('handles negative values', () => {
    // Opposite direction = -1
    expect(cosineSim([1, 0], [-1, 0])).toBeCloseTo(-1, 5);
  });

  it('computes correct similarity for realistic client vectors', () => {
    const firmA = [100, 200, 0, 5, 10, 0, 0, 0, 0, 0, 0, 0];
    const firmB = [120, 180, 0, 3, 15, 0, 0, 0, 0, 0, 0, 0];
    const sim = cosineSim(firmA, firmB);
    expect(sim).toBeGreaterThan(0.99); // very similar
  });
});

// ── aumProximity ──

describe('aumProximity', () => {
  it('returns 1 for identical AUMs', () => {
    expect(aumProximity(1e9, 1e9)).toBe(1);
  });

  it('returns 0 when either AUM is 0', () => {
    expect(aumProximity(0, 1e9)).toBe(0);
    expect(aumProximity(1e9, 0)).toBe(0);
  });

  it('returns 0 when either AUM is falsy', () => {
    // NaN is falsy in this context
    expect(aumProximity(0, 500)).toBe(0);
  });

  it('returns ratio of min/max', () => {
    expect(aumProximity(500_000_000, 1_000_000_000)).toBe(0.5);
    expect(aumProximity(1_000_000_000, 500_000_000)).toBe(0.5);
  });

  it('is symmetric', () => {
    expect(aumProximity(300, 900)).toBe(aumProximity(900, 300));
  });

  it('handles very different AUMs', () => {
    const result = aumProximity(1_000_000, 1_000_000_000);
    expect(result).toBeCloseTo(0.001, 5);
  });
});

// ── totalClientsFromRow ──

describe('totalClientsFromRow', () => {
  it('returns 0 for null', () => {
    expect(totalClientsFromRow(null)).toBe(0);
  });

  it('sums all client columns', () => {
    const row = {
      client_hnw_number: 100,
      client_non_hnw_number: 200,
      client_pension_number: 50,
      client_charitable_number: 10,
      client_corporations_number: 5,
      client_pooled_vehicles_number: 3,
      client_other_number: 7,
      client_banks_number: 0,
      client_govt_number: 0,
      client_insurance_number: 2,
      client_investment_cos_number: 1,
      client_other_advisors_number: 0,
    };
    expect(totalClientsFromRow(row)).toBe(378);
  });

  it('handles missing keys as 0', () => {
    const row = { client_hnw_number: 10 };
    expect(totalClientsFromRow(row)).toBe(10);
  });
});

// ── avgClientAum ──

describe('avgClientAum', () => {
  it('returns 0 for null', () => {
    expect(avgClientAum(null)).toBe(0);
  });

  it('returns 0 when no clients', () => {
    expect(avgClientAum({ aum: 1_000_000 })).toBe(0);
  });

  it('returns 0 when no AUM', () => {
    expect(avgClientAum({ client_hnw_number: 100 })).toBe(0);
  });

  it('divides AUM by total clients', () => {
    const row = {
      aum: 1_000_000_000,
      client_hnw_number: 100,
      client_non_hnw_number: 400,
    };
    expect(avgClientAum(row)).toBe(2_000_000); // 1B / 500
  });
});

// ── dominantReason ──

describe('dominantReason', () => {
  it('returns "Similar Client Base" when clientSim is high', () => {
    expect(dominantReason(0.8, 0.3, 0.3, 0.3, false)).toContain('Similar Client Base');
  });

  it('returns "Comparable AUM" when aumSim is high', () => {
    expect(dominantReason(0.3, 0.7, 0.3, 0.3, false)).toContain('Comparable AUM');
  });

  it('returns "Same Services" when serviceSim is high', () => {
    expect(dominantReason(0.3, 0.3, 0.8, 0.3, false)).toContain('Same Services');
  });

  it('returns "Similar Avg. Client Size" when avgClientSim is high', () => {
    expect(dominantReason(0.3, 0.3, 0.3, 0.7, false)).toContain('Similar Avg. Client Size');
  });

  it('returns "Same State" when sameState is true', () => {
    expect(dominantReason(0.3, 0.3, 0.3, 0.3, true)).toContain('Same State');
  });

  it('joins multiple reasons with " · "', () => {
    const result = dominantReason(0.8, 0.7, 0.8, 0.7, true);
    expect(result).toContain(' · ');
  });

  it('limits to 2 reasons max', () => {
    const result = dominantReason(0.8, 0.7, 0.8, 0.7, true);
    const parts = result.split(' · ');
    expect(parts.length).toBeLessThanOrEqual(2);
  });

  it('falls back to highest sim when nothing crosses threshold', () => {
    // aumSim is highest below thresholds
    expect(dominantReason(0.3, 0.5, 0.2, 0.3, false)).toBe('Comparable AUM');
    // clientSim is highest
    expect(dominantReason(0.5, 0.3, 0.2, 0.3, false)).toBe('Similar Client Base');
    // serviceSim is highest
    expect(dominantReason(0.2, 0.1, 0.4, 0.3, false)).toBe('Same Services');
  });
});
