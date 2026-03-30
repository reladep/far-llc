export interface HomepageMetric {
  label: string;
  value: string;
  detail: string;
}

export interface HeroBreakdownMetric {
  label: string;
  value: number;
  tone: 'good' | 'warn';
}

export interface ProofMetric {
  countTo?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  value: string;
  label: string;
  detail: string;
}

export interface HowStep {
  title: string;
  description: string;
}

export interface MethodologyPillar {
  label: string;
  weight: string;
  tone: string;
}

export interface ComparisonPoint {
  label: string;
  free: string;
  paid: string;
}

export interface PricingTier {
  name: string;
  price: string;
  note: string;
  description: string;
  features: string[];
  ctaLabel: string;
  href: string;
  featured?: boolean;
}

export interface PersonaMetric {
  label: string;
  value: number;
  tone: 'good' | 'warn' | 'risk';
}

export interface PersonaScenario {
  persona: string;
  situation: string;
  tag: string;
  blurb: string;
  searchLabel: string;
  searchQuery: string;
  searchResultLabel: string;
  firmName: string;
  firmMeta: string;
  score: number;
  scoreTone: 'good' | 'warn' | 'risk';
  metrics: PersonaMetric[];
  findingLabel: string;
  finding: string;
}

export const heroBreakdown: HeroBreakdownMetric[] = [
  { label: 'Regulatory Compliance', value: 96, tone: 'good' },
  { label: 'Fee Transparency', value: 91, tone: 'good' },
  { label: 'Conflict Exposure', value: 67, tone: 'warn' },
  { label: 'AUM Growth', value: 88, tone: 'good' },
 ];

export const proofMetrics: ProofMetric[] = [
  { value: '40K+', countTo: 40000, suffix: '+', label: 'Advisors indexed', detail: 'Every US-registered RIA. Every SEC EDGAR filing.' },
  { value: '500+', countTo: 500, suffix: '+', label: 'Data points per firm', detail: 'Per filing, per year. Structured for diligence, not marketing.' },
  { value: 'Quarterly', label: 'SEC EDGAR sync', detail: 'Always current. Updated every quarter from regulatory filings.' },
  { value: 'Zero', label: 'Paid placements', detail: 'Rankings never for sale. No advisor has paid to appear here.' },
];

export const homepageMetrics: HomepageMetric[] = [
  { value: 'SEC-derived', label: 'Primary source data', detail: 'Core profile fields are grounded in Form ADV filings.' },
  { value: '50 states', label: 'Nationwide coverage', detail: 'Search, compare, and diligence firms across the US.' },
  { value: 'Fee-aware', label: 'Negotiation leverage', detail: 'Profiles connect research to fee benchmarking and discussion prep.' },
];

export const howSteps: HowStep[] = [
  {
    title: 'Search any advisor or firm',
    description: 'Find firms by name, city, AUM, minimums, fee structure, and other SEC-disclosed attributes.',
  },
  {
    title: 'Review the Visor Index Score',
    description: 'Use one composite score plus factor grades across fees, conflicts, compliance, and growth signals.',
  },
  {
    title: 'Compare and shortlist',
    description: 'Move from broad search into side-by-side diligence with consistent lenses and saved candidates.',
  },
  {
    title: 'Track material changes',
    description: 'Alerts surface filing changes, disclosure updates, and other events that affect diligence.',
  },
  {
    title: 'Negotiate from data',
    description: 'Benchmark fees and structure conversations with objective context before advisor meetings.',
  },
  {
    title: 'Personalize the selection',
    description: 'Run the match flow when you want a more curated shortlist tied to your needs and constraints.',
  },
];

export const methodologyPillars: MethodologyPillar[] = [
  { label: 'Conflict of Interest Exposure', weight: '22%', tone: 'bg-emerald-700' },
  { label: 'Regulatory Compliance', weight: '20%', tone: 'bg-emerald-600' },
  { label: 'Fee Transparency', weight: '18%', tone: 'bg-emerald-500' },
  { label: 'AUM Growth Trajectory', weight: '15%', tone: 'bg-slate-500' },
  { label: 'Ownership Stability', weight: '13%', tone: 'bg-slate-400' },
  { label: 'Client Retention Proxy', weight: '12%', tone: 'bg-slate-300' },
];

