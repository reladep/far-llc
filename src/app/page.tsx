'use client';

import { FormEvent, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Badge, Button } from '@/components/ui';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HomepageMetric {
  label: string;
  value: string;
  detail: string;
  trend?: string;
}

interface TrustClaim {
  title: string;
  description: string;
  icon: string;
}

interface JourneyStep {
  title: string;
  description: string;
}

interface PricingTier {
  name: string;
  price: string;
  note: string;
  features: string[];
  featured: boolean;
}

interface Suggestion {
  crd: number;
  primary_business_name: string;
  display_name?: string | null;
  main_office_city: string | null;
  main_office_state: string | null;
}

interface SearchExperienceCardProps {
  searchQuery: string;
  searching: boolean;
  suggestions: Suggestion[];
  showDropdown: boolean;
  selectedIndex: number;
  listboxId: string;
  onSearchSubmit: (e: FormEvent) => void;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSuggestionClick: (crd: number) => void;
  onQuickSearch: (query: string) => void;
}

const trustClaims: TrustClaim[] = [
  {
    title: 'SEC Source Data',
    description: 'Core profile and disclosure fields are derived from Form ADV filings.',
    icon: 'SEC',
  },
  {
    title: 'No Sponsored Rankings',
    description: 'Advisor ordering is based on dataset signals, not pay-to-rank placement.',
    icon: '0',
  },
  {
    title: 'Nationwide Coverage',
    description: 'Directory records span firms operating across all 50 states.',
    icon: '50',
  },
];

const metrics: HomepageMetric[] = [
  {
    value: '2,000+',
    label: 'Indexed Advisory Firms',
    detail: 'SEC-registered firms represented in directory coverage.',
    trend: '+ live dataset updates',
  },
  {
    value: '$500B+',
    label: 'Combined Assets',
    detail: 'Aggregate AUM represented across indexed firm profiles.',
    trend: 'institutional and UHNW exposure',
  },
  {
    value: '50',
    label: 'States Covered',
    detail: 'Cross-state search and compare for location-based diligence.',
    trend: 'national coverage',
  },
  {
    value: '92%',
    label: 'Disclosure Coverage',
    detail: 'Profiles with usable regulatory/disclosure context surfaced.',
    trend: 'methodology tracked',
  },
  {
    value: '15m',
    label: 'Alert Cadence',
    detail: 'EDGAR and activity polling interval for monitored changes.',
    trend: 'rolling updates',
  },
];

const journeySteps: JourneyStep[] = [
  {
    title: 'Diligence',
    description: 'Search firms by name, service model, geography, and fee context.',
  },
  {
    title: 'Negotiate',
    description: 'Use transparent fee and profile data before advisor conversations.',
  },
  {
    title: 'Analyze',
    description: 'Track filings, disclosure events, and activity shifts over time.',
  },
];

const pricingTiers: PricingTier[] = [
  {
    name: 'Data Access',
    price: '$20/mo',
    note: 'Billed annually ($240/year)',
    features: [
      'Full directory search and firm profile access',
      'Fee schedule context and comparison tools',
      'Saved firms and basic activity alerts',
      'Match questionnaire and ranked recommendations',
    ],
    featured: false,
  },
  {
    name: 'Personalized Intro',
    price: '$50/mo',
    note: 'Billed annually ($600/year)',
    features: [
      'Everything in Data Access',
      'Strategy onboarding call',
      'Curated shortlist of 3 advisor options',
      'Annual review check-in',
    ],
    featured: true,
  },
  {
    name: 'Full Advisory',
    price: 'Custom',
    note: 'Scope-based engagement',
    features: [
      'Everything in Personalized Intro',
      'Portfolio and advisor meeting support',
      'Allocation and structure guidance',
      'Ongoing diligence partnership',
    ],
    featured: false,
  },
];

const popularQueries = [
  'Fee-only advisor in Boston',
  'Estate planning specialists',
  'Tax strategy advisors NYC',
  'Retirement-focused firms',
  'Family office style advisors',
  'RIA with low minimums',
];

const quickFilters = [
  'State: NY',
  'State: CA',
  'Fee Model: Tiered',
  'Fee Model: Flat %',
  'Minimum Assets: $1M+',
  'Minimum Assets: $10M+',
];

