'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
  { value: '2,000+', label: 'SEC-Registered Advisors' },
  { value: '$500B+', label: 'Combined AUM' },
  { value: '50', label: 'States Covered' },
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
    <section className="overflow-hidden border-b border-slate-200 bg-slate-50 py-4">
      <div className="relative">
        <div className="flex animate-scroll gap-8">
          {logos.map((logo, i) => (
            <a
              key={`${logo.crd}-${i}`}
              href={`/firm/${logo.crd}`}
              className="flex h-12 w-28 shrink-0 items-center justify-center grayscale opacity-70 transition-all hover:grayscale-0 hover:opacity-100"
              title={`View firm profile`}
            >
              <img
                src={`https://tgbatuqvvltemslwtpia.supabase.co/storage/v1/object/public/firm-logos/${logo.logo_key}`}
                alt={`Firm logo`}
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

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

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

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white pb-16 md:pb-24 lg:pb-32 pt-8 md:pt-12 lg:pt-16">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="mx-auto max-w-5xl px-4 relative">
          {/* Tagline */}
          <p className="text-center text-sm font-medium text-green-600 tracking-wider uppercase mb-4">
            Bringing the Footnotes to the Frontpage
          </p>

          {/* Stats */}
          <div className="mb-8 flex flex-wrap justify-center gap-6 md:gap-10">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs md:text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            See Exactly What You&apos;re{' '}
            <span className="text-green-600">Paying</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-slate-600">
            Compare fee structures, services, and specialties across thousands of SEC-registered advisors. 
            No sponsored placements. Just data.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Try: 'fee-only advisor in Boston' or 'Morgan Stanley'..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <Button type="submit" size="lg" className="whitespace-nowrap" disabled={searching}>
              {searching ? 'Searching...' : 'Search Advisors'}
            </Button>
          </form>

          {/* Trust Signal */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Data sourced directly from SEC Form ADV • Updated quarterly • No sponsored placements
          </p>

          {/* Popular Tags */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-slate-500">Popular:</span>
            {popularTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs cursor-pointer hover:border-green-500 hover:text-green-600">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Logo Ticker */}
      <LogoTicker />

      {/* DNA Framework - How It Works */}
      <section className="bg-slate-50 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Your Advisor Journey
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
            From research to relationship — we help you every step of the way.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Diligence',
                desc: 'Search and compare advisors by fee structure, AUM, location, and specialty. Our database is built on SEC filings — verified, not self-reported.',
                icon: '🔍',
              },
              {
                title: 'Negotiate',
                desc: 'Fees are negotiable. We give you the data and context to negotiate confidently with any advisor.',
                icon: '💬',
              },
              {
                title: 'Analyze',
                desc: 'Track your advisor over time. Monitor fees, services, and performance. Make informed decisions at every stage.',
                icon: '📊',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="bg-white py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Why FAR?
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Transparent Pricing',
                desc: 'See exactly what advisors charge. No hidden fees, no surprises. Compare fee schedules side-by-side.',
              },
              {
                title: 'Verified SEC Data',
                desc: 'Every data point comes directly from Form ADV. What you see is what the advisors reported.',
              },
              {
                title: 'Negotiation Support',
                desc: 'Arm yourself with data before negotiating. Know the market rate before you sign.',
              },
              {
                title: 'No Sponsored Placements',
                desc: 'We don\'t accept payment for better rankings. What you see is based purely on the data.',
              },
              {
                title: 'Your Money, Your Choice',
                desc: 'Request info directly from firms. Read profiles. Make decisions on your terms.',
              },
              {
                title: 'Track Over Time',
                desc: 'Coming soon: monitor your advisor\'s fee evolution and performance over time.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
            From self-serve research to hands-on advisory — pick what fits.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Data Access',
                price: '$20/mo',
                note: 'Paid annually ($240/yr)',
                features: ['Full platform access', 'Search & compare advisors', 'SEC-verified fee data', 'Advisor alerts & tracking', 'Fee negotiation tools'],
                cta: 'Get Started',
                featured: false,
              },
              {
                name: 'Personalized Intro',
                price: '$50/mo',
                note: 'Paid annually ($600/yr)',
                features: ['Everything in Data Access', '1-on-1 intro call', 'Curated list of 3 firm recommendations', 'Annual check-in call'],
                cta: 'Get Started',
                featured: true,
              },
              {
                name: 'Full Advisory',
                price: 'Custom',
                note: 'Scope-based pricing',
                features: ['Everything in Advisory Intro', 'Portfolio reviews', 'Asset allocation guidance', 'Join meetings with advisors'],
                cta: 'Contact Us',
                featured: false,
              },
            ].map((plan) => (
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
                      <span className="text-green-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.featured ? 'primary' : 'outline'}
                  className="mt-6 w-full"
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Ready to find your advisor?
          </h2>
          <p className="mt-3 text-green-100">
            Browse thousands of SEC-registered advisors. Compare fees. Make an informed decision.
          </p>
          <Button variant="secondary" size="lg" className="mt-8">
            Start Searching
          </Button>
        </div>
      </section>
    </>
  );
}
