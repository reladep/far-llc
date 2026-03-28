import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MatchParams {
  netWorth: string;
  lifeTrigger: string;
  location: string;
  priorities: string[];
  feeSensitivity: string;
  firmSize: string;
  serviceDepth: string;
  conflictImportance: string;
}

// Location mapping
const LOCATION_MAP: Record<string, string[]> = {
  ny: ['NY', 'NJ', 'CT', 'PA'],
  ca: ['CA'],
  fl: ['FL'],
  tx: ['TX'],
  il: ['IL'],
  ma: ['MA', 'NH', 'RI', 'VT'],
  other: [],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const params: MatchParams = {
    netWorth: searchParams.get('netWorth') || '',
    lifeTrigger: searchParams.get('lifeTrigger') || '',
    location: searchParams.get('location') || 'other',
    priorities: searchParams.get('priorities')?.split(',').filter(Boolean) || [],
    feeSensitivity: searchParams.get('feeSensitivity') || 'somewhat',
    firmSize: searchParams.get('firmSize') || 'any',
    serviceDepth: searchParams.get('serviceDepth') || 'standard',
    conflictImportance: searchParams.get('conflictImportance') || 'important',
  };

  try {
    // Get firms matching location
    const locationStates = LOCATION_MAP[params.location] || [];
    
    let query = supabase
      .from('firmdata_current')
      .select('crd, primary_business_name, main_office_city, main_office_state, aum, employee_total, employee_investment')
      .limit(200);

    if (locationStates.length > 0) {
      query = query.in('main_office_state', locationStates);
    }

    const { data: firms, error } = await query;
    
    if (error) throw error;
    if (!firms || firms.length === 0) {
      return NextResponse.json({ firms: [] });
    }

    const crds = firms.map(f => f.crd);
    
    // Get firm names
    const { data: firmNames } = await supabase
      .from('firm_names')
      .select('crd, display_name')
      .in('crd', crds);
    
    const nameMap = new Map(firmNames?.map(n => [n.crd, n.display_name]) || []);
    
    // Get firm scores
    const { data: scores } = await supabase
      .from('firm_scores')
      .select('*')
      .in('crd', crds);

    const scoreMap = new Map(scores?.map(s => [s.crd, s]) || []);

    // Get fee data for real estimated fees
    const { data: feeData } = await supabase
      .from('firmdata_feesandmins')
      .select('crd, fee_range_min, fee_range_max')
      .in('crd', crds);

    const feeDataMap = new Map(feeData?.map(f => [f.crd, f]) ?? []);

    // Filter and score firms
    const scoredFirms = firms
      .map(firm => {
        const score = scoreMap.get(firm.crd);
        const displayName = nameMap.get(firm.crd);
        
        let matchPercent = 50; // Base score
        const reasons: string[] = [];
        
        if (score) {
          // Add base score from Visor Index
          matchPercent += (score.final_score - 50) * 0.4;
          
          // Weight fee transparency and conflict-free higher
          if (params.priorities.includes('fees') || params.feeSensitivity === 'very' || params.feeSensitivity === 'somewhat') {
            if (score.fee_transparency_score) {
              matchPercent += (score.fee_transparency_score - 50) * 0.1;
            }
            if (score.fee_competitiveness_score) {
              matchPercent += (score.fee_competitiveness_score - 50) * 0.1;
            }
          }
          
          // Weight conflict-free higher if important
          if (params.conflictImportance === 'critical' || params.conflictImportance === 'important') {
            if (score.conflict_free_score) {
              matchPercent += (score.conflict_free_score - 50) * 0.15;
            }
          }
          
          // AUM growth is positive
          if (score.aum_growth_score && score.aum_growth_score > 70) {
            matchPercent += 3;
            reasons.push('Strong AUM Growth');
          }
          
          // Client growth is positive
          if (score.client_growth_score && score.client_growth_score > 70) {
            matchPercent += 2;
            reasons.push('Client Retention');
          }
          
          // Advisor bandwidth - lower is better (more personal attention)
          if (score.advisor_bandwidth_score && score.advisor_bandwidth_score > 70) {
            matchPercent += 2;
            reasons.push('Personal Attention');
          }
          
          // Good disclosure score
          if (score.disclosure_score && score.disclosure_score > 80) {
            reasons.push('Clean Record');
          }
        }
        
        // Firm size filtering
        if (params.firmSize === 'small' && firm.aum && firm.aum > 500000000) {
          matchPercent -= 20;
        } else if (params.firmSize === 'mid' && firm.aum) {
          if (firm.aum < 500000000 || firm.aum > 5000000000) {
            matchPercent -= 15;
          }
        } else if (params.firmSize === 'large' && firm.aum && firm.aum < 5000000000) {
          matchPercent -= 20;
        }
        
        // Fee-only priority
        if (params.priorities.includes('fee_only') || params.priorities.includes('fiduciary')) {
          // This would need additional data from the firm
          // For now, we assume fee transparency is a proxy
        }
        
        // Add score-based reasons
        if (score) {
          if (score.fee_transparency_score >= 70) reasons.push('Transparent Fees');
          if (score.conflict_free_score >= 70) reasons.push('Fiduciary');
        }
        
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
          matchPercent: Math.min(100, Math.max(0, Math.round(matchPercent))),
          reasons: reasons.slice(0, 4),
          estimatedFee: (() => {
            const fee = feeDataMap.get(firm.crd) as { fee_range_min?: string; fee_range_max?: string } | undefined;
            if (!fee?.fee_range_min) return 'Contact firm';
            return fee.fee_range_max
              ? `${fee.fee_range_min}–${fee.fee_range_max}%`
              : `${fee.fee_range_min}%`;
          })(),
          visorScore: score?.final_score || null,
        };
      })
      .filter(f => f.matchPercent > 20)
      .sort((a, b) => b.matchPercent - a.matchPercent)
      .slice(0, 20);

    return NextResponse.json({ firms: scoredFirms });
  } catch (error) {
    console.error('Match error:', error);
    return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 });
  }
}