const advisorPreviewRows = [
  {
    initials: 'AB',
    name: 'Arbor Bridge Capital',
    location: 'New York, NY',
    score: '84',
    feeSignal: 'Competitive Tiered Fees',
    specialties: ['Tax Strategy', 'Estate Planning', 'UHNW'],
  },
  {
    initials: 'NT',
    name: 'Northlake Trust Advisors',
    location: 'Boston, MA',
    score: '79',
    feeSignal: 'Moderate Fee Range',
    specialties: ['Retirement', 'Portfolio Construction', 'Fiduciary'],
  },
  {
    initials: 'SC',
    name: 'Summit Crest Wealth',
    location: 'San Francisco, CA',
    score: '87',
    feeSignal: 'Transparent Flat %',
    specialties: ['Business Owners', 'Liquidity Events', 'Alternatives'],
  },
];

const comparisonRows = [
  { metric: 'Fee Structure', firmA: 'Tiered', firmB: 'Flat %' },
  { metric: 'Estimated Fee @ $10M', firmA: '0.62%', firmB: '0.85%' },
  { metric: 'Client Focus', firmA: 'UHNW Families', firmB: 'HNW Individuals' },
  { metric: 'Disclosure Severity', firmA: 'Low', firmB: 'Low' },
  { metric: 'Visor Value Score', firmA: '84', firmB: '76' },
];

const activityRows = [
  {
    type: 'EDGAR Filing',
    title: 'Form ADV amendment posted for CRD 148472',
    recency: '14m ago',
  },
  {
    type: 'Fee Alert',
    title: 'Tier update detected in discretionary schedule',
    recency: '2h ago',
  },
  {
    type: 'News',
    title: 'Regional expansion announcement matched to profile',
    recency: '5h ago',
  },
];

