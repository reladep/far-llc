'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const popularTags = [
  'Financial Planning',
  'Retirement',
  'Tax Strategy',
  'Estate Planning',
  'Wealth Management',
  'ESG Investing',
];

const stats = [
  { value: '2,000+', label: 'SEC-Registered Advisors', detail: 'Live in database' },
  { value: '$500B+', label: 'Combined AUM', detail: 'Across indexed firms' },
  { value: '50', label: 'States Covered', detail: 'National coverage' },
  { value: '0', label: 'Sponsored Rankings', detail: 'Data-driven ordering' },
];

const trustPillars = [
  {
    title: 'SEC-Verified Source Data',
    desc: 'Data is grounded in Form ADV disclosures, not marketing copy.',
  },
  {
    title: 'Fee Transparency',
    desc: 'See fee structures and compare advisor pricing context quickly.',
  },
  {
    title: 'Built for Negotiation',
    desc: 'Use benchmark context before speaking with any advisor.',
  },
];

const journeySteps = [
  {
    title: 'Diligence',
    label: 'Step 1',
    desc: 'Search by firm name, location, service model, and fee signals.',
  },
  {
    title: 'Negotiate',
    label: 'Step 2',
    desc: 'Use fee context and profile data to ask better questions.',
  },
  {
    title: 'Analyze',
    label: 'Step 3',
    desc: 'Track changes over time with filings, alerts, and score updates.',
  },
];

const compareFeatures = [
  'Fee structures and estimated cost profile',
  'AUM and firm size context',
  'Service model and specialization',
  'Regulatory disclosures and record flags',
  'Activity and news alerts',
  'Proprietary Visor Value Score',
];

const plans = [
  {
    name: 'Data Access',
    price: '$20/mo',
    note: 'Billed annually ($240/yr)',
    featured: false,
    features: [
      'Full platform access',
      'Search and compare advisors',
      'SEC-verified fee data',
      'Advisor alerts and tracking',
      'Negotiation context',
    ],
  },
  {
    name: 'Personalized Intro',
    price: '$50/mo',
    note: 'Billed annually ($600/yr)',
    featured: true,
    features: [
      'Everything in Data Access',
      'One intro strategy call',
      'Curated short list of 3 firms',
      'Annual check-in call',
    ],
  },
  {
    name: 'Full Advisory',
    price: 'Custom',
    note: 'Scope-based',
    featured: false,
    features: [
      'Everything in Personalized Intro',
      'Portfolio reviews',
      'Asset allocation guidance',
      'Advisor meeting support',
    ],
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
    <section className="overflow-hidden border-y border-slate-200 bg-slate-50 py-4">
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

interface Suggestion {
  crd: number;
  primary_business_name: string;
  display_name?: string | null;
  main_office_city: string | null;
  main_office_state: string | null;
}


export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Fetch suggestions as user types
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
        const crds = data.map(d => d.crd);
        const { data: names } = await supabase.from('firm_names').select('crd, display_name').in('crd', crds);
        const nameMap = new Map((names || []).map(n => [n.crd, n.display_name]));
        setSuggestions(data.map(d => ({ ...d, display_name: nameMap.get(d.crd) || null })));
      } else {
        setSuggestions([]);
      }
      setShowDropdown(true);
      setSelectedIndex(-1);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        // Select firm from dropdown
        router.push(`/firm/${suggestions[selectedIndex].crd}`);
      } else {
        handleSearch(e as unknown as FormEvent);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;
    
    setSearching(true);
    const query = searchQuery.trim();
    
    // Check for exact match first
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
            <div className="animate-rise">
              <Badge className="border border-green-300/30 bg-green-300/15 text-green-100">
                Bringing the Footnotes to the Frontpage
              </Badge>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Pick Your Financial Advisor With Evidence, Not Marketing.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">
                Search SEC-registered firms, compare fee structures, and pressure-test
                advisor quality before signing anything.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/search">
                  <Button size="lg">Start Searching</Button>
                </Link>
                <Link href="/match">
                  <Button size="lg" variant="outline" className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-900">
                    Get Matched
                  </Button>
                </Link>
              </div>
            </div>

            <div className="animate-rise rounded-2xl border border-slate-700/80 bg-white/95 p-5 shadow-2xl backdrop-blur [animation-delay:120ms]">
              <p className="text-sm font-semibold text-slate-900">Search Advisors</p>
              <p className="mt-1 text-xs text-slate-600">
                Try a firm name, strategy, or city.
              </p>

              <form onSubmit={handleSearch} className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                    placeholder="Morgan Stanley, Boston, fee-only..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    autoComplete="off"
                  />
                  {showDropdown && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                      {suggestions.map((firm, idx) => (
                        <button
                          key={firm.crd}
                          type="button"
                          onClick={() => selectSuggestion(firm.crd)}
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
                        Use ↑↓ and Enter to navigate.
                      </div>
                    </div>
                  )}
                </div>
                <Button type="submit" className="whitespace-nowrap" disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </form>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => runQuickSearch(tag)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-green-400 hover:bg-green-50 hover:text-green-700"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <LogoTicker />

      <section className="bg-white py-14 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{stat.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
              Why People Use Visor Index
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              The platform is built to reduce information asymmetry.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {trustPillars.map((pillar, idx) => (
              <div
                key={pillar.title}
                className="animate-rise rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                style={{ animationDelay: `${idx * 90 + 60}ms` }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-green-700">
                  Pillar {idx + 1}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{pillar.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
                Workflow
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Diligence, Negotiate, Analyze.
              </h2>
              <p className="mt-3 text-slate-600">
                A clear workflow to move from discovery to confident decision.
              </p>
              <div className="mt-6 space-y-3">
                {journeySteps.map((step) => (
                  <div key={step.title} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-700">{step.label}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold text-slate-900">What You Can Compare Today</h3>
              <ul className="mt-4 space-y-2.5">
                {compareFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-0.5 text-green-600">●</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href="/compare">
                  <Button variant="outline" className="w-full">
                    Compare Firms Side by Side
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
            Pick the level of help you want right now.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border bg-white p-6 shadow-sm flex flex-col ${
                  plan.featured ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-200'
                }`}
              >
                {plan.featured && (
                  <span className="mb-3 inline-block self-start rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{plan.note}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-green-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === 'Full Advisory' ? '/contact' : '/auth/signup'} className="mt-6">
                  <Button
                    variant={plan.featured ? 'primary' : 'outline'}
                    className="w-full"
                  >
                    {plan.name === 'Full Advisory' ? 'Contact Us' : 'Get Started'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-300">
            Ready When You Are
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Start with search. End with a better advisor decision.
          </h2>
          <p className="mt-3 text-slate-200">
            Browse profiles, compare fees, and build negotiation leverage before your first meeting.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/search">
              <Button size="lg">Start Searching</Button>
            </Link>
            <Link href="/match">
              <Button size="lg" variant="outline" className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-900">
                Answer Match Questions
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
