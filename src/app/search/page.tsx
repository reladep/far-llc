'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, Badge, Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

// Sample firm data - will come from Supabase
const sampleFirms = [
  {
    crd: 123456,
    name: 'Meridian Wealth Management',
    city: 'New York',
    state: 'NY',
    aum: 500000000,
    fee_type: 'Fee-Only',
    tags: ['Financial Planning', 'Estate Planning', 'Tax Strategy'],
    rating: 4.8,
    review_count: 45,
  },
  {
    crd: 234567,
    name: 'Harborview Financial Advisors',
    city: 'Chicago',
    state: 'IL',
    aum: 250000000,
    fee_type: 'Fee-Based',
    tags: ['Retirement', 'Business Owners', 'Tax Strategy'],
    rating: 4.6,
    review_count: 32,
  },
  {
    crd: 345678,
    name: 'Summit Capital Partners',
    city: 'Denver',
    state: 'CO',
    aum: 1200000000,
    fee_type: 'Fee-Only',
    tags: ['Portfolio Management', 'FIRE', 'ESG Investing'],
    rating: 4.9,
    review_count: 67,
  },
  {
    crd: 456789,
    name: 'Pinnacle Advisory Group',
    city: 'Boston',
    state: 'MA',
    aum: 800000000,
    fee_type: 'Fee-Only',
    tags: ['High Net Worth', 'Estate Planning', 'Private Wealth'],
    rating: 4.7,
    review_count: 28,
  },
  {
    crd: 567890,
    name: 'Coastal Wealth Partners',
    city: 'Miami',
    state: 'FL',
    aum: 180000000,
    fee_type: 'Fee-Based',
    tags: ['Retirement', 'Tax Planning', 'Insurance'],
    rating: 4.5,
    review_count: 19,
  },
  {
    crd: 678901,
    name: 'Ironwood Financial Services',
    city: 'Austin',
    state: 'TX',
    aum: 420000000,
    fee_type: 'Fee-Only',
    tags: ['Entrepreneurs', 'Business Exit Planning', 'Equity Compensation'],
    rating: 4.8,
    review_count: 41,
  },
];

function formatAUM(value: number): string {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

function FilterSidebar({ 
  open, 
  onClose,
  filters,
  setFilters 
}: { 
  open: boolean; 
  onClose: () => void;
  filters: Record<string, unknown>;
  setFilters: (f: Record<string, unknown>) => void;
}) {
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [minAUM, setMinAUM] = useState('');

  const feeTypes = ['Fee-Only', 'Fee-Based', 'Commission'];
  const specialties = ['Financial Planning', 'Retirement', 'Tax Strategy', 'Estate Planning', 'High Net Worth', 'Business Owners'];

  const applyFilters = () => {
    setFilters({
      fees: selectedFees,
      specialties: selectedSpecialties,
      location,
      minAUM,
    });
    onClose();
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300 lg:relative lg:z-auto lg:h-auto lg:w-64 lg:shadow-none lg:translate-x-0 lg:shrink-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4 lg:hidden">
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded text-slate-500 hover:text-slate-700" aria-label="Close filters">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 hidden lg:block">Filters</h3>

          {/* Search */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Search</label>
            <input
              type="text"
              placeholder="Firm name..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            />
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Location</label>
            <input
              type="text"
              placeholder="City or state..."
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            />
          </div>

          {/* Fee Structure */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Fee Structure</label>
            <div className="flex flex-col gap-2">
              {feeTypes.map((fee) => (
                <label key={fee} className="flex items-center gap-2 text-sm text-slate-700">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300"
                    checked={selectedFees.includes(fee)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFees([...selectedFees, fee]);
                      } else {
                        setSelectedFees(selectedFees.filter(f => f !== fee));
                      }
                    }}
                  />
                  {fee}
                </label>
              ))}
            </div>
          </div>

          {/* Minimum AUM */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Minimum AUM</label>
            <select 
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={minAUM}
              onChange={(e) => setMinAUM(e.target.value)}
            >
              <option value="">Any</option>
              <option value="1000000">$1M+</option>
              <option value="10000000">$10M+</option>
              <option value="100000000">$100M+</option>
              <option value="1000000000">$1B+</option>
            </select>
          </div>

          {/* Specialties */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Specialty</label>
            <div className="flex flex-col gap-2">
              {specialties.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm text-slate-700">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300"
                    checked={selectedSpecialties.includes(s)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSpecialties([...selectedSpecialties, s]);
                      } else {
                        setSelectedSpecialties(selectedSpecialties.filter(x => x !== s));
                      }
                    }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <Button variant="primary" size="sm" className="w-full" onClick={applyFilters}>
            Apply Filters
          </Button>
        </div>
      </aside>
    </>
  );
}

function FirmCard({ firm }: { firm: typeof sampleFirms[0] }) {
  return (
    <Link href={`/firm/${firm.crd}`}>
      <Card variant="default" padding="md" className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs md:text-sm">
            {firm.name.split(' ').map(w => w[0]).join('').slice(0,2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate text-sm md:text-base">
              {firm.name}
            </h3>
            <p className="text-xs md:text-sm text-slate-500">{firm.city}, {firm.state}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="primary">{firm.fee_type}</Badge>
              {firm.tags.slice(0, 2).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <CardContent className="mt-3">
              <div className="flex items-center gap-2 md:gap-4 text-xs text-slate-500">
                <span>AUM: {formatAUM(firm.aum)}</span>
                <span>·</span>
                <span>★ {firm.rating} ({firm.review_count} reviews)</span>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function SearchPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Filter firms based on search + filters
  const filteredFirms = sampleFirms.filter(firm => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = firm.name.toLowerCase().includes(query);
      const matchesCity = firm.city.toLowerCase().includes(query);
      const matchesTags = firm.tags.some(t => t.toLowerCase().includes(query));
      if (!matchesName && !matchesCity && !matchesTags) return false;
    }
    // Fee filter
    if (filters.fees && (filters.fees as string[]).length > 0) {
      if (!(filters.fees as string[]).includes(firm.fee_type)) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Browse Financial Advisors</h1>
      <p className="mt-1 text-sm text-slate-500">
        Search and filter by name, location, fee structure, AUM, and specialty.
      </p>

      {/* Search Bar */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Search firms by name, city, or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />
        <Button className="hidden sm:inline-flex">Search</Button>
      </div>

      {/* Mobile filter toggle */}
      <Button
        variant="outline"
        size="sm"
        className="mt-3 lg:hidden"
        onClick={() => setFiltersOpen(true)}
      >
        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        Filters
      </Button>

      <div className="mt-4 md:mt-6 flex flex-col gap-6 lg:flex-row">
        <FilterSidebar 
          open={filtersOpen} 
          onClose={() => setFiltersOpen(false)} 
          filters={filters}
          setFilters={setFilters}
        />

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">{filteredFirms.length} firms found</span>
            <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option>Sort: Relevance</option>
              <option>Sort: AUM (High to Low)</option>
              <option>Sort: Rating</option>
              <option>Sort: Name A-Z</option>
            </select>
          </div>

          <div className="grid gap-3 md:gap-4">
            {filteredFirms.map((firm) => (
              <FirmCard key={firm.crd} firm={firm} />
            ))}
          </div>

          {filteredFirms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No firms match your search criteria.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({});
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled className="hidden md:inline-flex">
              Previous
            </Button>
            <span className="hidden md:inline px-3 text-sm text-slate-500">Page 1 of 1</span>
            <Button variant="outline" size="sm" disabled className="hidden md:inline-flex">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
