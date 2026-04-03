// ── Similar Firms: multi-dimensional similarity algorithm ────────────────────
// Shared between firm profile page and negotiate page.

import { SupabaseClient } from '@supabase/supabase-js';
import { getFirmScores } from './scores';

export interface SimilarFirm {
  crd: number;
  name: string;
  city: string | null;
  state: string;
  aum: number | null;
  score: number | null;
  reason: string;
  feeRangeMin: number | null;
  feeRangeMax: number | null;
  feeStructureType: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FirmRow = Record<string, any>;

const CLIENT_KEYS = [
  'client_hnw_number', 'client_non_hnw_number', 'client_pension_number',
  'client_charitable_number', 'client_corporations_number', 'client_pooled_vehicles_number',
  'client_other_number', 'client_banks_number', 'client_govt_number',
  'client_insurance_number', 'client_investment_cos_number', 'client_other_advisors_number',
];

const SERVICE_KEYS = [
  'services_financial_planning', 'services_mgr_selection', 'services_pension_consulting',
  'services_port_management_individuals', 'services_port_management_institutional',
  'services_port_management_pooled',
];

export function clientVector(f: FirmRow | null | undefined): number[] {
  if (!f) return Array(12).fill(0);
  return CLIENT_KEYS.map(k => Number(f[k]) || 0);
}

export function serviceVector(f: FirmRow | null | undefined): number[] {
  if (!f) return Array(6).fill(0);
  return SERVICE_KEYS.map(k => f[k] === 'Y' ? 1 : 0);
}

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export function aumProximity(a: number, b: number): number {
  if (!a || !b) return 0;
  return Math.min(a, b) / Math.max(a, b);
}

export function totalClientsFromRow(f: FirmRow | null | undefined): number {
  if (!f) return 0;
  return CLIENT_KEYS.reduce((sum, k) => sum + (Number(f[k]) || 0), 0);
}

export function avgClientAum(f: FirmRow | null | undefined): number {
  if (!f) return 0;
  const total = totalClientsFromRow(f);
  const aum = Number(f.aum) || 0;
  return total > 0 && aum > 0 ? aum / total : 0;
}

export function dominantReason(
  clientSim: number, aumSim: number, serviceSim: number, avgClientSim: number, sameState: boolean
): string {
  const parts: string[] = [];
  if (clientSim > 0.7) parts.push('Similar Client Base');
  if (aumSim > 0.6) parts.push('Comparable AUM');
  if (avgClientSim > 0.6) parts.push('Similar Avg. Client Size');
  if (serviceSim > 0.7) parts.push('Same Services');
  if (sameState) parts.push('Same State');
  if (parts.length === 0) {
    if (aumSim >= clientSim && aumSim >= serviceSim) parts.push('Comparable AUM');
    else if (clientSim >= serviceSim) parts.push('Similar Client Base');
    else parts.push('Same Services');
  }
  return parts.slice(0, 2).join(' · ');
}

const CANDIDATE_SELECT = 'crd, primary_business_name, main_office_city, main_office_state, aum, client_hnw_number, client_non_hnw_number, client_pension_number, client_charitable_number, client_corporations_number, client_pooled_vehicles_number, client_other_number, client_banks_number, client_govt_number, client_insurance_number, client_investment_cos_number, client_other_advisors_number, services_financial_planning, services_mgr_selection, services_pension_consulting, services_port_management_individuals, services_port_management_institutional, services_port_management_pooled';

interface GetSimilarFirmsOpts {
  supabase: SupabaseClient;
  crd: number;
  state: string;
  aum: number | null;
  firmRow: FirmRow;
  limit?: number;
  includeFees?: boolean;
}

export async function getSimilarFirms({
  supabase, crd, state, aum, firmRow, limit = 4, includeFees = false,
}: GetSimilarFirmsOpts): Promise<SimilarFirm[]> {
  try {
    const queries = [];

    // Same-state candidates (AUM range 0.3x–3x)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let qState: any = supabase.from('firmdata_current')
      .select(CANDIDATE_SELECT)
      .eq('main_office_state', state)
      .neq('crd', crd)
      .not('aum', 'is', null)
      .order('aum', { ascending: false })
      .limit(20);
    if (aum) qState = qState.gte('aum', Math.round(aum * 0.3)).lte('aum', Math.round(aum * 3));
    queries.push(qState);

    // Out-of-state candidates (tighter AUM range 0.5x–2x)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let qOther: any = supabase.from('firmdata_current')
      .select(CANDIDATE_SELECT)
      .neq('main_office_state', state)
      .neq('crd', crd)
      .not('aum', 'is', null)
      .order('aum', { ascending: false })
      .limit(20);
    if (aum) qOther = qOther.gte('aum', Math.round(aum * 0.5)).lte('aum', Math.round(aum * 2));
    queries.push(qOther);

    const results = await Promise.all(queries);
    const allCandidates: FirmRow[] = [...(results[0]?.data || []), ...(results[1]?.data || [])].filter(Boolean);
    if (!allCandidates.length) return [];

    // Compute similarity scores
    const firmClientVec = clientVector(firmRow);
    const firmServiceVec = serviceVector(firmRow);
    const firmAum = aum || 0;
    const firmAvgClient = avgClientAum(firmRow);

    const scored = allCandidates.map(c => {
      const clientSim = cosineSim(firmClientVec, clientVector(c));
      const serviceSim = cosineSim(firmServiceVec, serviceVector(c));
      const aumSim = aumProximity(firmAum, c.aum || 0);
      const avgClientSim = aumProximity(firmAvgClient, avgClientAum(c));
      const sameState = c.main_office_state === state;

      const composite =
        clientSim * 0.30 +
        aumSim * 0.20 +
        avgClientSim * 0.15 +
        serviceSim * 0.15 +
        (sameState ? 1 : 0) * 0.10 +
        (aumSim > 0.3 && aumSim < 0.95 ? 0.10 : 0);

      return {
        ...c,
        _clientSim: clientSim,
        _serviceSim: serviceSim,
        _aumSim: aumSim,
        _avgClientSim: avgClientSim,
        _sameState: sameState,
        _composite: composite,
      };
    });

    scored.sort((a, b) => b._composite - a._composite);
    const pool = scored.slice(0, limit * 3);

    const crds = pool.map(f => f.crd as number);
    const lookups: Promise<any>[] = [
      supabase.from('firm_names').select('crd, display_name').in('crd', crds),
      getFirmScores(crds),
      // Always fetch fees for ranking boost (fee data + score boost)
      supabase.from('firmdata_feesandmins').select('crd, fee_structure_type, fee_range_min, fee_range_max').in('crd', crds),
    ];

    const lookupResults = await Promise.all(lookups);
    const nameMap = new Map(
      (lookupResults[0]?.data ?? []).map((n: { crd: number; display_name: string | null }) => [n.crd, n.display_name])
    );
    const scoreMap = lookupResults[1] as Map<number, any>;
    const feeMap = new Map<number, { fee_structure_type: string | null; fee_range_min: number | null; fee_range_max: number | null }>();
    if (lookupResults[2]?.data) {
      for (const row of lookupResults[2].data) {
        feeMap.set(row.crd, row);
      }
    }

    // Re-rank pool with fee data boost, score boost, and random jitter
    const boosted = pool.map(f => {
      const feeRow = feeMap.get(f.crd);
      const scoreEntry = scoreMap.get(f.crd) as { final_score?: number } | undefined;
      const visorScore = scoreEntry?.final_score ?? 0;

      const feeBoost = feeRow?.fee_range_max != null ? 0.12 : 0;
      const scoreBoost = (visorScore / 100) * 0.08;
      const jitter = Math.random() * 0.12 - 0.06;

      return { ...f, _final: f._composite + feeBoost + scoreBoost + jitter, _feeRow: feeRow, _visorScore: visorScore };
    });
    boosted.sort((a, b) => b._final - a._final);

    return boosted.slice(0, limit).map(f => ({
      crd: f.crd,
      name: (nameMap.get(f.crd) as string | null) || f.primary_business_name || 'Unknown',
      city: f.main_office_city,
      state: f.main_office_state,
      aum: f.aum,
      score: f._visorScore || null,
      reason: dominantReason(f._clientSim, f._aumSim, f._serviceSim, f._avgClientSim, f._sameState),
      feeRangeMin: f._feeRow?.fee_range_min ?? null,
      feeRangeMax: f._feeRow?.fee_range_max ?? null,
      feeStructureType: f._feeRow?.fee_structure_type ?? null,
    }));
  } catch (e) {
    console.error('getSimilarFirms error:', e);
    return [];
  }
}
