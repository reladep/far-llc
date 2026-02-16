import { Button, Badge } from '@/components/ui';

const popularTags = [
  'Financial Planning',
  'Retirement',
  'Tax Strategy',
  'Estate Planning',
  'Wealth Management',
  'ESG Investing',
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-50 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Find Your Perfect{' '}
            <span className="text-green-600">Wealth Advisor</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Compare fees, services, and specialties. Make informed financial decisions with confidence.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Search by name, location, or specialty..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <Button size="lg" className="whitespace-nowrap">
              Start Searching
            </Button>
          </div>

          {/* Popular Tags */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-slate-500">Popular:</span>
            {popularTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Search Thousands of Advisors
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Search & Compare',
                desc: 'Filter by fee structure, AUM, location, and specialties. View detailed profiles with transparent pricing.',
              },
              {
                title: 'Trust Verified Information',
                desc: 'Data sourced directly from SEC filings. Firm profiles include credentials, disclosures, and performance metrics.',
              },
              {
                title: 'Your Money, Your Choice',
                desc: 'Request info directly from firms. Read reviews from verified clients. Make decisions on your terms.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 p-6 text-center shadow-sm"
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

      {/* How It Works */}
      <section className="bg-slate-50 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { step: '1', title: 'Search', desc: 'Enter your criteria — location, fee type, specialty.' },
              { step: '2', title: 'Compare', desc: 'Review advisor profiles and compare side-by-side.' },
              { step: '3', title: 'Connect', desc: 'Request info or schedule a consultation directly.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Ready to Find Your Advisor?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            15,000+ advisors profiled · 500K+ annual searches · Free for consumers
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg">Browse Advisors</Button>
            <Button variant="outline" size="lg">
              View Pricing
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
