'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
const supabase = createSupabaseBrowserClient();

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
  // Profile text fields
  client_base: string | null;
  wealth_tier: string | null;
  investment_philosophy: string | null;
  firm_character: string | null;
  specialty_strategies: string | null;
  // Fee tiers
  min_fee: number | null;
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
  const [location, setLocation] = useState('');
  const [minAUM, setMinAUM] = useState('');
  const [minAccountSize, setMinAccountSize] = useState('');
  const [clientBase, setClientBase] = useState('');
  const [wealthTier, setWealthTier] = useState('');

  const applyFilters = () => {
    setFilters({
      location,
      minAUM,
      minAccountSize,
      clientBase,
      wealthTier,
    });
    onClose();
  };

  const wealthTiers = [
    'Mass Affluent',
    'High Net Worth',
    'Ultra High Net Worth',
    'Billionaire',
  ];

  const clientBases = [
    'Individuals',
    'Families',
    'Business Owners',
    'Institutions',
    'Nonprofits',
  ];

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

          {/* Location Filter */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Location</label>
            <input
              type="text"
              placeholder="City or state..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            />
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

          {/* Minimum Account Size */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Account Minimum</label>
            <select 
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={minAccountSize}
              onChange={(e) => setMinAccountSize(e.target.value)}
            >
              <option value="">Any</option>
              <option value="0">No minimum</option>
              <option value="100000">$100K+</option>
              <option value="500000">$500K+</option>
              <option value="1000000">$1M+</option>
              <option value="5000000">$5M+</option>
              <option value="10000000">$10M+</option>
            </select>
          </div>

          {/* Wealth Tier */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Client Wealth Level</label>
            <select 
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={wealthTier}
              onChange={(e) => setWealthTier(e.target.value)}
            >
              <option value="">Any</option>
              {wealthTiers.map((tier) => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </select>
          </div>

          {/* Client Base */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Client Base</label>
            <select 
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={clientBase}
              onChange={(e) => setClientBase(e.target.value)}
            >
              <option value="">Any</option>
              {clientBases.map((base) => (
                <option key={base} value={base}>{base}</option>
              ))}
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

function FirmCard({ firm, isSelected }: { firm: Firm; isSelected?: boolean }) {
  return (
    <Link href={`/firm/${firm.crd}`}>
      <Card variant="default" padding="md" className={`hover:shadow-md transition-shadow cursor-pointer ${isSelected ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
        <div className="flex items-start gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs md:text-sm">
            {firm.primary_business_name.split(' ').map(w => w[0]).join('').slice(0,2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate text-sm md:text-base">
              {firm.primary_business_name}
            </h3>
            <p className="text-xs md:text-sm text-slate-500">{firm.main_office_city}, {firm.main_office_state}</p>
            
            {/* Client info tags */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {firm.services_financial_planning === 'Y' && <Badge variant="primary">Financial Planning</Badge>}
              {firm.services_mgr_selection === 'Y' && <Badge>Manager Selection</Badge>}
              {firm.services_pension_consulting === 'Y' && <Badge>Pension Consulting</Badge>}
              {firm.wealth_tier && <Badge>{firm.wealth_tier}</Badge>}
            </div>
            
            <CardContent className="mt-3">
              <div className="flex items-center gap-2 md:gap-4 text-xs text-slate-500">
                <span>AUM: {formatAUM(firm.aum)}</span>
                <span>·</span>
                <span>Offices: {firm.number_of_offices || 'N/A'}</span>
                {firm.min_fee && (
                  <>
                    <span>·</span>
                    <span>Min: {formatAUM(firm.min_fee * 1000000)}</span>
                  </>
                )}
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
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Fetch firms from Supabase with filters
  const fetchFirms = useCallback(async (query: string, filterOptions: Record<string, unknown>) => {
    setLoading(true);
    setError(null);

    try {
      // First get base firms from firmdata_current
      let queryBuilder = supabase
        .from('firmdata_current')
        .select(`
          crd, 
          primary_business_name, 
          main_office_city, 
          main_office_state, 
          aum, 
          employee_total, 
          number_of_offices, 
          services_financial_planning, 
          services_mgr_selection, 
          services_pension_consulting
        `);

      // Search by firm name
      if (query && query.length > 0) {
        queryBuilder = queryBuilder.ilike('primary_business_name', `%${query}%`);
      }

      // Filter by location (city or state)
      if (filterOptions.location && (filterOptions.location as string).length > 0) {
        const loc = (filterOptions.location as string).toLowerCase();
        queryBuilder = queryBuilder.or(`main_office_city.ilike.%${loc}%,main_office_state.ilike.%${loc}%`);
      }

      // Filter by minimum AUM
      if (filterOptions.minAUM && (filterOptions.minAUM as string).length > 0) {
        const minAUM = parseInt(filterOptions.minAUM as string);
        queryBuilder = queryBuilder.gte('aum', minAUM);
      }

      // Get base firms
      const { data: baseFirms, error: baseError } = await queryBuilder.limit(100);

      if (baseError) {
        console.error('Error fetching firms:', baseError);
        setError(baseError.message);
        setFirms([]);
        setLoading(false);
        return;
      }

      if (!baseFirms || baseFirms.length === 0) {
        setFirms([]);
        setLoading(false);
        return;
      }

      // Get CRDs to fetch profile text
      const crds = baseFirms.map(f => f.crd);

      // Fetch profile text for these firms
      const { data: profileData } = await supabase
        .from('firmdata_profile_text')
        .select('crd, client_base, wealth_tier, investment_philosophy, firm_character, specialty_strategies')
        .in('crd', crds);

      // Fetch fee tiers
      const { data: feeData } = await supabase
        .from('firmdata_feetiers')
        .select('crd, min_aum')
        .in('crd', crds);

      // Merge data
      const profileMap = new Map((profileData || []).map(p => [p.crd, p]));
      const feeMap = new Map((feeData || []).map(f => [f.crd, f]));

      let mergedFirms = baseFirms.map(firm => ({
        ...firm,
        client_base: profileMap.get(firm.crd)?.client_base || null,
        wealth_tier: profileMap.get(firm.crd)?.wealth_tier || null,
        investment_philosophy: profileMap.get(firm.crd)?.investment_philosophy || null,
        firm_character: profileMap.get(firm.crd)?.firm_character || null,
        specialty_strategies: profileMap.get(firm.crd)?.specialty_strategies || null,
        min_fee: feeMap.get(firm.crd)?.min_aum ? parseFloat(feeMap.get(firm.crd)!.min_aum) : null,
      }));

      // Apply additional client-side filters
      if (filterOptions.wealthTier && (filterOptions.wealthTier as string).length > 0) {
        mergedFirms = mergedFirms.filter(f => 
          f.wealth_tier && f.wealth_tier.toLowerCase().includes((filterOptions.wealthTier as string).toLowerCase())
        );
      }

      if (filterOptions.clientBase && (filterOptions.clientBase as string).length > 0) {
        mergedFirms = mergedFirms.filter(f => 
          f.client_base && f.client_base.toLowerCase().includes((filterOptions.clientBase as string).toLowerCase())
        );
      }

      if (filterOptions.minAccountSize && (filterOptions.minAccountSize as string).length > 0) {
        const minSize = parseInt(filterOptions.minAccountSize as string);
        mergedFirms = mergedFirms.filter(f => 
          f.min_fee !== null && (f.min_fee * 1000000) >= minSize
        );
      }

      setFirms(mergedFirms.slice(0, 50));
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch firms');
    }

    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchFirms('', {});
  }, [fetchFirms]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFirms(searchQuery, filters);
  };

  // Handle filter apply
  const handleApplyFilters = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
    fetchFirms(searchQuery, newFilters);
    setFiltersOpen(false);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    fetchFirms('', {});
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Browse Financial Advisors</h1>
      <p className="mt-1 text-sm text-slate-500">
        Search {2000}+ SEC-registered investment advisors by name, location, account minimum, client base, and more.
      </p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Search firms by name (e.g., Morgan Stanley, Avestar)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSelectedIndex(prev => Math.min(prev + 1, firms.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSelectedIndex(prev => Math.max(prev - 1, -1));
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
              e.preventDefault();
              const selected = firms[selectedIndex];
              if (selected) {
                window.location.href = `/firm/${selected.crd}`;
              }
            }
          }}
          className="flex-1 h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />
        <Button type="submit" className="hidden sm:inline-flex">Search</Button>
      </form>
      
      {/* Keyboard hints */}
      {firms.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          Use ↑↓ to navigate, Enter to select
        </p>
      )}

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
          setFilters={handleApplyFilters}
        />

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">{loading ? 'Searching...' : `${firms.length} firms found`}</span>
            {(Object.keys(filters).length > 0 || searchQuery.length > 0) && (
              <button 
                onClick={handleClearFilters}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Clear all
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
              <p className="mt-4 text-slate-500">Searching...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:gap-4">
                {firms.map((firm, idx) => (
                  <FirmCard key={firm.crd} firm={firm} isSelected={idx === selectedIndex} />
                ))}
              </div>

              {firms.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-500">No firms found matching your search.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={handleClearFilters}
                  >
                    Clear Search
                  </Button>
                </div>
              )}

              {firms.length === 50 && (
                <p className="mt-4 text-center text-sm text-slate-500">
                  Showing first 50 results. Try refining your search for more specific results.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