export const comparisonPoints: ComparisonPoint[] = [
  { label: 'Firm discovery', free: 'Search and basic profile access', paid: 'Full firm profile and unlimited comparison workflow' },
  { label: 'Score visibility', free: 'High-level preview only', paid: 'Full Visor Index Score plus sub-metric detail' },
  { label: 'Monitoring', free: 'Limited recency context', paid: 'Alerts and ongoing filing-change visibility' },
  { label: 'Selection support', free: 'Self-serve research', paid: 'Matching, shortlist support, and deeper diligence tools' },
];

export const pricingTiers: PricingTier[] = [
  {
    name: '30-Day Access',
    price: '$99',
    note: '/ 30 days',
    description: 'Full platform access for investors in early-stage research without recurring billing.',
    features: [
      'Full Visor Index Score for every firm',
      'All available sub-metric scores',
      'Historical AUM trend context',
      'Conflict flags and disclosure visibility',
      'Advisor comparison workflow',
      'Unlimited firm searches during access window',
    ],
    ctaLabel: 'Get 30-Day Access',
    href: '/auth/signup',
  },
  {
    name: 'Annual Access',
    price: '$199',
    note: '/ year',
    description: 'For investors who want ongoing monitoring and the full research layer year-round.',
    features: [
      'Everything in 30-Day Access',
      '12 months of full access',
      'Filing and activity alerts',
      'Personalized advisor matching',
      'Export-ready comparison context',
      'Priority support',
    ],
    ctaLabel: 'Get Annual Access',
    href: '/auth/signup',
    featured: true,
  },
  {
    name: 'Concierge',
    price: 'Custom',
    note: 'tailored engagement',
    description: 'For investors who want expert due diligence, advisor vetting, and ongoing guidance.',
    features: [
      'Everything in Annual Access',
      'Custom due diligence & background checks',
      'Advisor search & introductions',
      'Fee negotiation benchmarking',
      'Ongoing monitoring & analysis',
      'Dedicated research team support',
    ],
    ctaLabel: 'Request a Consultation',
    href: '/deep-dive',
  },
];

