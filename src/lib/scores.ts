import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch firm scores for a list of CRDs
 */
export async function getFirmScores(crds: number[]) {
  if (!crds || crds.length === 0) return new Map<number, any>();
  
  const { data, error } = await supabase
    .from('firm_scores')
    .select('*')
    .in('crd', crds);
  
  if (error) {
    console.error('Error fetching firm scores:', error);
    return new Map<number, any>();
  }
  
  const scoreMap = new Map<number, any>();
  (data || []).forEach(score => {
    scoreMap.set(score.crd, score);
  });
  
  return scoreMap;
}

/**
 * Fetch a single firm's score
 */
export async function getFirmScore(crd: number) {
  const { data, error } = await supabase
    .from('firm_scores')
    .select('*')
    .eq('crd', crd)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching firm score:', error);
    return null;
  }
  
  return data;
}