import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { calcTieredFeeSimple, formatDollar, synthesizeRangeTiers, synthesizeMaxOnlyTiers, type FeeTier } from '@/lib/fee-utils';
import { checkRateLimit } from '@/lib/rate-limit';

interface MatchParams {
  netWorth: string;
  lifeTrigger: string[];
  location: string;
  priorities: string[];
  firmSize: string;
  serviceDepth: string;
  conflictImportance: string;
}

// Parse net worth from exact or range input
function parseNetWorth(raw: string): number | null {
  if (raw.startsWith('exact_')) return Number(raw.replace('exact_', '')) || null;
  const map: Record<string, number> = {
    under_250k: 150_000,
    '250k_1m': 500_000,
    '1m_5m': 2_500_000,
    '5m_10m': 7_500_000,
    '10m_25m': 15_000_000,
    '25m_plus': 50_000_000,
  };
  return map[raw] ?? null;
}

// Location mapping for adjacent state groupings
const LOCATION_MAP: Record<string, string[]> = {
  ny: ['NY', 'NJ', 'CT', 'PA'],
  ca: ['CA'],
  fl: ['FL'],
  tx: ['TX'],
  il: ['IL'],
  ma: ['MA', 'NH', 'RI', 'VT'],
  other: [],
};

// Adjacent state groups for proximity scoring
const STATE_GROUPS: string[][] = [
  ['NY', 'NJ', 'CT', 'PA'],
  ['MA', 'NH', 'RI', 'VT', 'ME'],
  ['CA', 'NV', 'OR', 'AZ'],
  ['FL', 'GA', 'SC'],
  ['TX', 'OK', 'LA'],
  ['IL', 'WI', 'IN', 'MI'],
  ['CO', 'UT', 'WY'],
  ['WA', 'OR', 'ID'],
  ['VA', 'MD', 'DC', 'DE'],
  ['NC', 'SC', 'TN'],
  ['OH', 'PA', 'WV', 'KY'],
  ['MN', 'WI', 'IA'],
];

// Priority → score dimension mapping
// Prefer _pct columns (0-100, granular) over base scores (0-10, coarse)
// Note: fee competitiveness is NOT a selectable priority — it's always-on (see composite below)
const PRIORITY_MAP: Record<string, { key: string; pctKey?: string }> = {
  aum_growth: { key: 'aum_growth_score', pctKey: 'aum_growth_pct' },
  client_retention: { key: 'client_growth_score', pctKey: 'client_growth_pct' },
  advisor_experience: { key: 'viability_score' },
  personal_service: { key: 'advisor_bandwidth_score', pctKey: 'advisor_bandwidth_pct' },
  comprehensive: { key: '_service_match' },
  fiduciary: { key: 'conflict_free_score' },
  fee_only: { key: 'conflict_free_score' },
};

