import type { Metadata } from 'next';
import { Button, Card, Badge } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Compare Advisors Side-by-Side',
  description: 'Select up to 4 firms to compare key metrics including fees, AUM, services, and credentials.',
};

const firms = ['Firm Alpha', 'Firm Beta', 'Firm Gamma'];

const comparisonRows = [
  { label: 'Location', values: ['New York, NY', 'San Francisco, CA', 'Chicago, IL'] },
  { label: 'AUM', values: ['$250M', '$500M', '$120M'] },
  { label: 'Fee Structure', values: ['Fee-Only', 'Fee-Based', 'Fee-Only'] },
  { label: 'Minimum Account', values: ['$250K', '$500K', '$100K'] },
  { label: 'Financial Planning', values: ['✓', '✓', '✓'] },
  { label: 'Tax Strategy', values: ['✓', '—', '✓'] },
  { label: 'Estate Planning', values: ['✓', '✓', '—'] },
  { label: 'Rating', values: ['4.8 ★', '4.5 ★', '4.9 ★'] },
  { label: 'Reviews', values: ['12', '28', '6'] },
];

/* Mobile comparison card for a single firm */
function FirmComparisonCard({ firmIndex }: { firmIndex: number }) {
  return (
    <Card padding="md" className="min-w-[260px] shrink-0 snap-start">
      <h3 className="font-semibold text-text-primary text-base mb-3">{firms[firmIndex]}</h3>
      <div className="space-y-2">
        {comparisonRows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-text-muted">{row.label}</span>
            <span className="text-text-primary font-medium">{row.values[firmIndex]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ComparePage() {
  return (
    <div className="container-page py-6 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold text-text-primary">Compare Advisors Side-by-Side</h1>
      <p className="mt-1 text-xs md:text-sm text-text-muted">
        Select up to 4 firms to compare key metrics.
      </p>

      {/* Add firms bar */}
      <div className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-3">
        {firms.map((firm) => (
          <div key={firm} className="flex h-9 md:h-10 items-center gap-2 rounded-lg border border-primary bg-primary-50 px-3 md:px-4 text-xs md:text-sm font-medium text-primary">
            {firm} <button className="ml-1 text-primary-400 hover:text-primary">×</button>
          </div>
        ))}
        <Button variant="outline" size="sm">
          + Add Firm
        </Button>
      </div>

      {/* Mobile: swipeable cards */}
      <div className="mt-6 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:hidden scrollbar-hide">
        {firms.map((_, i) => (
          <FirmComparisonCard key={i} firmIndex={i} />
        ))}
      </div>

      {/* Desktop: Comparison Table */}
      <Card padding="none" className="mt-8 overflow-x-auto hidden md:block">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 bg-bg-primary p-4 text-left text-xs font-medium text-text-muted w-40 z-10">
                Metric
              </th>
              {firms.map((firm) => (
                <th key={firm} className="p-4 text-left font-semibold text-text-primary">{firm}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, i) => (
              <tr
                key={row.label}
                className={`border-b border-border-subtle ${
                  i % 2 === 0 ? 'bg-bg-secondary' : ''
                }`}
              >
                <td className="sticky left-0 bg-inherit p-4 text-xs font-medium text-text-muted z-10">
                  {row.label}
                </td>
                {row.values.map((val, j) => (
                  <td key={j} className="p-4 text-text-primary">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-2 md:gap-3">
        <Button variant="outline" size="sm">
          Export PDF
        </Button>
        <Button variant="outline" size="sm">
          Export CSV
        </Button>
        <Button variant="ghost" size="sm">
          Share Comparison
        </Button>
      </div>
    </div>
  );
}
