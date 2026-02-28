/**
 * Visor Value Score Calculator
 * 
 * Calculates composite scores for all firms and upserts to firm_scores table.
 * See /visor_value_score.md for full methodology.
 * 
 * 10 components × 10 points = 100 max score.
 */

const { supabase } = require('./config.js');

// All disclosure columns in firmdata_current
const DISCLOSURE_FIELDS = [
  'disclosure_firm_court_ruling_dismissal', 'disclosure_firm_court_ruling_investment',
  'disclosure_firm_court_ruling_ongoing_litigation', 'disclosure_firm_court_ruling_violation',
  'disclosure_firm_current_regulatory_proceedings', 'disclosure_firm_federal_false_statement',
  'disclosure_firm_federal_investment_order_10_years', 'disclosure_firm_federal_revoke',
  'disclosure_firm_federal_suspension_restrictions', 'disclosure_firm_federal_violations',
  'disclosure_firm_felony_charge', 'disclosure_firm_felony_conviction',
  'disclosure_firm_misdemenor_charge', 'disclosure_firm_misdemenor_conviction',
  'disclosure_firm_sec_cftc_false_statement', 'disclosure_firm_sec_cftc_investment_order',
  'disclosure_firm_sec_cftc_monetary_penalty', 'disclosure_firm_sec_cftc_suspension_restrictions',
  'disclosure_firm_sec_cftc_violations', 'disclosure_firm_suspension_revoked',
  'disclosure_firm_self_regulatory_discipline', 'disclosure_firm_self_regulatory_false_statement',
  'disclosure_firm_self_regulatory_suspension_restrictions', 'disclosure_firm_self_regulatory_violation',
];

// All client count fields
const CLIENT_FIELDS = [
  'client_hnw_number', 'client_non_hnw_number', 'client_pension_number',
  'client_charitable_number', 'client_corporations_number', 'client_pooled_vehicles_number',
  'client_other_number', 'client_banks_number', 'client_bdc_number',
  'client_govt_number', 'client_insurance_number', 'client_investment_cos_number',
  'client_other_advisors_number', 'client_swf_number',
];

// --- Helper: Calculate tiered fee for a given portfolio amount ---
function calcTieredFee(amount, tiers) {
  if (!tiers || tiers.length === 0) return null;

  const sorted = tiers
    .filter(t => t.fee_pct != null)
    .sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'));

  if (sorted.length === 0) return null;

  if (sorted.length === 1) {
    return amount * (sorted[0].fee_pct / 100);
  }

  let totalFee = 0;
  let remaining = amount;

  for (let i = 0; i < sorted.length && remaining > 0; i++) {
    const tierMin = parseInt(sorted[i].min_aum || '0');
    const tierMax = sorted[i].max_aum;
    const pct = sorted[i].fee_pct / 100;
    const bracketSize = tierMax ? tierMax - tierMin : remaining;
    const taxable = Math.min(remaining, bracketSize);
    totalFee += taxable * pct;
    remaining -= taxable;
  }

  return totalFee;
}

// --- Helper: Get quartile score ---
function quartileScore(value, sortedValues, higherIsBetter = true) {
  if (value == null || sortedValues.length === 0) return 0;
  const rank = sortedValues.filter(v => higherIsBetter ? v <= value : v >= value).length;
  const pct = rank / sortedValues.length;
  if (pct >= 0.75) return 10;
  if (pct >= 0.50) return 7;
  if (pct >= 0.25) return 3;
  return 0;
}

function getPercentile(value, sortedValues, higherIsBetter = true) {
  if (value == null || sortedValues.length === 0) return null;
  const rank = sortedValues.filter(v => higherIsBetter ? v <= value : v >= value).length;
  return Math.round((rank / sortedValues.length) * 100);
}