export async function GET(request: NextRequest) {
  const blocked = await checkRateLimit(request, '/api/match', { limit: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const params: MatchParams = {
    netWorth: searchParams.get('netWorth') || '',
    lifeTrigger: searchParams.get('lifeTrigger')?.split(',').filter(Boolean) || [],
    location: searchParams.get('location') || 'other',
    priorities: searchParams.get('priorities')?.split(',').filter(Boolean) || [],
    firmSize: searchParams.get('firmSize') || 'any',
    serviceDepth: searchParams.get('serviceDepth') || 'standard',
    conflictImportance: searchParams.get('conflictImportance') || 'important',
  };

  try {
    const netWorthAmount = parseNetWorth(params.netWorth);

    // Parse location state
    let userState: string | null = null;
    let userCity: string | null = null;
    const loc = params.location;
    if (LOCATION_MAP[loc]) {
      userState = LOCATION_MAP[loc][0] || null;
    } else if (loc && loc !== 'outside_us') {
      const stateMatch = loc.match(/,\s*([A-Z]{2})$/);
      if (stateMatch) {
        userState = stateMatch[1];
        userCity = loc.replace(/,\s*[A-Z]{2}$/, '').trim();
      }
      const parenMatch = loc.match(/\(([A-Z]{2})\)$/);
      if (parenMatch) userState = parenMatch[1];
    }

    // Get adjacent states for the user's state
    const adjacentStates = new Set<string>();
    if (userState) {
      for (const group of STATE_GROUPS) {
        if (group.includes(userState)) {
          group.forEach(s => adjacentStates.add(s));
        }
      }
      adjacentStates.delete(userState);
    }

    // Query firms — no arbitrary limit, filter by general criteria
    const { data: firms, error } = await supabase
      .from('firmdata_current')
      .select('crd, primary_business_name, main_office_city, main_office_state, aum, employee_total, employee_investment, services_financial_planning, services_port_management_individuals, services_mgr_selection, services_pension_consulting, client_hnw_number, client_non_hnw_number, non_us_client_percent, state_ak, state_al, state_ar, state_az, state_ca, state_co, state_ct, state_dc, state_de, state_fl, state_ga, state_hi, state_ia, state_id, state_il, state_in, state_ks, state_ky, state_la, state_ma, state_md, state_me, state_mi, state_mn, state_mo, state_ms, state_mt, state_nc, state_nd, state_ne, state_nh, state_nj, state_nm, state_nv, state_ny, state_oh, state_ok, state_or, state_pa, state_ri, state_sc, state_sd, state_tn, state_tx, state_ut, state_va, state_vt, state_wa, state_wi, state_wv')
      .not('aum', 'is', null)
      .gt('aum', 0);

    if (error) throw error;
    if (!firms || firms.length === 0) {
      return NextResponse.json({ firms: [] });
    }

    const crds = firms.map(f => f.crd);

    // Parallel data fetches
    const [namesResult, scoresResult, feeResult, tiersResult] = await Promise.all([
      supabase.from('firm_names').select('crd, display_name').in('crd', crds),
      supabase.from('firm_scores').select('*').in('crd', crds),
      supabase.from('firmdata_feesandmins').select('crd, fee_structure_type, fee_range_min, fee_range_max, minimum_account_size').in('crd', crds),
      netWorthAmount
        ? supabase.from('firmdata_feetiers').select('crd, min_aum, max_aum, fee_pct').in('crd', crds)
        : Promise.resolve({ data: null }),
    ]);

    const nameMap = new Map(namesResult.data?.map(n => [n.crd, n.display_name]) || []);
    const scoreMap = new Map(scoresResult.data?.map(s => [s.crd, s]) || []);
    const feeDataMap = new Map(feeResult.data?.map(f => [f.crd, f]) || []);

    // Group fee tiers by CRD
    const tierMap = new Map<number, FeeTier[]>();
    if (tiersResult.data) {
      for (const t of tiersResult.data) {
        if (!tierMap.has(t.crd)) tierMap.set(t.crd, []);
        tierMap.get(t.crd)!.push(t);
      }
    }

    // Conflict importance multiplier
    const conflictMultiplier = { critical: 1.5, important: 1.0, somewhat: 0.6, not_important: 0.2 }[params.conflictImportance] ?? 1.0;

    const isInternational = params.location === 'outside_us';

    // Score and rank firms
    const scoredFirms = firms
      .map(firm => {
        const score = scoreMap.get(firm.crd) as Record<string, number> | undefined;
        const feeData = feeDataMap.get(firm.crd) as { fee_structure_type?: string; fee_range_min?: number; fee_range_max?: number; minimum_account_size?: number } | undefined;
        const displayName = nameMap.get(firm.crd);

        // ── Hard filter: minimum account size ──
        if (netWorthAmount && feeData?.minimum_account_size && feeData.minimum_account_size > netWorthAmount) {
          return null;
        }

        // ── Hard filter: international clients need firms with non-US experience ──
        if (isInternational && !(firm.non_us_client_percent > 0)) {
          return null;
        }

        const reasons: string[] = [];

        // ── 1. Visor Index baseline (domestic 25%, international 20%) ──
        const visorScore = score?.final_score ?? 50;
        const visorBaseline = visorScore; // 0-100

        // ── 2. Priority-driven scoring (35%) ──
        // Sub-scores in firm_scores are 0-10 scale; normalize to 0-100
        const n = (v: number | undefined | null, fallback = 50) =>
          v != null ? v * 10 : fallback;

        // Compute service match score for "comprehensive" priority
        const totalClients = (firm.client_hnw_number || 0) + (firm.client_non_hnw_number || 0);
        let serviceMatchScore = 50;
        const hasFP = firm.services_financial_planning === 'Y';
        const hasPM = firm.services_port_management_individuals === 'Y';
        const hasMS = firm.services_mgr_selection === 'Y';
        const hasPC = firm.services_pension_consulting === 'Y';
        const serviceCount = [hasFP, hasPM, hasMS, hasPC].filter(Boolean).length;

        if (params.serviceDepth === 'basic') {
          serviceMatchScore = (firm.employee_total || 0) < 10 ? 90 : (firm.employee_total || 0) < 50 ? 70 : 50;
        } else if (params.serviceDepth === 'standard') {
          serviceMatchScore = (hasFP ? 50 : 0) + (hasPM ? 50 : 0);
        } else if (params.serviceDepth === 'comprehensive') {
          serviceMatchScore = Math.min(100, serviceCount * 25 + (hasFP ? 10 : 0));
        } else if (params.serviceDepth === 'concierge') {
          const bwScore = n(score?.advisor_bandwidth_score);
          serviceMatchScore = Math.min(100,
            (bwScore > 70 ? 40 : 20) +
            ((firm.employee_investment || 0) > 5 ? 30 : 10) +
            (hasFP ? 20 : 0) +
            (serviceCount >= 3 ? 10 : 0)
          );
        }

        // Build priority scores
        const allDimensions = Object.keys(PRIORITY_MAP);
        let priorityTotal = 0;
        let priorityWeightTotal = 0;

        for (const dim of allDimensions) {
          const { key: scoreKey, pctKey } = PRIORITY_MAP[dim];
          const isSelected = params.priorities.includes(dim);
          let weight = isSelected ? 0.15 : 0.03;

          // Apply conflict multiplier
          if (dim === 'fiduciary' || dim === 'fee_only') weight *= conflictMultiplier;

          // Use _pct column (0-100) when available for more granular scoring,
          // fall back to base score (0-10) normalized to 0-100
          let dimScore: number;
          if (scoreKey === '_service_match') {
            dimScore = serviceMatchScore;
          } else if (pctKey && score?.[pctKey] != null) {
            dimScore = score[pctKey] as number;
          } else {
            dimScore = n(score?.[scoreKey]);
          }

          priorityTotal += (dimScore / 100) * weight;
          priorityWeightTotal += weight;
        }

        // Normalize to 0-100
        const priorityScore = priorityWeightTotal > 0
          ? (priorityTotal / priorityWeightTotal) * 100
          : 50;

        // ── 3. Firm size match (10%) ──
        let firmSizeScore = 70; // neutral
        if (params.firmSize !== 'any' && firm.aum) {
          if (params.firmSize === 'small') {
            firmSizeScore = firm.aum < 500_000_000 ? 100 : firm.aum < 1_000_000_000 ? 60 : 20;
          } else if (params.firmSize === 'mid') {
            firmSizeScore = (firm.aum >= 500_000_000 && firm.aum <= 5_000_000_000) ? 100
              : (firm.aum >= 200_000_000 && firm.aum <= 8_000_000_000) ? 60 : 20;
          } else if (params.firmSize === 'large') {
            firmSizeScore = firm.aum > 5_000_000_000 ? 100 : firm.aum > 2_000_000_000 ? 60 : 20;
          }
        }

        // ── 4. Service depth match (10%) ──
        // Already computed as serviceMatchScore above

        // ── 5. Fee competitiveness (always-on, 10%) ──
        const feeScore = (score?.fee_competitiveness_pct != null)
          ? score.fee_competitiveness_pct as number
          : n(score?.fee_competitiveness_score);

        // ── 6. Conflict-free score (10%) ──
        const conflictScore = n(score?.conflict_free_score);

        // ── 6. Location / International capability score ──
        let locationScore = 50; // default for no location
        let intlCapabilityScore = 0; // only used for international algorithm
        if (isInternational) {
          // International capability replaces location — how equipped is this firm?
          const nonUsPct = firm.non_us_client_percent ?? 0;
          if (nonUsPct >= 25) {
            intlCapabilityScore = 100;       // international is core to their practice
          } else if (nonUsPct >= 10) {
            intlCapabilityScore = 80;        // meaningful international presence
          } else if (nonUsPct >= 5) {
            intlCapabilityScore = 60;        // some experience
          } else {
            intlCapabilityScore = 40;        // minimal but existent (passed hard filter)
          }
          locationScore = intlCapabilityScore; // alias for reason tag logic
        } else if (userState) {
          // Check state presence flag (e.g. state_ny = 'Y')
          const stateKey = `state_${userState.toLowerCase()}` as keyof typeof firm;
          const hasStatePresence = firm[stateKey] === 'Y';

          // TODO: once branch office data is available (ADV Schedule D),
          // add a tier between HQ-in-state and state-presence for "has local office"
          if (userCity && firm.main_office_city?.toLowerCase() === userCity.toLowerCase() && firm.main_office_state === userState) {
            locationScore = 100;           // same city, same state HQ
          } else if (firm.main_office_state === userState) {
            locationScore = 85;            // HQ in user's state
          } else if (hasStatePresence) {
            locationScore = 55;            // registered/operates in user's state (no confirmed local office)
          } else if (adjacentStates.has(firm.main_office_state)) {
            locationScore = 35;            // adjacent state HQ
          } else {
            locationScore = 15;
          }
        }

        // ── 7. Wealth tier match (bonus) ──
        let wealthBonus = 0;
        if (netWorthAmount && totalClients > 0 && firm.aum) {
          const avgClientSize = firm.aum / totalClients;
          const ratio = netWorthAmount / avgClientSize;
          if (ratio >= 0.2 && ratio <= 5) {
            wealthBonus = 5;
          } else if (ratio < 0.1) {
            wealthBonus = -10;
          }
        }

        // ── Final composite with dynamic location weight ──
        let finalScore: number;

        if (isInternational) {
          // International: Visor reduced, conflict-free boosted, intl capability replaces location
          finalScore =
            visorBaseline * 0.15 +
            priorityScore * 0.25 +
            feeScore * 0.10 +
            firmSizeScore * 0.10 +
            serviceMatchScore * 0.10 +
            conflictScore * 0.15 +
            intlCapabilityScore * 0.15 +
            wealthBonus;
        } else {
          // Dynamic location weight: under $10M portfolios + small firm + basic service
          // get boosted location, stolen proportionally from Visor and priority
          let locBoost = 0;
          if (netWorthAmount) {
            if (netWorthAmount < 250_000) locBoost += 0.10;
            else if (netWorthAmount < 1_000_000) locBoost += 0.08;
            else if (netWorthAmount < 5_000_000) locBoost += 0.05;
            else if (netWorthAmount < 10_000_000) locBoost += 0.03;
          }
          if (params.firmSize === 'small') locBoost += 0.05;
          if (params.serviceDepth === 'basic') locBoost += 0.02;
          locBoost = Math.min(locBoost, 0.15); // cap at 25% total location weight

          // Steal proportionally from Visor baseline and priority scoring
          const locWeight = 0.10 + locBoost;
          const visorWeight = 0.20 - locBoost * 0.42;
          const priorityWeight = 0.25 - locBoost * 0.58;

          finalScore =
            visorBaseline * visorWeight +
            priorityScore * priorityWeight +
            feeScore * 0.10 +
            firmSizeScore * 0.10 +
            serviceMatchScore * 0.10 +
            conflictScore * 0.10 +
            locationScore * locWeight +
            wealthBonus;
        }

        // ── Reason tags (sub-scores are 0-10 scale) ──
        // Build candidate tags with relevance: priority-aligned tags sort first
        const candidateTags: { tag: string; priority: boolean }[] = [];
        const hasPriority = (p: string) => params.priorities.includes(p);

        if (score?.conflict_free_score != null && score.conflict_free_score === 10)
          candidateTags.push({ tag: 'Fiduciary', priority: hasPriority('fiduciary') || hasPriority('fee_only') });
        if (score?.fee_transparency_score != null && score.fee_transparency_score >= 8)
          candidateTags.push({ tag: 'Transparent Fees', priority: hasPriority('fees') });
        if (score?.fee_competitiveness_score != null && score.fee_competitiveness_score >= 8)
          candidateTags.push({ tag: 'Competitive Fees', priority: hasPriority('fees') });
        if (score?.aum_growth_score != null && score.aum_growth_score === 10)
          candidateTags.push({ tag: 'Strong Growth', priority: hasPriority('aum_growth') });
        if (score?.client_growth_score != null && score.client_growth_score === 10)
          candidateTags.push({ tag: 'Client Retention', priority: hasPriority('client_retention') });
        if (score?.advisor_bandwidth_score != null && score.advisor_bandwidth_score >= 9)
          candidateTags.push({ tag: 'Personal Attention', priority: hasPriority('personal_service') });
        if (isInternational && (firm.non_us_client_percent ?? 0) >= 5) {
          candidateTags.push({ tag: 'Serves International Clients', priority: true });
        } else if (locationScore >= 85) {
          // Same-state HQ or same-city
          candidateTags.push({ tag: 'Local', priority: true });
        } else if (locationScore >= 50) {
          // State presence (registered/operates in state)
          candidateTags.push({ tag: 'Operates in Your State', priority: false });
        }

        // Sort: priority-aligned tags first, then take top 3
        candidateTags.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
        reasons.push(...candidateTags.slice(0, 3).map(t => t.tag));

        // ── Fee calculation ──
        let estimatedFee = 'Contact firm';
        if (netWorthAmount && feeData) {
          // Try actual tiered calculation first
          let tiers = tierMap.get(firm.crd);
          if (!tiers || tiers.length === 0) {
            // Synthesize tiers from range data
            const avgClient = totalClients > 0 ? (firm.aum || 0) / totalClients : netWorthAmount;
            if (feeData.fee_range_min != null && feeData.fee_range_max != null) {
              tiers = synthesizeRangeTiers(feeData.fee_range_min, feeData.fee_range_max, avgClient);
            } else if (feeData.fee_range_max != null) {
              tiers = synthesizeMaxOnlyTiers(feeData.fee_range_max, avgClient);
            }
          }

          if (tiers && tiers.length > 0) {
            const annualFee = calcTieredFeeSimple(netWorthAmount, tiers);
            if (annualFee > 0) {
              const pct = ((annualFee / netWorthAmount) * 100).toFixed(2);
              estimatedFee = `${formatDollar(Math.round(annualFee))}/yr (${pct}%)`;
            }
          } else if (feeData.fee_range_max != null) {
            // Fallback to range display
            estimatedFee = feeData.fee_range_min != null
              ? `${feeData.fee_range_min}–${feeData.fee_range_max}%`
              : `${feeData.fee_range_max}%`;
          }
        } else if (feeData) {
          // No net worth — show range
          if (feeData.fee_range_min != null && feeData.fee_range_max != null) {
            estimatedFee = `${feeData.fee_range_min}–${feeData.fee_range_max}%`;
          } else if (feeData.fee_range_max != null) {
            estimatedFee = `${feeData.fee_range_max}%`;
          }
        }

        // ── Generate "why" sentence from scoring factors ──
        const whyParts: string[] = [];

        // Location-based reasons
        if (isInternational && (firm.non_us_client_percent ?? 0) >= 5) {
          whyParts.push(`serves international clients (${firm.non_us_client_percent}% non-US)`);
        } else if (locationScore >= 85) {
          whyParts.push(`headquartered in your area`);
        } else if (locationScore >= 50) {
          whyParts.push(`operates in your state`);
        }

        // Fee-based reasons
        if (feeScore >= 80) {
          whyParts.push('highly competitive fee structure');
        } else if (feeScore >= 60) {
          whyParts.push('competitive fees at your portfolio size');
        }

        // Visor quality
        if (visorBaseline >= 85) {
          whyParts.push(`top-rated on the Visor Index (${Math.round(visorBaseline)}/100)`);
        }

        // Priority-specific reasons
        if (params.priorities.includes('fiduciary') || params.priorities.includes('fee_only')) {
          if (conflictScore >= 80) whyParts.push('strong fiduciary profile');
        }
        if (params.priorities.includes('personal_service')) {
          if (n(score?.advisor_bandwidth_score) >= 70) whyParts.push('above-average advisor bandwidth');
        }
        if (params.priorities.includes('aum_growth')) {
          if (n(score?.aum_growth_score) >= 80) whyParts.push('strong asset growth track record');
        }
        if (params.priorities.includes('client_retention')) {
          if (n(score?.client_growth_score) >= 80) whyParts.push('excellent client retention');
        }
        if (params.priorities.includes('comprehensive')) {
          if (serviceMatchScore >= 75) whyParts.push('broad service offering');
        }

        // Firm size alignment
        if (firmSizeScore >= 90) {
          whyParts.push('firm size matches your preference');
        }

        // Build sentence — take top 3 factors
        const topFactors = whyParts.slice(0, 3);
        const matchReason = topFactors.length > 0
          ? topFactors.length <= 2
            ? topFactors.join(' and ')
            : topFactors.slice(0, -1).join(', ') + ', and ' + topFactors[topFactors.length - 1]
          : 'Aligns with your stated preferences across multiple dimensions';

        return {
          crd: firm.crd,
          name: firm.primary_business_name,
          displayName,
          city: firm.main_office_city,
          state: firm.main_office_state,
          aum: firm.aum || 0,
          feeCompetitiveness: score?.fee_competitiveness_score || 50,
          clientGrowth: score?.client_growth_score || 50,
          advisorBandwidth: score?.advisor_bandwidth_score || 50,
          rawScore: finalScore,
          matchPercent: 0, // computed after rescaling
          reasons: reasons.slice(0, 3),
          matchReason,
          estimatedFee,
          visorScore: score?.final_score || null,
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null && f.rawScore > 20)
      .sort((a, b) => b.rawScore - a.rawScore)
      .slice(0, 25);

    // Rescale: map raw score range to a display range with meaningful spread
    // Top firm → ~92-95%, 25th firm → ~60-70%
    if (scoredFirms.length > 0) {
      const maxRaw = scoredFirms[0].rawScore;
      const minRaw = scoredFirms[scoredFirms.length - 1].rawScore;
      const rawRange = maxRaw - minRaw;

      for (const firm of scoredFirms) {
        if (rawRange < 1) {
          // All firms scored nearly the same — spread evenly by rank
          const rank = scoredFirms.indexOf(firm);
          firm.matchPercent = Math.round(93 - (rank / Math.max(1, scoredFirms.length - 1)) * 25);
        } else {
          // Map raw range to display range 68–93
          const normalized = (firm.rawScore - minRaw) / rawRange; // 0-1
          firm.matchPercent = Math.round(68 + normalized * 25);
        }
      }
    }

    return NextResponse.json({
      firms: scoredFirms.map(({ rawScore, ...rest }) => rest),
    });
  } catch (error) {
    console.error('Match error:', error);
    return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 });
  }
}
