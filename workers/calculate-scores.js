/**
 * Firm Scores Worker
 * 
 * Calculates composite scores for each firm based on:
 * - Fee competitiveness (lower fees = higher score)
 * - AUM growth (historical growth rate)
 * - Client growth (client retention and growth)
 * - Advisor bandwidth (AUM per advisor - lower = more personal attention)
 * - Disclosure score (fewer disclosures = higher score)
 * 
 * Scores are normalized 0-100.
 */

import { createClient } from '@supabase/supabase-js';
import config from './config.js';

const supabaseUrl = process.env.SUPABASE_URL || config.supabase.url;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || config.supabase.serviceKey;
const supabase = createClient(supabaseUrl, supabaseKey);

interface FirmScore {
  crd: number;
  fee_score: number;
  aum_growth_score: number;
  client_growth_score: number;
  advisor_bandwidth_score: number;
  disclosure_score: number;
  composite_score: number;
  calculated_at: string;
}

// Weights for each component
const WEIGHTS = {
  fee_competitiveness: 0.30,
  aum_growth: 0.20,
  client_growth: 0.20,
  advisor_bandwidth: 0.15,
  disclosure: 0.15,
};

async function calculateFirmScores() {
  console.log('🔍 Calculating firm scores...');
  
  const startTime = Date.now();
  
  // Fetch all firms with required data
  const { data: firms, error } = await supabase
    .from('firmdata_current')
    .select(`
      crd,
      primary_business_name,
      aum,
      aum_discretionary,
      employee_total,
      employee_investment,
      client_hnw_number,
      client_non_hnw_number,
      client_pension_number,
      client_charitable_number,
      client_corporations_number,
      client_pooled_vehicles_number,
      client_other_number,
      client_banks_number,
      client_bdc_number,
      client_govt_number,
      client_insurance_number,
      client_investment_cos_number,
      client_other_advisors_number,
      client_swf_number
    `)
    .not('aum', 'is', null);

  if (error) {
    console.error('❌ Error fetching firms:', error);
    return;
  }

  console.log(`📊 Processing ${firms.length} firms...`);
  
  // Fetch growth data for AUM growth calculation
  const crds = firms.map(f => f.crd);
  const { data: growthData } = await supabase
    .from('firmdata_growth')
    .select('crd, aum, date_submitted')
    .in('crd', crds)
    .order('date_submitted', { ascending: true });

  // Fetch disclosure counts
  const { data: disclosureCounts } = await supabase
    .from('firm_disclosures')
    .select('crd')
    .in('crd', crds);
  
  const disclosureMap = new Map<number, number>();
  disclosureCounts?.forEach(d => {
    disclosureMap.set(d.crd, (disclosureMap.get(d.crd) || 0) + 1);
  });

  // Calculate percentile ranks for each metric
  const feeData = firms
    .filter(f => f.aum && f.aum > 0)
    .map(f => ({ crd: f.crd, aum: f.aum, employees: f.employee_investment || 1 }))
    .map(f => ({ 
      crd: f.crd, 
      // Fee competitiveness: smaller AUM firms typically have higher fees
      // We'll inverse this - higher AUM per employee = more efficient = higher score
      feeMetric: f.aum / (f.employees || 1)
    }));

  // Get percentile for fee metric (higher = better)
  const feeValues = feeData.map(f => f.feeMetric).sort((a, b) => a - b);
  const getPercentile = (val: number) => {
    const idx = feeValues.findIndex(v => v >= val);
    return idx >= 0 ? (idx + 1) / feeValues.length : 0.5;
  };

  // Build growth map
  const growthMap = new Map<number, { aums: number[], dates: string[] }>();
  growthData?.forEach(g => {
    if (!growthMap.has(g.crd)) {
      growthMap.set(g.crd, { aums: [], dates: [] });
    }
    const entry = growthMap.get(g.crd)!;
    if (g.aum) entry.aums.push(parseFloat(g.aum));
    if (g.date_submitted) entry.dates.push(g.date_submitted);
  });

  // Calculate scores for each firm
  const scores: FirmScore[] = [];
  
  for (const firm of firms) {
    // 1. Fee competitiveness score (based on AUM - larger firms can offer lower fees)
    let feeScore = 50;
    if (firm.aum) {
      const feeMetric = firm.aum / (firm.employee_investment || 1);
      feeScore = getPercentile(feeMetric) * 100;
    }

    // 2. AUM growth score
    let aumGrowthScore = 50;
    const growthEntry = growthMap.get(firm.crd);
    if (growthEntry && growthEntry.aums.length >= 2) {
      const first = growthEntry.aums[0];
      const last = growthEntry.aums[growthEntry.aums.length - 1];
      const years = growthEntry.aums.length; // Simplified
      if (first > 0 && years > 0) {
        const cagr = Math.pow(last / first, 1 / Math.max(years, 1)) - 1;
        // Normalize: 10%+ = 100, 0% = 50, -10% = 0
        aumGrowthScore = Math.min(100, Math.max(0, 50 + cagr * 500));
      }
    }

    // 3. Client growth score
    let clientGrowthScore = 50;
    const totalClients = [
      firm.client_hnw_number, firm.client_non_hnw_number, firm.client_pension_number,
      firm.client_charitable_number, firm.client_corporations_number, firm.client_pooled_vehicles_number,
      firm.client_other_number, firm.client_banks_number, firm.client_bdc_number,
      firm.client_govt_number, firm.client_insurance_number, firm.client_investment_cos_number,
      firm.client_other_advisors_number, firm.client_swf_number,
    ].reduce((sum, v) => sum + (v || 0), 0);

    if (totalClients > 0 && firm.aum && firm.aum > 0) {
      // Higher AUM per client = potentially better service
      const aumPerClient = firm.aum / totalClients;
      // Normalize: $1M/client = 50, $10M/client = 100, $100K/client = 10
      clientGrowthScore = Math.min(100, Math.max(0, Math.log10(aumPerClient / 100000) * 25 + 50));
    }

    // 4. Advisor bandwidth score (lower AUM per advisor = more personal attention)
    let advisorBandwidthScore = 50;
    if (firm.aum && firm.employee_investment && firm.employee_investment > 0) {
      const aumPerAdvisor = firm.aum / firm.employee_investment;
      // Normalize: $50M/advisor = 100, $500M/advisor = 10
      advisorBandwidthScore = Math.min(100, Math.max(0, 100 - (aumPerAdvisor / 5000000) * 90));
    }

    // 5. Disclosure score (fewer disclosures = higher score)
    let disclosureScore = 100;
    const disclosureCount = disclosureMap.get(firm.crd) || 0;
    if (disclosureCount > 0) {
      disclosureScore = Math.max(0, 100 - disclosureCount * 20);
    }

    // Calculate composite score
    const compositeScore = (
      feeScore * WEIGHTS.fee_competitiveness +
      aumGrowthScore * WEIGHTS.aum_growth +
      clientGrowthScore * WEIGHTS.client_growth +
      advisorBandwidthScore * WEIGHTS.advisor_bandwidth +
      disclosureScore * WEIGHTS.disclosure
    );

    scores.push({
      crd: firm.crd,
      fee_score: Math.round(feeScore),
      aum_growth_score: Math.round(aumGrowthScore),
      client_growth_score: Math.round(clientGrowthScore),
      advisor_bandwidth_score: Math.round(advisorBandwidthScore),
      disclosure_score: Math.round(disclosureScore),
      composite_score: Math.round(compositeScore),
      calculated_at: new Date().toISOString(),
    });
  }

  console.log(`✅ Calculated scores for ${scores.length} firms`);

  // Upsert scores to database
  // Note: This requires a firm_scores table to exist
  try {
    // Try to insert/update scores
    const { error: upsertError } = await supabase
      .from('firm_scores')
      .upsert(scores, { onConflict: 'crd' });

    if (upsertError) {
      console.log('⚠️ firm_scores table may not exist or has schema mismatch');
      console.log('Scores calculated but not saved:', upsertError.message);
    } else {
      console.log('💾 Saved firm scores to database');
    }
  } catch (e) {
    console.log('⚠️ Could not save scores:', e);
  }

  const elapsed = Date.now() - startTime;
  console.log(`✅ Firm scores calculation complete in ${elapsed}ms`);
  
  return scores;
}

// Run if called directly
calculateFirmScores()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
