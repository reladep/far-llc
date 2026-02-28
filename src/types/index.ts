export interface Firm {
  crd: number;
  primary_business_name: string;
  display_name?: string | null;
  main_office_city: string;
  main_office_state: string;
  aum: number;
  services_financial_planning: boolean;
  tag_1?: string;
  tag_2?: string;
  tag_3?: string;
  website?: string;
  logo_key?: string;
  business_profile?: string;
  notable_characteristics?: string;
  tags_confidence?: number;
  avg_rating?: number;
  review_count?: number;
  ad_tier?: 'none' | 'featured' | 'promoted';
}

export interface Review {
  id: string;
  crd: number;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  verified_client: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  plan_tier: 'free' | 'starter' | 'pro' | 'enterprise';
}

export interface Lead {
  id: string;
  crd: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'pending' | 'contacted' | 'closed';
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, boolean>;
}

export interface UserComparison {
  id: string;
  user_id: string;
  name: string;
  firm_crds: number[];
  created_at: string;
}

export interface UserAlert {
  id: string;
  user_id: string;
  name: string;
  criteria: Record<string, unknown>;
  notify_email: boolean;
  notify_push: boolean;
}

export interface FirmScore {
  crd: number;
  final_score: number;
  composite_score: number;
  disclosure_score: number;
  fee_transparency_score: number;
  fee_competitiveness_score: number;
  conflict_free_score: number;
  aum_growth_score: number;
  client_growth_score: number;
  advisor_bandwidth_score: number;
  derivatives_score: number;
  upmarket_score: number;
  viability_score: number;
}

export type ScoreBadge = '🏆 Top 1%' | '⭐ Highly Recommended' | '✓ Good Value' | '⚠️ Review Carefully';

export function getScoreBadge(score: number): ScoreBadge {
  if (score >= 80) return '🏆 Top 1%';
  if (score >= 70) return '⭐ Highly Recommended';
  if (score >= 50) return '✓ Good Value';
  return '⚠️ Review Carefully';
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function getScoreGrade(score: number): string {
  if (score >= 70) return 'A';
  if (score >= 50) return 'C';
  return 'F';
}

export function getStarRating(score: number): { stars: number; display: string } {
  if (score >= 80) return { stars: 5, display: '⭐⭐⭐⭐⭐' };
  if (score >= 70) return { stars: 4.5, display: '⭐⭐⭐⭐½' };
  if (score >= 60) return { stars: 4, display: '⭐⭐⭐⭐' };
  if (score >= 50) return { stars: 3, display: '⭐⭐⭐' };
  if (score >= 40) return { stars: 2.5, display: '⭐⭐½' };
  if (score >= 30) return { stars: 2, display: '⭐⭐' };
  return { stars: 1, display: '⭐' };
}