export const personas: PersonaScenario[] = [
  {
    persona: 'High Net Worth',
    situation: 'Searching for a multi-family office',
    tag: 'High Net Worth · $5M+',
    blurb: 'You need more than a financial advisor. You need a firm that manages complexity across generations.',
    searchLabel: 'Search',
    searchQuery: 'Multi-family offices · $500M+ AUM · fee-only · New York',
    searchResultLabel: '147 results',
    firmName: 'Rockbridge Family Partners',
    firmMeta: 'MFO · New York, NY · $2.1B AUM · Est. 1998',
    score: 91,
    scoreTone: 'good',
    metrics: [
      { label: 'Ownership Stability', value: 97, tone: 'good' },
      { label: 'Fee Transparency', value: 94, tone: 'good' },
      { label: 'Conflict Exposure', value: 88, tone: 'good' },
      { label: 'Regulatory Compliance', value: 96, tone: 'good' },
    ],
    findingLabel: 'Key Finding',
    finding: 'Ownership unchanged for 26 years with no third-party referral arrangements disclosed and a flat-retainer structure.',
  },
  {
    persona: 'Recently Married',
    situation: 'Finding your first financial planner together',
    tag: 'Recently Married · Household $250K-$1M',
    blurb: 'New couples are a high-value target for advisors who generate revenue from product placement.',
    searchLabel: 'Search',
    searchQuery: 'Fee-only financial planners · CFP · under $500K minimum · Austin',
    searchResultLabel: '83 results',
    firmName: 'Clearwater Planning Group',
    firmMeta: 'RIA · Austin, TX · 312 clients · CFP certified',
    score: 58,
    scoreTone: 'warn',
    metrics: [
      { label: 'Regulatory Compliance', value: 91, tone: 'good' },
      { label: 'Conflict Exposure', value: 24, tone: 'risk' },
      { label: 'Fee Transparency', value: 77, tone: 'good' },
      { label: 'AUM Growth', value: 61, tone: 'warn' },
    ],
    findingLabel: 'Conflict Flag',
    finding: 'Insurance-product commissions are disclosed in ADV materials but may not be obvious in first meetings.',
  },
  {
    persona: 'Endowment / Foundation',
    situation: 'Selecting an OCIO with board-level accountability',
    tag: 'Endowment / Foundation · $10M–$500M',
    blurb: 'Your board needs a defensible OCIO selection process — not a gut feeling and a handshake.',
    searchLabel: 'Search',
    searchQuery: 'OCIO providers · institutional clients · $50M+ AUM minimum',
    searchResultLabel: '62 results',
    firmName: 'Verity Institutional Advisors',
    firmMeta: 'RIA · Boston, MA · $18.4B AUM · Institutional focus',
    score: 87,
    scoreTone: 'good',
    metrics: [
      { label: 'Regulatory Compliance', value: 99, tone: 'good' },
      { label: 'Ownership Stability', value: 93, tone: 'good' },
      { label: 'Conflict Exposure', value: 71, tone: 'warn' },
      { label: 'AUM Growth', value: 84, tone: 'good' },
    ],
    findingLabel: 'Key Finding',
    finding: 'Zero disciplinary actions in 14 years. AUM grown from $4.1B to $18.4B — entirely organic, no acquisition-driven spikes. Passes institutional-grade conflict screening.',
  },
  {
    persona: 'New Investor',
    situation: 'Hiring your first advisor without the experience to evaluate one',
    tag: 'New Investor · $50K–$250K',
    blurb: 'You\'re ready to get serious — but you don\'t know what you don\'t know about who you\'re hiring.',
    searchLabel: 'Search',
    searchQuery: 'Fee-only RIAs · no minimum · fiduciary · Denver',
    searchResultLabel: '211 results',
    firmName: 'Meridian First Wealth',
    firmMeta: 'RIA · Denver, CO · 890 clients · No minimum',
    score: 82,
    scoreTone: 'good',
    metrics: [
      { label: 'Fee Transparency', value: 95, tone: 'good' },
      { label: 'Conflict Exposure', value: 89, tone: 'good' },
      { label: 'Regulatory Compliance', value: 93, tone: 'good' },
      { label: 'Client Retention', value: 68, tone: 'warn' },
    ],
    findingLabel: 'Key Finding',
    finding: 'Flat subscription fee — $150/month, no AUM percentage. No commission arrangements of any kind. Conflict score of 89 puts them in the top 6% for independence.',
  },
  {
    persona: 'Sudden Wealth',
    situation: 'Navigating a windfall when everyone wants to help',
    tag: 'Sudden Wealth · Inheritance or Liquidity Event',
    blurb: 'You\'ve come into significant money quickly. Everyone wants to help — and that\'s exactly when you need to be most careful.',
    searchLabel: 'Search',
    searchQuery: 'Wealth management · inheritance specialists · fiduciary · Chicago',
    searchResultLabel: '94 results',
    firmName: 'Harborview Wealth Partners',
    firmMeta: 'RIA · Chicago, IL · $3.8B AUM · 214 clients',
    score: 41,
    scoreTone: 'risk',
    metrics: [
      { label: 'Regulatory Compliance', value: 86, tone: 'good' },
      { label: 'Conflict Exposure', value: 18, tone: 'risk' },
      { label: 'Fee Transparency', value: 52, tone: 'warn' },
      { label: 'Ownership Stability', value: 29, tone: 'risk' },
    ],
    findingLabel: '⚑ Multiple Flags',
    finding: 'Firm sold to private equity 18 months ago. Three referral compensation arrangements active. Conflict score of 18 places them in the bottom 4% nationally.',
  },
  {
    persona: 'Already Have an Advisor',
    situation: 'Benchmarking an existing relationship',
    tag: 'Current Client · Any Portfolio Size',
    blurb: 'You have an advisor. Things seem fine. But you\'ve never actually checked the record.',
    searchLabel: 'Looking up',
    searchQuery: 'Waverly Capital Advisors · Boston, MA',
    searchResultLabel: 'Profile found',
    firmName: 'Waverly Capital Advisors',
    firmMeta: 'RIA · Boston, MA · $890M AUM · 203 clients',
    score: 63,
    scoreTone: 'warn',
    metrics: [
      { label: 'Regulatory Compliance', value: 88, tone: 'good' },
      { label: 'Fee Transparency', value: 61, tone: 'warn' },
      { label: 'Conflict Exposure', value: 34, tone: 'risk' },
      { label: 'Ownership Stability', value: 58, tone: 'warn' },
    ],
    findingLabel: 'Below National Median',
    finding: 'Conflict score trails peer medians, which makes this a useful benchmark case for current-client diligence.',
  },
];
