'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Firm {
  crd: number;
  primary_business_name: string;
  main_office_city: string;
  main_office_state: string;
  aum: number | null;
  employee_total: number | null;
  number_of_offices: number | null;
  services_financial_planning: string | null;
  services_mgr_selection: string | null;
  services_pension_consulting: string | null;
}

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
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
              {['Fee-Only', 'Fee-Based', 'Commission'].map((fee) => (
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

          <Button variant="primary" size="sm" className="w-full" onClick={applyFilters}>
            Apply Filters
          </Button>
        </div>
      </aside>
    </>
  );
}

function FirmCard({ firm }: { firm: Firm }) {
  return (
    <Link href={`/firm/${firm.crd}`}>
      <Card variant="default" padding="md" className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs md:text-sm">
            {firm.primary_business_name.split(' ').map(w => w[0]).join('').slice(0,2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate text-sm md:text-base">
              {firm.primary_business_name}
            </h3>
            <p className="text-xs md:text-sm text-slate-500">{firm.main_office_city}, {firm.main_office_state}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {firm.services_financial_planning === 'Y' && <Badge variant="primary">Financial Planning</Badge>}
              {firm.services_mgr_selection === 'Y' && <Badge>Manager Selection</Badge>}
              {firm.services_pension_consulting === 'Y' && <Badge>Pension Consulting</Badge>}
            </div>
            <CardContent className="mt-3">
              <div className="flex items-center gap-2 md:gap-4 text-xs text-slate-500">
                <span>AUM: {formatAUM(firm.aum)}</span>
                <span>·</span>
                <span>Offices: {firm.number_of_offices || 'N/A'}</span>
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
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFirms() {
      const { data, error } = await supabase
        .from('firmdata_current')
        .select('crd, primary_business_name, main_office_city, main_office_state, aum, employee_total, number_of_offices, services_financial_planning, services_mgr_selection, services_pension_consulting')
        .limit(50);
      
      if (error) {
        console.error('Error fetching firms:', error);
        setError(error.message);
      } else {
        setFirms(data || []);
      }
      setLoading(false);
    }
    fetchFirms();
  }, []);

  // Filter firms based on search + filters
  const filteredFirms = firms.filter(firm => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = firm.primary_business_name?.toLowerCase().includes(query);
      const matchesCity = firm.main_office_city?.toLowerCase().includes(query);
      if (!matchesName && !matchesCity) return false;
    }
    // Fee filter
    if (filters.fees && (filters.fees as string[]).length > 0) {
      // No fee type in current schema - skip for now
    }
    // AUM filter
    if (filters.minAUM && firm.aum) {
      if (firm.aum < parseInt(filters.minAUM as string)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
          <p className="mt-4 text-slate-500">Loading firms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

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
          placeholder="Search firms by name or city..."
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
