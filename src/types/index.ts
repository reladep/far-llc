export interface Firm {
  crd: number;
  primary_business_name: string;
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