async function calculateScores() {
  console.log('🔍 Calculating Visor Value Scores...');
  const startTime = Date.now();

  // --- Fetch all data ---
  const selectFields = [
    'crd', 'aum', 'employee_investment', 'employee_insurance', 'employee_broker_dealer',
    'asset_allocation_derivatives', 'client_non_hnw_number',
    ...CLIENT_FIELDS, ...DISCLOSURE_FIELDS,
  ].join(',');

  // Paginate to get all firms (Supabase default limit is 1000)
  let firms = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error: firmErr } = await supabase
      .from('firmdata_current')
      .select(selectFields)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (firmErr) { console.error('❌ Error fetching firms:', firmErr); return; }
    if (!data || data.length === 0) break;
    firms = firms.concat(data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }
  console.log(`📊 Loaded ${firms.length} firms`);

  // Fee structure types
  const { data: feesAndMins } = await supabase
    .from('firmdata_feesandmins')
    .select('crd, fee_structure_type');
  const feeTypeMap = new Map((feesAndMins || []).map(f => [f.crd, f.fee_structure_type]));

  // Fee tiers (for fee competitiveness calculation)
  const { data: allFeeTiers } = await supabase
    .from('firmdata_feetiers')
    .select('crd, min_aum, max_aum, fee_pct');
  const feeTierMap = new Map();
  (allFeeTiers || []).forEach(t => {
    if (!feeTierMap.has(t.crd)) feeTierMap.set(t.crd, []);
    feeTierMap.get(t.crd).push(t);
  });

  // Growth rate rankings
  const { data: growthData } = await supabase
    .from('firmdata_growth_rate_rankings')
    .select('crd, aum_5y_growth_annualized, aum_1y_growth_annualized, clients_5y_growth_annualized, clients_1y_growth_annualized');
  const growthMap = new Map((growthData || []).map(g => [g.crd, g]));

  // --- Pre-compute distributions for percentile-based scores ---

  // Fee competitiveness: calculate $10M fee for each firm
  const PORTFOLIO_SIZE = 10_000_000;
  const feeCalcs = [];
  for (const firm of firms) {
    const tiers = feeTierMap.get(firm.crd);
    const fee = calcTieredFee(PORTFOLIO_SIZE, tiers);
    if (fee != null && fee > 0) {
      feeCalcs.push({ crd: firm.crd, fee });
    }
  }
  const sortedFees = feeCalcs.map(f => f.fee).sort((a, b) => a - b);
  const feeMap = new Map(feeCalcs.map(f => [f.crd, f.fee]));

  // AUM growth distributions
  const aumGrowthValues = [];
  for (const firm of firms) {
    const g = growthMap.get(firm.crd);
    if (!g) continue;
    const val = parseFloat(g.aum_5y_growth_annualized) ?? parseFloat(g.aum_1y_growth_annualized) ?? null;
    if (val != null) aumGrowthValues.push(val);
  }
  aumGrowthValues.sort((a, b) => a - b);

  // Client growth distributions
  const clientGrowthValues = [];
  for (const firm of firms) {
    const g = growthMap.get(firm.crd);
    if (!g) continue;
    const val = parseFloat(g.clients_5y_growth_annualized) ?? parseFloat(g.clients_1y_growth_annualized) ?? null;
    if (val != null) clientGrowthValues.push(val);
  }
  clientGrowthValues.sort((a, b) => a - b);

  // Advisor bandwidth distributions
  const bandwidthValues = [];
  for (const firm of firms) {
    const totalClients = CLIENT_FIELDS.reduce((sum, f) => sum + (parseFloat(firm[f]) || 0), 0);
    const invEmployees = parseFloat(firm.employee_investment) || 0;
    if (invEmployees > 0 && totalClients > 0) {
      bandwidthValues.push(totalClients / invEmployees);
    }
  }
  bandwidthValues.sort((a, b) => a - b);

  // --- Calculate scores for each firm ---
  const scores = [];
  
  for (const firm of firms) {
    const totalClients = CLIENT_FIELDS.reduce((sum, f) => sum + (parseFloat(firm[f]) || 0), 0);

    // 1. Disclosure score (10 pts)
    const hasDisclosure = DISCLOSURE_FIELDS.some(f => firm[f] === 'Y' || firm[f] === 'y');
    const disclosureScore = hasDisclosure ? 0 : 10;

    // 2. Fee transparency score (10 pts)
    const feeType = feeTypeMap.get(firm.crd);
    let feeTransparencyScore = 0;
    if (feeType === 'tiered' || feeType === 'flat_percentage') feeTransparencyScore = 10;
    else if (feeType === 'range') feeTransparencyScore = 6;

    // 3. Fee competitiveness score (10 pts)
    const firmFee = feeMap.get(firm.crd);
    // Lower fees are better, so we invert: quartile based on lowest = best
    const feeCompScore = firmFee != null
      ? quartileScore(firmFee, sortedFees, false) // false = lower is better
      : 5; // Default to 5 (average) if no fee data
    const feeCompPct = firmFee != null ? getPercentile(firmFee, sortedFees, false) : null;

    // 4. Conflict free score (10 pts)
    const empBD = parseFloat(firm.employee_broker_dealer) || 0;
    const empIns = parseFloat(firm.employee_insurance) || 0;
    let conflictFreeScore = 10;
    if (empBD > 0 && empIns > 0) conflictFreeScore = 0;
    else if (empBD > 0) conflictFreeScore = 5;

    // 5. AUM growth score (10 pts)
    const growth = growthMap.get(firm.crd);
    const aumGrowthVal = growth
      ? (parseFloat(growth.aum_5y_growth_annualized) ?? parseFloat(growth.aum_1y_growth_annualized) ?? null)
      : null;
    let aumGrowthScore = 5; // Default to 5 if no growth data
    let aumGrowthPct = null;
    if (aumGrowthVal != null) {
      const pctRank = aumGrowthValues.filter(v => v <= aumGrowthVal).length / aumGrowthValues.length;
      aumGrowthPct = Math.round(pctRank * 100);
      if (pctRank >= 0.75) aumGrowthScore = 10;
      else if (pctRank >= 0.50) aumGrowthScore = 5;
      else aumGrowthScore = 0;
    }

    // 6. Client growth score (10 pts)
    const clientGrowthVal = growth
      ? (parseFloat(growth.clients_5y_growth_annualized) ?? parseFloat(growth.clients_1y_growth_annualized) ?? null)
      : null;
    let clientGrowthScore = 5; // Default to 5 if no growth data
    let clientGrowthPct = null;
    if (clientGrowthVal != null) {
      const pctRank = clientGrowthValues.filter(v => v <= clientGrowthVal).length / clientGrowthValues.length;
      clientGrowthPct = Math.round(pctRank * 100);
      if (pctRank >= 0.75) clientGrowthScore = 10;
      else if (pctRank >= 0.50) clientGrowthScore = 5;
      else clientGrowthScore = 0;
    }

    // 7. Advisor bandwidth score (10 pts)
    const invEmployees = parseFloat(firm.employee_investment) || 0;
    let advisorBandwidthScore = 0;
    let advisorBandwidthPct = null;
    if (invEmployees > 0 && totalClients > 0) {
      const ratio = totalClients / invEmployees;
      // Lower ratio is better
      advisorBandwidthScore = quartileScore(ratio, bandwidthValues, false);
      advisorBandwidthPct = getPercentile(ratio, bandwidthValues, false);
    }

    // 8. Derivatives score (10 pts)
    const derivativesPct = parseFloat(firm.asset_allocation_derivatives) || 0;
    let derivativesScore = 0;
    if (derivativesPct > 30) derivativesScore = 10;
    else if (derivativesPct >= 20) derivativesScore = 8;
    else if (derivativesPct >= 10) derivativesScore = 6;

    // 9. Upmarket score (10 pts)
    let upmarketScore = 0;
    const nonHnwPct = totalClients > 0 ? ((parseFloat(firm.client_non_hnw_number) || 0) / totalClients) * 100 : 100;
    if (nonHnwPct < 10) upmarketScore = 10;
    else if (nonHnwPct < 25) upmarketScore = 4;
    else if (nonHnwPct < 50) upmarketScore = 2;
    else upmarketScore = 0;

    // 10. Viability score (10 pts)
    const aum = parseFloat(firm.aum) || 0;
    let viabilityScore = 0;
    if (aum > 1_000_000_000) viabilityScore = 10;
    else if (aum > 500_000_000) viabilityScore = 5;
    else if (aum > 100_000_000) viabilityScore = 2;

    // Composite / Final score
    const compositeScore = disclosureScore + feeTransparencyScore + feeCompScore +
      conflictFreeScore + aumGrowthScore + clientGrowthScore + advisorBandwidthScore +
      derivativesScore + upmarketScore + viabilityScore;

    scores.push({
      crd: firm.crd,
      disclosure_score: disclosureScore,
      fee_transparency_score: feeTransparencyScore,
      fee_competitiveness_score: feeCompScore,
      conflict_free_score: conflictFreeScore,
      aum_growth_score: aumGrowthScore,
      client_growth_score: clientGrowthScore,
      advisor_bandwidth_score: advisorBandwidthScore,
      derivatives_score: derivativesScore,
      upmarket_score: upmarketScore,
      viability_score: viabilityScore,
      broker_penalty: 0,
      insurance_penalty: 0,
      composite_score: compositeScore,
      final_score: compositeScore,
      fee_competitiveness_pct: feeCompPct,
      aum_growth_pct: aumGrowthPct,
      client_growth_pct: clientGrowthPct,
      advisor_bandwidth_pct: advisorBandwidthPct,
      calculated_at: new Date().toISOString(),
      aum: aum,
      client_count: totalClients,
      derivatives_pct: derivativesPct,
      non_hnw_pct: Math.round(nonHnwPct),
      fee_disclosed: feeType !== 'not_disclosed' && feeType != null,
      has_insurance: empIns > 0,
      has_broker_dealer: empBD > 0,
    });
  }

  console.log(`✅ Calculated scores for ${scores.length} firms`);

  // --- Show distribution ---
  const finalScores = scores.map(s => s.final_score).sort((a, b) => a - b);
  const p10 = finalScores[Math.floor(finalScores.length * 0.10)];
  const p25 = finalScores[Math.floor(finalScores.length * 0.25)];
  const p50 = finalScores[Math.floor(finalScores.length * 0.50)];
  const p75 = finalScores[Math.floor(finalScores.length * 0.75)];
  const p90 = finalScores[Math.floor(finalScores.length * 0.90)];
  const avg = (finalScores.reduce((s, v) => s + v, 0) / finalScores.length).toFixed(1);
  const min = finalScores[0];
  const max = finalScores[finalScores.length - 1];

  console.log('\n📊 Score Distribution:');
  console.log(`   Min: ${min} | P10: ${p10} | P25: ${p25} | Median: ${p50} | P75: ${p75} | P90: ${p90} | Max: ${max} | Avg: ${avg}`);

  // --- Upsert to firm_scores ---
  // Batch in chunks of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < scores.length; i += BATCH_SIZE) {
    const batch = scores.slice(i, i + BATCH_SIZE);
    const { error: upsertErr } = await supabase
      .from('firm_scores')
      .upsert(batch, { onConflict: 'crd' });
    
    if (upsertErr) {
      console.error(`❌ Upsert error (batch ${i / BATCH_SIZE + 1}):`, upsertErr.message);
    } else {
      console.log(`💾 Saved batch ${i / BATCH_SIZE + 1} (${batch.length} firms)`);
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`\n✅ Visor Value Score calculation complete in ${(elapsed / 1000).toFixed(1)}s`);
}

// Run
calculateScores()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