function LogoTicker() {
  const [logos, setLogos] = useState<{ crd: number; logo_key: string }[]>([]);

  useEffect(() => {
    async function fetchLogos() {
      const { data } = await supabase
        .from('firm_logos')
        .select('crd, logo_key')
        .eq('has_logo', true)
        .limit(50);

      if (data && data.length > 0) {
        const shuffled = data.sort(() => Math.random() - 0.5);
        setLogos([...shuffled, ...shuffled]);
      }
    }

    fetchLogos();
  }, []);

  if (logos.length === 0) return null;

  return (
    <section className="overflow-hidden border-y border-slate-200 bg-slate-50 py-4" aria-label="Featured firms">
      <div className="relative">
        <div className="flex animate-scroll gap-8">
          {logos.map((logo, i) => (
            <a
              key={`${logo.crd}-${i}`}
              href={`/firm/${logo.crd}`}
              className="flex h-12 w-28 shrink-0 items-center justify-center grayscale opacity-70 transition-all hover:grayscale-0 hover:opacity-100"
              title="View firm profile"
            >
              <img
                src={`https://tgbatuqvvltemslwtpia.supabase.co/storage/v1/object/public/firm-logos/${logo.logo_key}`}
                alt="Firm logo"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </a>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

function TrustStrip() {
  return (
    <div className="mt-7 grid gap-3 sm:grid-cols-3" role="list" aria-label="Trust claims">
      {trustClaims.map((claim) => (
        <div
          key={claim.title}
          role="listitem"
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-green-300/35 bg-green-300/10 px-2 text-xs font-semibold text-green-100">
              {claim.icon}
            </span>
            <p className="text-sm font-medium text-white">{claim.title}</p>
          </div>
          <p className="mt-1.5 text-xs text-slate-300">{claim.description}</p>
        </div>
      ))}
    </div>
  );
}

function HeroPanel() {
  return (
    <div className="animate-rise">
      <Badge className="border border-green-300/30 bg-green-300/15 text-green-100">
        Institutional-grade advisor directory
      </Badge>
      <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
        Evaluate Financial Advisors with Data You Can Defend.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
        Compare firms with SEC-derived profile context, fee structure visibility,
        and disciplined screening tools built for serious diligence.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/search">
          <Button size="lg">Start Searching</Button>
        </Link>
        <Link href="/match">
          <Button
            size="lg"
            variant="outline"
            className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-900"
          >
            Get Matched
          </Button>
        </Link>
      </div>
      <TrustStrip />
    </div>
  );
}

function SearchExperienceCard({
  searchQuery,
  searching,
  suggestions,
  showDropdown,
  selectedIndex,
  listboxId,
  onSearchSubmit,
  onSearchChange,
  onSearchFocus,
  onSearchKeyDown,
  onSuggestionClick,
  onQuickSearch,
}: SearchExperienceCardProps) {
  return (
    <div className="animate-rise rounded-2xl border border-slate-700/80 bg-white/95 p-5 shadow-2xl backdrop-blur [animation-delay:120ms]">
      <p className="text-sm font-semibold text-slate-900">Intelligent Search</p>
      <p className="mt-1 text-xs text-slate-600">
        Find advisors by name, location, service specialty, or fee model.
      </p>

      <form onSubmit={onSearchSubmit} className="mt-4 flex flex-col gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
            onFocus={onSearchFocus}
            placeholder="Morgan Stanley, Boston, fee-only, estate planning..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-label="Search advisors"
            aria-activedescendant={selectedIndex >= 0 ? `${listboxId}-option-${selectedIndex}` : undefined}
          />
          {showDropdown && suggestions.length > 0 && (
            <div
              id={listboxId}
              role="listbox"
              className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
            >
              {suggestions.map((firm, idx) => (
                <button
                  id={`${listboxId}-option-${idx}`}
                  key={firm.crd}
                  type="button"
                  role="option"
                  aria-selected={idx === selectedIndex}
                  onClick={() => onSuggestionClick(firm.crd)}
                  className={`flex w-full items-center justify-between px-3.5 py-2 text-left hover:bg-slate-50 ${
                    idx === selectedIndex ? 'bg-green-50' : ''
                  }`}
                >
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      {firm.display_name || firm.primary_business_name}
                    </span>
                    {firm.main_office_city && firm.main_office_state && (
                      <span className="ml-1.5 text-xs text-slate-500">
                        {firm.main_office_city}, {firm.main_office_state}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">CRD {firm.crd}</span>
                </button>
              ))}
              <div className="border-t border-slate-100 bg-slate-50 px-3.5 py-1.5 text-[11px] text-slate-500">
                Use up/down arrows and Enter to select.
              </div>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={searching}>
          {searching ? 'Searching...' : 'Search Directory'}
        </Button>
      </form>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Popular Queries
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {popularQueries.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => onQuickSearch(query)}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-green-400 hover:bg-green-50 hover:text-green-700"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Quick Filters
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onQuickSearch(filter)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCardGrid({ data }: { data: HomepageMetric[] }) {
  return (
    <section className="bg-white py-14 md:py-16" aria-label="Credibility metrics">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {data.map((metric) => (
            <article key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{metric.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{metric.label}</p>
              <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
              {metric.trend && (
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-green-700">
                  {metric.trend}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ThreeStepFramework({ steps }: { steps: JourneyStep[] }) {
  return (
    <section className="bg-slate-50 py-16 md:py-20" aria-labelledby="framework-heading">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">How It Works</p>
          <h2 id="framework-heading" className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Diligence. Negotiate. Analyze.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-green-700">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdvisorCardPreviewRow() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {advisorPreviewRows.map((advisor) => (
        <article key={advisor.name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
              {advisor.initials}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900">{advisor.name}</h3>
              <p className="text-xs text-slate-500">{advisor.location}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-xs text-slate-600">Visor Score</span>
            <span className="text-sm font-semibold text-green-700">{advisor.score}</span>
          </div>

          <p className="mt-2 text-xs text-slate-600">{advisor.feeSignal}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {advisor.specialties.map((specialty) => (
              <span
                key={specialty}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
              >
                {specialty}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function ComparisonSnapshot() {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Comparison Snapshot</h3>
      <p className="mt-1 text-xs text-slate-500">Side-by-side signal view before deeper profile review.</p>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-2 pr-3 font-medium">Metric</th>
              <th className="py-2 px-3 font-medium">Firm A</th>
              <th className="py-2 pl-3 font-medium">Firm B</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.metric} className="border-b border-slate-100 last:border-b-0">
                <td className="py-2 pr-3 text-slate-700">{row.metric}</td>
                <td className="py-2 px-3 font-medium text-slate-900">{row.firmA}</td>
                <td className="py-2 pl-3 font-medium text-slate-900">{row.firmB}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function LatestActivityPanel() {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Latest Activity Signals</h3>
      <p className="mt-1 text-xs text-slate-500">Recent filings, fee, and news-driven events.</p>

      <ul className="mt-3 space-y-2">
        {activityRows.map((row) => (
          <li key={row.title} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-green-700">{row.type}</span>
              <span className="text-[11px] text-slate-500">{row.recency}</span>
            </div>
            <p className="mt-1 text-xs text-slate-700">{row.title}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}

function DirectoryDepthPreview() {
  return (
    <section className="bg-white py-16 md:py-20" aria-labelledby="depth-preview-heading">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">Directory Depth</p>
          <h2 id="depth-preview-heading" className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Structured views designed for serious screening.
          </h2>
        </div>

        <div className="mt-10 space-y-5">
          <AdvisorCardPreviewRow />

          <div className="grid gap-4 lg:grid-cols-2">
            <ComparisonSnapshot />
            <LatestActivityPanel />
          </div>
        </div>
      </div>
    </section>
  );
}

function MethodologyExplainer() {
  return (
    <section className="bg-slate-50 py-16 md:py-20" aria-labelledby="methodology-heading">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">Methodology and Trust</p>
            <h2 id="methodology-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Transparent sourcing with repeatable scoring logic.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Directory records are grounded in SEC Form ADV disclosures and structured
              profile fields. Alert pipelines monitor filing and news changes on a rolling
              cadence, while scoring blends fee competitiveness, disclosure context,
              growth signals, and advisor bandwidth indicators.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">What this means for users</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">-</span>
                You can audit where the data originates.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">-</span>
                You can compare firms with consistent lenses.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">-</span>
                You can spot meaningful changes earlier.
              </li>
            </ul>
            <Link href="/how-it-works" className="mt-4 inline-block">
              <Button variant="outline" className="w-full">
                Review Methodology
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCardGrid({ tiers }: { tiers: PricingTier[] }) {
  return (
    <section className="bg-white py-16 md:py-20" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="pricing-heading" className="text-center text-3xl font-bold text-slate-900">
          Access Tiers
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600">
          Choose the level of support that fits your diligence workflow.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`flex flex-col rounded-xl border bg-white p-6 shadow-sm ${
                tier.featured ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-200'
              }`}
            >
              {tier.featured && (
                <span className="mb-3 inline-block self-start rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
                  Recommended
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tier.name}</p>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{tier.price}</div>
              <p className="mt-1 text-xs text-slate-500">{tier.note}</p>

              <ul className="mt-4 flex-1 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 text-green-600">-</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={tier.name === 'Full Advisory' ? '/contact' : '/auth/signup'} className="mt-6">
                <Button variant={tier.featured ? 'primary' : 'outline'} className="w-full">
                  {tier.name === 'Full Advisory' ? 'Contact Team' : 'Get Started'}
                </Button>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-slate-950 py-16 md:py-20" aria-labelledby="final-cta-heading">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-300">Ready to Proceed</p>
        <h2 id="final-cta-heading" className="mt-2 text-2xl font-bold text-white md:text-3xl">
          Start with structured search. Finish with better advisor decisions.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-200">
          Use defensible data, clear comparison views, and trustable profile context before
          selecting or negotiating with an advisory firm.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/search">
            <Button size="lg">Start Searching</Button>
          </Link>
          <Link href="/match">
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-900"
            >
              Answer Match Questions
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const listboxId = useId();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('firmdata_current')
        .select('crd, primary_business_name, main_office_city, main_office_state')
        .ilike('primary_business_name', `%${searchQuery.trim()}%`)
        .limit(8);

      if (data && data.length > 0) {
        const crds = data.map((item) => item.crd);
        const { data: names } = await supabase
          .from('firm_names')
          .select('crd, display_name')
          .in('crd', crds);

        const nameMap = new Map((names || []).map((item) => [item.crd, item.display_name]));
        setSuggestions(data.map((item) => ({ ...item, display_name: nameMap.get(item.crd) || null })));
      } else {
        setSuggestions([]);
      }

      setShowDropdown(true);
      setSelectedIndex(-1);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;

    setSearching(true);
    const query = searchQuery.trim();

    const { data: exactMatch } = await supabase
      .from('firmdata_current')
      .select('crd, primary_business_name')
      .ilike('primary_business_name', query)
      .limit(1)
      .single();

    if (exactMatch) {
      router.push(`/firm/${exactMatch.crd}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }

    setSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch(e as unknown as FormEvent);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        router.push(`/firm/${suggestions[selectedIndex].crd}`);
      } else {
        handleSearch(e as unknown as FormEvent);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const runQuickSearch = (query: string) => {
    setSearchQuery(query);
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const selectSuggestion = (crd: number) => {
    router.push(`/firm/${crd}`);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 pb-12 pt-12 md:pb-16 md:pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-green-400/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <HeroPanel />

            <SearchExperienceCard
              searchQuery={searchQuery}
              searching={searching}
              suggestions={suggestions}
              showDropdown={showDropdown}
              selectedIndex={selectedIndex}
              listboxId={listboxId}
              onSearchSubmit={handleSearch}
              onSearchChange={setSearchQuery}
              onSearchFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              onSearchKeyDown={handleKeyDown}
              onSuggestionClick={selectSuggestion}
              onQuickSearch={runQuickSearch}
            />
          </div>
        </div>
      </section>

      <LogoTicker />
      <MetricCardGrid data={metrics} />
      <ThreeStepFramework steps={journeySteps} />
      <DirectoryDepthPreview />
      <MethodologyExplainer />
      <PricingCardGrid tiers={pricingTiers} />
      <FinalCTA />

      <style jsx>{`
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-rise {
          animation: rise 0.7s ease-out both;
        }
      `}</style>
    </>
  );
}
