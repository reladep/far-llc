'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import FirmLogo, { getAvatarColor } from '@/components/firms/FirmLogo';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { haversineDistance, zipToCoords, getUSCities, type CityEntry } from '@/lib/geo';
import type { Session } from '@supabase/supabase-js';

const supabase = createSupabaseBrowserClient();

const SEARCH_PAGE_CSS = `
@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.search-card-stagger {
  animation: cardFadeIn 0.35s ease-out both;
}
@media (prefers-reduced-motion: reduce) {
  .search-card-stagger { animation: none; }
}
`;

interface Firm {
  crd: number;
  primary_business_name: string;
  display_name?: string | null;
  logo_key?: string | null;
  main_office_city: string;
  main_office_state: string;
  main_office_zip: string | null;
  aum: number | null;
  employee_total: number | null;
  employee_investment: number | null;
  number_of_offices: number | null;
  services_financial_planning: string | null;
  services_mgr_selection: string | null;
  services_pension_consulting: string | null;
  // Client counts (for avg client size calc)
  client_hnw_number: number | null;
  client_non_hnw_number: number | null;
  client_pension_number: number | null;
  client_charitable_number: number | null;
  client_corporations_number: number | null;
  client_pooled_vehicles_number: number | null;
  client_other_number: number | null;
  // Profile text fields
  client_base: string | null;
  wealth_tier: string | null;
  investment_philosophy: string | null;
  firm_character: string | null;
  specialty_strategies: string | null;
  business_profile: string | null;
  // Fee tiers
  min_fee: number | null;
  minimum_account_size: string | null;
  // Website
  website: string | null;
  // Visor Index
  final_score?: number | null;
  stars?: number | null;
  fee_competitiveness_score?: number | null;
  conflict_free_score?: number | null;
  aum_growth_score?: number | null;
  fee_transparency_score?: number | null;
  // Growth rates
  aum_1yr_growth_annualized?: number | null;
  aum_5yr_growth_annualized?: number | null;
  aum_10yr_growth_annualized?: number | null;
  clients_1yr_growth_annualized?: number | null;
  clients_5yr_growth_annualized?: number | null;
  clients_10yr_growth_annualized?: number | null;
  // Fee structure (from firmdata_feesandmins)
  fee_structure_type?: string | null;
  // Tags (from firmdata_manual)
  tag_1?: string | null;
  tag_2?: string | null;
  tag_3?: string | null;
  // Asset allocation (from firmdata_current)
  asset_allocation_private_equity_direct?: number | null;
  // Client type breakdown counts (from firmdata_current)
  client_banks_number?: number | null;
  client_bdc_number?: number | null;
  client_govt_number?: number | null;
  client_insurance_number?: number | null;
  client_investment_cos_number?: number | null;
  client_other_advisors_number?: number | null;
  client_swf_number?: number | null;
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

type FeeStructureFilter = 'range' | 'tiered' | 'flat_percentage' | 'capped' | 'maximum_only';
type FirmTypeFilter = 'ria' | 'multi_family_office' | 'ocio' | 'bank_affiliated';
type ConflictFilter = 'no_referral' | 'no_12b1' | 'no_disciplinary' | 'no_pe_ownership';
type ClientTypeFilter = 'hnw' | 'non_hnw' | 'pension' | 'charitable' | 'corporations' | 'pooled_vehicles' | 'banks' | 'govt' | 'insurance';

interface SearchFilters {
  // Geographic radius filter
  geoLocation: { city: string; state: string; lat: number; lng: number } | null;
  geoRadius: number; // 10, 25, 50, 100
  // Ranges (string-encoded numbers)
  minAUM: string;
  minAccountSize: string;
  // Score ranges
  minVisorScore: number;
  minFeeCompetitiveness: number;
  // Multi-select sets
  feeStructure: Set<FeeStructureFilter>;
  firmType: Set<FirmTypeFilter>;
  conflictScreening: Set<ConflictFilter>;
  clientType: Set<ClientTypeFilter>;
  tags: Set<string>;
  // Growth ranges
  minAUMGrowth: string;    // '0' | '5' | '10' | '20' — min 1yr AUM growth %
  minClientGrowth: string; // '0' | '5' | '10' | '20' — min 1yr client growth %
  // Computed ranges
  avgClientSizeMin: string; // min avg client size
  avgClientSizeMax: string;
  totalClientsMin: string;
  totalClientsMax: string;
  aumPerAdvisorMin: string;
  clientsPerAdvisorMin: string;
  // Alternatives
  hasAlternatives: boolean;
  // Legacy
  clientBase: string;
  wealthTier: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  geoLocation: null,
  geoRadius: 10,
  minAUM: '',
  minAccountSize: '',
  minVisorScore: 0,
  minFeeCompetitiveness: 0,
  feeStructure: new Set(),
  firmType: new Set(),
  conflictScreening: new Set(),
  clientType: new Set(),
  tags: new Set(),
  minAUMGrowth: '',
  minClientGrowth: '',
  avgClientSizeMin: '',
  avgClientSizeMax: '',
  totalClientsMin: '',
  totalClientsMax: '',
  aumPerAdvisorMin: '',
  clientsPerAdvisorMin: '',
  hasAlternatives: false,
  clientBase: '',
  wealthTier: '',
};

// Helper: compute total clients for a firm (matches firm profile page computation)
function getTotalClients(firm: Firm): number {
  return [
    firm.client_hnw_number, firm.client_non_hnw_number, firm.client_pension_number,
    firm.client_charitable_number, firm.client_corporations_number,
    firm.client_pooled_vehicles_number, firm.client_other_number,
    firm.client_banks_number, firm.client_bdc_number,
    firm.client_govt_number, firm.client_insurance_number,
    firm.client_investment_cos_number, firm.client_other_advisors_number,
    firm.client_swf_number,
  ].reduce((sum, v) => (sum || 0) + (v || 0), 0) as number;
}

// Helper: compute avg client size
function getAvgClientSize(firm: Firm): number | null {
  const total = getTotalClients(firm);
  return total > 0 && firm.aum ? firm.aum / total : null;
}

// Helper: compute AUM per investment professional
function getAUMPerAdvisor(firm: Firm): number | null {
  return firm.employee_investment && firm.employee_investment > 0 && firm.aum
    ? firm.aum / firm.employee_investment
    : null;
}

// Helper: compute clients per advisor
function getClientsPerAdvisor(firm: Firm): number | null {
  const total = getTotalClients(firm);
  return total > 0 && firm.employee_investment && firm.employee_investment > 0
    ? total / firm.employee_investment
    : null;
}

// Helper: parse minimum account size string to number, returns null for missing/zero/NaN
function parseMinAccount(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const val = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return isNaN(val) || val === 0 ? null : val;
}

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function FormatAUMDisplay({ value }: { value: number | null }) {
  if (!value) return <span>N/A</span>;
  let num: string, suffix: string;
  if (value >= 1e9) { num = `$${(value / 1e9).toFixed(1)}`; suffix = 'B'; }
  else if (value >= 1e6) { num = `$${(value / 1e6).toFixed(0)}`; suffix = 'M'; }
  else if (value >= 1e3) { num = `$${(value / 1e3).toFixed(0)}`; suffix = 'K'; }
  else { return <span>${Math.round(value).toLocaleString()}</span>; }
  return <><span>{num}</span><span className="text-[18px]">{suffix}</span></>;
}

// ─── Filter Sidebar ──────────────────────────────────────────────────────────

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  firms: Firm[];           // all fetched firms — for computing real counts
  firmCoords: Map<number, { lat: number; lng: number }>;
  loading: boolean;
  onGeoSelect?: () => void;
  onResetFilters?: () => void;
}

function FilterSidebar({ open, onClose, filters, onFiltersChange, firms, firmCoords, loading, onGeoSelect, onResetFilters }: FilterSidebarProps) {

  // Helper: toggle a value in a Set-based filter
  const toggleSet = <T extends string>(key: keyof SearchFilters, value: T) => {
    const current = filters[key] as Set<T>;
    const next = new Set(current);
    if (next.has(value)) next.delete(value); else next.add(value);
    onFiltersChange({ ...filters, [key]: next });
  };

  // Helper: set a string filter, toggling off if same value
  const toggleString = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: filters[key] === value ? '' : value });
  };

  // ── Compute real counts from the full firm set (before client-side filters) ──
  const counts = useMemo(() => {
    if (loading || firms.length === 0) return null;

    const feeRange = firms.filter(f => f.fee_structure_type === 'range').length;
    const feeTiered = firms.filter(f => f.fee_structure_type === 'tiered').length;
    const feeFlatPct = firms.filter(f => f.fee_structure_type === 'flat_percentage').length;
    const feeCapped = firms.filter(f => f.fee_structure_type === 'capped').length;
    const feeMaxOnly = firms.filter(f => f.fee_structure_type === 'maximum_only').length;

    const aumUnder100 = firms.filter(f => f.aum != null && f.aum < 100000000).length;
    const aum100to500 = firms.filter(f => f.aum != null && f.aum >= 100000000 && f.aum < 500000000).length;
    const aum500to2b = firms.filter(f => f.aum != null && f.aum >= 500000000 && f.aum < 2000000000).length;
    const aum2bPlus = firms.filter(f => f.aum != null && f.aum >= 2000000000).length;

    // Investment minimum counts (from minimum_account_size)
    const invMinNone = firms.filter(f => { const v = f.minimum_account_size ? parseFloat(f.minimum_account_size) : null; return v === null || v === 0; }).length;
    const invMinUnder250k = firms.filter(f => { const v = f.minimum_account_size ? parseFloat(f.minimum_account_size) : null; return v != null && v > 0 && v < 250000; }).length;
    const invMin250kTo1m = firms.filter(f => { const v = f.minimum_account_size ? parseFloat(f.minimum_account_size) : null; return v != null && v >= 250000 && v < 1000000; }).length;
    const invMin1mPlus = firms.filter(f => { const v = f.minimum_account_size ? parseFloat(f.minimum_account_size) : null; return v != null && v >= 1000000; }).length;

    // Average client size counts
    const avgUnder1m = firms.filter(f => { const a = getAvgClientSize(f); return a != null && a < 1000000; }).length;
    const avg1mTo5m = firms.filter(f => { const a = getAvgClientSize(f); return a != null && a >= 1000000 && a < 5000000; }).length;
    const avg5mTo25m = firms.filter(f => { const a = getAvgClientSize(f); return a != null && a >= 5000000 && a < 25000000; }).length;
    const avg25mPlus = firms.filter(f => { const a = getAvgClientSize(f); return a != null && a >= 25000000; }).length;

    // Total clients counts
    const clientsUnder100 = firms.filter(f => { const t = getTotalClients(f); return t > 0 && t < 100; }).length;
    const clients100to500 = firms.filter(f => { const t = getTotalClients(f); return t >= 100 && t < 500; }).length;
    const clients500to2k = firms.filter(f => { const t = getTotalClients(f); return t >= 500 && t < 2000; }).length;
    const clients2kPlus = firms.filter(f => { const t = getTotalClients(f); return t >= 2000; }).length;

    // AUM per advisor counts
    const apaUnder100m = firms.filter(f => { const r = getAUMPerAdvisor(f); return r != null && r < 100000000; }).length;
    const apa100mTo500m = firms.filter(f => { const r = getAUMPerAdvisor(f); return r != null && r >= 100000000 && r < 500000000; }).length;
    const apa500mPlus = firms.filter(f => { const r = getAUMPerAdvisor(f); return r != null && r >= 500000000; }).length;

    const cpaUnder25 = firms.filter(f => { const r = getClientsPerAdvisor(f); return r != null && r < 25; }).length;
    const cpa25to75 = firms.filter(f => { const r = getClientsPerAdvisor(f); return r != null && r >= 25 && r < 75; }).length;
    const cpa75to150 = firms.filter(f => { const r = getClientsPerAdvisor(f); return r != null && r >= 75 && r < 150; }).length;
    const cpa150Plus = firms.filter(f => { const r = getClientsPerAdvisor(f); return r != null && r >= 150; }).length;

    const conflictHigh = firms.filter(f => (f.conflict_free_score ?? 0) >= 80).length;
    const feeCompHigh = firms.filter(f => (f.fee_competitiveness_score ?? 0) >= 70).length;

    // Client type counts
    const ctHnw = firms.filter(f => (f.client_hnw_number ?? 0) > 0).length;
    const ctNonHnw = firms.filter(f => (f.client_non_hnw_number ?? 0) > 0).length;
    const ctPension = firms.filter(f => (f.client_pension_number ?? 0) > 0).length;
    const ctCharitable = firms.filter(f => (f.client_charitable_number ?? 0) > 0).length;
    const ctCorporations = firms.filter(f => (f.client_corporations_number ?? 0) > 0).length;
    const ctPooled = firms.filter(f => (f.client_pooled_vehicles_number ?? 0) > 0).length;
    const ctBanks = firms.filter(f => (f.client_banks_number ?? 0) > 0).length;
    const ctGovt = firms.filter(f => (f.client_govt_number ?? 0) > 0).length;
    const ctInsurance = firms.filter(f => (f.client_insurance_number ?? 0) > 0).length;

    const hasAlts = firms.filter(f => (f.asset_allocation_private_equity_direct ?? 0) > 0).length;

    const withTags = firms.filter(f => f.tag_1 || f.tag_2 || f.tag_3);
    const tagCounts = new Map<string, number>();
    withTags.forEach(f => {
      [f.tag_1, f.tag_2, f.tag_3].forEach(t => {
        if (t) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      });
    });
    // Top 8 tags by count
    const topTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const aumGrowth5Plus = firms.filter(f => (f.aum_1yr_growth_annualized ?? -999) >= 5).length;
    const aumGrowth10Plus = firms.filter(f => (f.aum_1yr_growth_annualized ?? -999) >= 10).length;
    const clientGrowth5Plus = firms.filter(f => (f.clients_1yr_growth_annualized ?? -999) >= 5).length;
    const clientGrowth10Plus = firms.filter(f => (f.clients_1yr_growth_annualized ?? -999) >= 10).length;

    return {
      feeRange, feeTiered, feeFlatPct, feeCapped, feeMaxOnly,
      aumUnder100, aum100to500, aum500to2b, aum2bPlus,
      invMinNone, invMinUnder250k, invMin250kTo1m, invMin1mPlus,
      avgUnder1m, avg1mTo5m, avg5mTo25m, avg25mPlus,
      clientsUnder100, clients100to500, clients500to2k, clients2kPlus,
      apaUnder100m, apa100mTo500m, apa500mPlus,
      cpaUnder25, cpa25to75, cpa75to150, cpa150Plus,
      ctHnw, ctNonHnw, ctPension, ctCharitable, ctCorporations, ctPooled, ctBanks, ctGovt, ctInsurance,
      conflictHigh, feeCompHigh, hasAlts, topTags,
      aumGrowth5Plus, aumGrowth10Plus,
      clientGrowth5Plus, clientGrowth10Plus,
    };
  }, [firms, loading]);

  const fmt = (n: number | undefined) => n != null ? n.toLocaleString() : '—';

  // ── Geo filter local state ──
  const [geoInput, setGeoInput] = useState('');
  const [showGeoDrop, setShowGeoDrop] = useState(false);
  const [geoHighlight, setGeoHighlight] = useState(-1);
  const geoDropRef = useRef<HTMLDivElement>(null);

  // Sync local input when geo filter is cleared externally
  useEffect(() => {
    if (!filters.geoLocation) setGeoInput('');
  }, [filters.geoLocation]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (geoDropRef.current && !geoDropRef.current.contains(e.target as Node)) {
        setShowGeoDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Static city list (pre-generated, no runtime cost)
  const allCities = getUSCities();

  // Filter cities based on input
  const matchingCities = useMemo(() => {
    if (!geoInput || geoInput.length < 2) return [];
    const q = geoInput.toLowerCase();
    const results: CityEntry[] = [];
    for (const c of allCities) {
      const label = (c.city + ', ' + c.state).toLowerCase();
      if (label.startsWith(q) || c.city.toLowerCase().startsWith(q)) {
        results.push(c);
        if (results.length >= 20) break;
      }
    }
    return results;
  }, [geoInput]);

  // Compute match count for active geo filter
  const geoMatchCount = useMemo(() => {
    if (!filters.geoLocation) return 0;
    if (filters.geoRadius === 0) return firmCoords.size; // "Any" = all firms with coords
    const { lat, lng } = filters.geoLocation;
    let count = 0;
    for (const f of firms) {
      const coords = firmCoords.get(f.crd);
      if (coords && haversineDistance(lat, lng, coords.lat, coords.lng) <= filters.geoRadius) {
        count++;
      }
    }
    return count;
  }, [firms, firmCoords, filters.geoLocation, filters.geoRadius]);

  const selectCity = (c: CityEntry) => {
    setGeoInput(c.city + ', ' + c.state);
    setShowGeoDrop(false);
    setGeoHighlight(-1);
    onFiltersChange({ ...filters, geoLocation: { city: c.city, state: c.state, lat: c.lat, lng: c.lng } });
    onGeoSelect?.();
  };

  // Keyboard navigation for geo dropdown
  const handleGeoKeyDown = (e: React.KeyboardEvent) => {
    if (!showGeoDrop || matchingCities.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setGeoHighlight(prev => (prev < matchingCities.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setGeoHighlight(prev => (prev > 0 ? prev - 1 : matchingCities.length - 1));
    } else if (e.key === 'Enter' && geoHighlight >= 0 && geoHighlight < matchingCities.length) {
      e.preventDefault();
      selectCity(matchingCities[geoHighlight]);
    } else if (e.key === 'Escape') {
      setShowGeoDrop(false);
      setGeoHighlight(-1);
    }
  };

  const clearGeo = () => {
    setGeoInput('');
    setShowGeoDrop(false);
    onFiltersChange({ ...filters, geoLocation: null });
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[280px] bg-[#0A1C2A] overflow-y-auto transition-transform duration-300',
          'lg:sticky lg:top-[108px] lg:z-auto lg:h-[calc(100vh-108px)] lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] p-4 lg:hidden">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/60">Filters</h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center text-white/40 hover:text-white" aria-label="Close">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="pr-8 pt-2 pb-12">

          {/* ── Location (Geographic Radius) ── */}
          <FilterGroup label="Location">
            <div ref={geoDropRef} className="relative">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="City, State…"
                  value={geoInput}
                  onChange={e => { setGeoInput(e.target.value); setShowGeoDrop(true); setGeoHighlight(-1); if (filters.geoLocation) onFiltersChange({ ...filters, geoLocation: null }); }}
                  onKeyDown={handleGeoKeyDown}
                  onFocus={() => { if (geoInput.length >= 2) setShowGeoDrop(true); }}
                  className="w-full bg-white/[0.06] border border-white/[0.08] text-white text-[12px] pl-8 pr-8 py-2 placeholder:text-white/25 focus:outline-none focus:border-[#2DBD74]/40 transition-colors"
                />
                {filters.geoLocation && (
                  <button
                    onClick={clearGeo}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                    aria-label="Clear location"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {showGeoDrop && geoInput.length >= 2 && matchingCities.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-[200px] overflow-y-auto bg-[#0D2233] border border-white/[0.08] shadow-lg">
                  {matchingCities.map((c, i) => (
                    <button
                      key={c.city + '|' + c.state}
                      ref={el => { if (i === geoHighlight && el) el.scrollIntoView({ block: 'nearest' }); }}
                      onClick={() => selectCity(c)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-[11px] transition-colors',
                        i === geoHighlight
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                      )}
                    >
                      {c.city}, {c.state}
                    </button>
                  ))}
                </div>
              )}
              {showGeoDrop && geoInput.length >= 2 && matchingCities.length === 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0D2233] border border-white/[0.08] shadow-lg px-3 py-2">
                  <span className="text-[11px] text-white/30">No cities found</span>
                </div>
              )}
            </div>

            {/* Radius pills */}
            <div className="flex gap-1.5 mt-2.5">
              {([10, 25, 50, 100, 0] as const).map(r => (
                <button
                  key={r}
                  onClick={() => onFiltersChange({ ...filters, geoRadius: r })}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-medium border transition-colors',
                    filters.geoRadius === r
                      ? 'bg-[rgba(45,189,116,0.15)] border-[rgba(45,189,116,0.4)] text-[#2DBD74]'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/35 hover:text-white/55 hover:border-white/[0.15]'
                  )}
                >
                  {r === 0 ? 'Any' : `${r}mi`}
                </button>
              ))}
            </div>

            {/* Match count */}
            {filters.geoLocation && (
              <p className="text-[10px] text-white/30 mt-2">
                {geoMatchCount.toLocaleString()} firm{geoMatchCount !== 1 ? 's' : ''}{filters.geoRadius === 0 ? ` near` : ` within ${filters.geoRadius} mi of`} {filters.geoLocation.city}, {filters.geoLocation.state}
              </p>
            )}
          </FilterGroup>

          {/* ── Fee Structure ── */}
          <FilterGroup label="Fee Schedule">
            {([
              { label: 'Range-based', key: 'range' as FeeStructureFilter, count: counts?.feeRange },
              { label: 'Tiered', key: 'tiered' as FeeStructureFilter, count: counts?.feeTiered },
              { label: 'Flat percentage', key: 'flat_percentage' as FeeStructureFilter, count: counts?.feeFlatPct },
              { label: 'Capped / max only', key: 'capped' as FeeStructureFilter, count: counts?.feeCapped != null && counts?.feeMaxOnly != null ? counts.feeCapped + counts.feeMaxOnly : undefined },
            ]).map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={fmt(opt.count)}
                checked={filters.feeStructure.has(opt.key)}
                onChange={() => toggleSet('feeStructure', opt.key)}
              />
            ))}
          </FilterGroup>

          {/* ── Visor Index Range ── */}
          <FilterGroup label="Visor Index™">
            <style suppressHydrationWarning>{`
              .score-range-input {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 3px;
                border-radius: 2px;
                outline: none;
                cursor: pointer;
                background: transparent;
              }
              .score-range-input::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #2DBD74;
                cursor: pointer;
                border: 2px solid #0A1C2A;
                box-shadow: 0 0 0 1px rgba(45,189,116,0.4);
                margin-top: -5.5px;
              }
              .score-range-input::-moz-range-thumb {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #2DBD74;
                cursor: pointer;
                border: 2px solid #0A1C2A;
                box-shadow: 0 0 0 1px rgba(45,189,116,0.4);
              }
            `}</style>
            <div className="mt-1">
              <div className="flex justify-between mb-2.5">
                <span className="font-mono text-[11px] text-white/60">{filters.minVisorScore === 0 ? 'Any' : filters.minVisorScore}</span>
                <span className="font-mono text-[11px] text-white/60">100</span>
              </div>
              <div className="relative h-[3px] bg-white/[0.08] rounded-full mb-3">
                <div
                  className="absolute top-0 bottom-0 bg-[#1A7A4A] rounded-full"
                  style={{ left: `${filters.minVisorScore}%`, right: 0 }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={filters.minVisorScore}
                onChange={e => onFiltersChange({ ...filters, minVisorScore: Number(e.target.value) })}
                className="score-range-input"
                style={{ marginTop: '-16px' }}
              />
              <p className="text-[10px] text-white/45 mt-2">
                {filters.minVisorScore === 0 ? 'Showing all scores' : `Minimum score: ${filters.minVisorScore}`}
              </p>
            </div>
          </FilterGroup>

          {/* ── Fee Competitiveness ── */}
          <FilterGroup label="Fee Competitiveness">
            <div className="mt-1">
              <div className="flex justify-between mb-2.5">
                <span className="font-mono text-[11px] text-white/60">{filters.minFeeCompetitiveness === 0 ? 'Any' : filters.minFeeCompetitiveness}</span>
                <span className="font-mono text-[11px] text-white/60">100</span>
              </div>
              <div className="relative h-[3px] bg-white/[0.08] rounded-full mb-3">
                <div
                  className="absolute top-0 bottom-0 bg-[#1A7A4A] rounded-full"
                  style={{ left: `${filters.minFeeCompetitiveness}%`, right: 0 }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={filters.minFeeCompetitiveness}
                onChange={e => onFiltersChange({ ...filters, minFeeCompetitiveness: Number(e.target.value) })}
                className="score-range-input"
                style={{ marginTop: '-16px' }}
              />
              <p className="text-[10px] text-white/45 mt-2">
                {filters.minFeeCompetitiveness === 0 ? 'Showing all' : `Min fee competitiveness: ${filters.minFeeCompetitiveness}`}
              </p>
            </div>
          </FilterGroup>

          {/* ── Firm AUM ── */}
          <FilterGroup label="Firm AUM">
            {[
              { label: 'Under $100M', value: 'under100m', count: counts?.aumUnder100 },
              { label: '$100M – $500M', value: '100000000', count: counts?.aum100to500 },
              { label: '$500M – $2B', value: '500000000', count: counts?.aum500to2b },
              { label: '$2B+', value: '2000000000', count: counts?.aum2bPlus },
            ].map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={fmt(opt.count)}
                checked={filters.minAUM === opt.value}
                onChange={() => toggleString('minAUM', opt.value)}
              />
            ))}
          </FilterGroup>

          {/* ── Investment Minimum ── */}
          <FilterGroup label="Investment Minimum">
            {[
              { label: 'No minimum', value: '0', count: counts?.invMinNone },
              { label: 'Under $250K', value: 'under250k', count: counts?.invMinUnder250k },
              { label: '$250K – $1M', value: '250000', count: counts?.invMin250kTo1m },
              { label: '$1M+', value: '1000000', count: counts?.invMin1mPlus },
            ].map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={fmt(opt.count)}
                checked={filters.minAccountSize === opt.value}
                onChange={() => toggleString('minAccountSize', opt.value)}
              />
            ))}
          </FilterGroup>

          {/* ── AUM Growth ── */}
          <FilterGroup label="AUM Growth (1yr)">
            {[
              { label: 'Any growth (0%+)', value: '0' },
              { label: '5%+ growth', value: '5', count: counts?.aumGrowth5Plus },
              { label: '10%+ growth', value: '10', count: counts?.aumGrowth10Plus },
            ].map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={opt.count != null ? fmt(opt.count) : '—'}
                checked={filters.minAUMGrowth === opt.value}
                onChange={() => toggleString('minAUMGrowth', opt.value)}
              />
            ))}
          </FilterGroup>

          {/* ── Client Growth ── */}
          <FilterGroup label="Client Growth (1yr)">
            {[
              { label: 'Any growth (0%+)', value: '0' },
              { label: '5%+ growth', value: '5', count: counts?.clientGrowth5Plus },
              { label: '10%+ growth', value: '10', count: counts?.clientGrowth10Plus },
            ].map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={opt.count != null ? fmt(opt.count) : '—'}
                checked={filters.minClientGrowth === opt.value}
                onChange={() => toggleString('minClientGrowth', opt.value)}
              />
            ))}
          </FilterGroup>

          {/* ── Average Client Size ── */}
          <FilterGroup label="Average Client Size">
            {[
              { label: 'Under $1M', value: 'under1m', count: counts?.avgUnder1m },
              { label: '$1M – $5M', value: '1m_5m', count: counts?.avg1mTo5m },
              { label: '$5M – $25M', value: '5m_25m', count: counts?.avg5mTo25m },
              { label: '$25M+', value: '25m_plus', count: counts?.avg25mPlus },
            ].map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={fmt(opt.count)}
                checked={filters.avgClientSizeMin === opt.value}
                onChange={() => toggleString('avgClientSizeMin', opt.value)}
              />
            ))}
          </FilterGroup>

          {/* ── Total Clients ── */}
          <FilterGroup label="Total Clients">
            {[
              { label: 'Under 100', value: 'under100', count: counts?.clientsUnder100 },
              { label: '100 – 500', value: '100_500', count: counts?.clients100to500 },
              { label: '500 – 2,000', value: '500_2000', count: counts?.clients500to2k },
              { label: '2,000+', value: '2000_plus', count: counts?.clients2kPlus },
            ].map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={fmt(opt.count)}
                checked={filters.totalClientsMin === opt.value}
                onChange={() => toggleString('totalClientsMin', opt.value)}
              />
            ))}
          </FilterGroup>

          {/* ── AUM per Investment Professional ── */}
          <FilterGroup label="AUM per Advisor">
            {[
              { label: 'Under $100M', value: 'under100m', count: counts?.apaUnder100m },
              { label: '$100M – $500M', value: '100m_500m', count: counts?.apa100mTo500m },
              { label: '$500M+', value: '500m_plus', count: counts?.apa500mPlus },
            ].map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={fmt(opt.count)}
                checked={filters.aumPerAdvisorMin === opt.value}
                onChange={() => toggleString('aumPerAdvisorMin', opt.value)}
              />
            ))}
          </FilterGroup>

          {/* ── Clients per Advisor ── */}
          <FilterGroup label="Clients / Advisor">
            {[
              { label: 'Under 25', value: 'under25', count: counts?.cpaUnder25 },
              { label: '25 – 75', value: '25_75', count: counts?.cpa25to75 },
              { label: '75 – 150', value: '75_150', count: counts?.cpa75to150 },
              { label: '150+', value: '150_plus', count: counts?.cpa150Plus },
            ].map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={fmt(opt.count)}
                checked={filters.clientsPerAdvisorMin === opt.value}
                onChange={() => toggleString('clientsPerAdvisorMin', opt.value)}
              />
            ))}
          </FilterGroup>

          {/* ── Client Type Breakdown ── */}
          <FilterGroup label="Client Type">
            {([
              { label: 'High net worth', key: 'hnw' as ClientTypeFilter, count: counts?.ctHnw },
              { label: 'Non-HNW individuals', key: 'non_hnw' as ClientTypeFilter, count: counts?.ctNonHnw },
              { label: 'Pension / profit sharing', key: 'pension' as ClientTypeFilter, count: counts?.ctPension },
              { label: 'Charitable orgs', key: 'charitable' as ClientTypeFilter, count: counts?.ctCharitable },
              { label: 'Corporations / businesses', key: 'corporations' as ClientTypeFilter, count: counts?.ctCorporations },
              { label: 'Pooled vehicles', key: 'pooled_vehicles' as ClientTypeFilter, count: counts?.ctPooled },
              { label: 'Banks / thrifts', key: 'banks' as ClientTypeFilter, count: counts?.ctBanks },
              { label: 'Government entities', key: 'govt' as ClientTypeFilter, count: counts?.ctGovt },
              { label: 'Insurance companies', key: 'insurance' as ClientTypeFilter, count: counts?.ctInsurance },
            ]).map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={fmt(opt.count)}
                checked={filters.clientType.has(opt.key)}
                onChange={() => toggleSet('clientType', opt.key)}
              />
            ))}
          </FilterGroup>

          {/* ── Firm Type ── */}
          <FilterGroup label="Firm Type">
            {([
              { label: 'RIA (independent)', key: 'ria' as FirmTypeFilter },
              { label: 'Multi-family office', key: 'multi_family_office' as FirmTypeFilter },
              { label: 'OCIO', key: 'ocio' as FirmTypeFilter },
              { label: 'Bank-affiliated', key: 'bank_affiliated' as FirmTypeFilter },
            ]).map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count="—"
                checked={filters.firmType.has(opt.key)}
                onChange={() => toggleSet('firmType', opt.key)}
              />
            ))}
          </FilterGroup>

          {/* ── Investment - Alternatives ── */}
          <FilterGroup label="Alternatives Exposure">
            <FilterCheckbox
              label="Has private equity / alternatives"
              count={fmt(counts?.hasAlts)}
              checked={filters.hasAlternatives}
              onChange={() => onFiltersChange({ ...filters, hasAlternatives: !filters.hasAlternatives })}
            />
          </FilterGroup>

          {/* ── Tags ── */}
          {counts && counts.topTags.length > 0 && (
            <FilterGroup label="Tags">
              {counts.topTags.map(([tag, count]) => (
                <FilterCheckbox
                  key={tag}
                  label={tag}
                  count={count.toLocaleString()}
                  checked={filters.tags.has(tag)}
                  onChange={() => toggleSet('tags', tag)}
                />
              ))}
            </FilterGroup>
          )}

        </div>
      </aside>
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="border-t border-white/[0.05] my-4" />
      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  label,
  count,
  checked = false,
  onChange,
}: {
  label: string;
  count: string;
  checked?: boolean;
  onChange?: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group" onClick={onChange}>
      <span
        className={cn(
          'h-[14px] w-[14px] shrink-0 border flex items-center justify-center transition-colors',
          checked ? 'bg-[#1A7A4A] border-[#1A7A4A]' : 'border-white/20 group-hover:border-white/40'
        )}
      >
        {checked && (
          <svg className="h-[9px] w-[9px] text-white" fill="none" viewBox="0 0 12 12" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
          </svg>
        )}
      </span>
      <span className="flex-1 text-[12px] text-white/65 group-hover:text-white/90 transition-colors">{label}</span>
      <span className="font-mono text-[10px] text-white/40">{count}</span>
    </label>
  );
}

// ─── Gate Box ─────────────────────────────────────────────────────────────────

function GateBox({ firms, loading }: { firms: Firm[]; loading: boolean }) {
  const previewFirms = firms.slice(0, 6);
  const count = loading ? '—' : firms.length.toLocaleString();

  return (
    <div>
      {/* Results count header */}
      <div className="flex items-baseline gap-2.5 mb-4">
        <span className="font-serif text-[22px] font-bold text-[#0C1810]">{count}</span>
        <span className="text-[12px] text-[#5A7568]">firms match your filters</span>
      </div>

      {/* Blurred cards + CTA overlay */}
      <div className="relative">
        {/* Blurred firm cards */}
        <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)' }}>
          <div className="flex flex-col gap-[1px]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[56px] bg-white border border-[#CAD8D0] animate-pulse" />
              ))
            ) : previewFirms.length > 0 ? (
              previewFirms.map((firm) => {
                const score = firm.final_score ?? null;
                const scoreColor = score == null ? '#CAD8D0' : score >= 80 ? '#2DBD74' : score >= 50 ? '#F59E0B' : '#EF4444';
                return (
                  <div key={firm.crd} className="grid grid-cols-[56px_1fr_auto_auto] border border-[#CAD8D0] bg-white">
                    <div className="grid place-items-center border-r border-[#CAD8D0]" style={{ height: 56, width: 56 }}>
                      <div className="h-8 w-8 bg-[#F6F8F7] border border-[#CAD8D0] grid place-items-center font-serif text-[13px] font-bold text-[#CAD8D0]">
                        {(firm.display_name || firm.primary_business_name).slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="px-5 py-[14px] min-w-0">
                      <p className="font-serif text-[16px] font-semibold text-[#0C1810] truncate mb-1">
                        {firm.display_name || firm.primary_business_name}
                      </p>
                      <span className="text-[11px] text-[#5A7568]">{firm.main_office_city}, {firm.main_office_state}</span>
                    </div>
                    <div className="px-5 py-[14px] text-right" style={{ minWidth: 100 }}>
                      <p className="font-serif text-[18px] font-bold text-[#0C1810] leading-none mb-1">{formatAUM(firm.aum)}</p>
                      <p className="text-[9px] uppercase tracking-[0.1em] text-[#5A7568]">AUM</p>
                    </div>
                    <div className="px-5 py-[14px] text-center" style={{ minWidth: 80 }}>
                      {score != null ? (
                        <p className="font-serif text-[28px] font-bold leading-none" style={{ color: scoreColor }}>{score}</p>
                      ) : (
                        <p className="text-[11px] text-[#CAD8D0]">N/A</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[56px] bg-white border border-[#CAD8D0]" />
              ))
            )}
          </div>
        </div>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(246,248,247,0) 0%, rgba(246,248,247,0.6) 60%, rgba(246,248,247,0.95) 100%)' }}
        />

        {/* CTA overlay card */}
        <div className="absolute inset-x-0 top-[40px] flex justify-center" style={{ pointerEvents: 'auto' }}>
          <div className="max-w-[480px] w-full border border-white/[0.09] border-t-[2px] border-t-[#1A7A4A] bg-[#0F2538] shadow-[0_8px_48px_rgba(0,0,0,0.5)]" style={{ padding: '36px 40px 32px' }}>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#2DBD74]">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              Unlock Full Results
            </div>

            {/* Headline */}
            <h2 className="font-serif text-[clamp(22px,2.5vw,30px)] font-bold leading-[1.2] tracking-[-0.02em] text-white mb-3">
              See scores, fees, and conflicts for every advisor that matches.
            </h2>

            {/* Subtitle */}
            <p className="text-[13px] text-white/55 leading-[1.7] border-t border-white/[0.06] pt-4 mb-6">
              Search and filter freely. Full profiles with Visor Indexs, fee breakdowns, and regulatory history require an account.
            </p>

            {/* CTAs */}
            <div className="flex gap-3 flex-wrap mb-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center px-7 py-3 bg-[#1A7A4A] hover:bg-[#22995E] text-white text-[13px] font-semibold transition-colors"
              >
                Get Full Access →
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-7 py-3 border border-white/10 text-white/60 hover:border-white/30 hover:text-white text-[13px] transition-all"
              >
                View Pricing
              </Link>
            </div>

            {/* Trust line */}
            <p className="flex items-center gap-2 text-[11px] text-white/40">
              <span className="h-[5px] w-[5px] rounded-full bg-[#2DBD74] shrink-0" />
              Free forever · No credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function GrowthCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-right font-mono text-[#CAD8D0]">—</span>;
  const pct = value.toFixed(1);
  const isPositive = value >= 0;
  return (
    <span className={cn('text-right font-mono', isPositive ? 'text-[#2DBD74]/80' : 'text-[#EF4444]/80')}>
      {isPositive ? '+' : ''}{pct}%
    </span>
  );
}

function getFirstSentence(text: string): string {
  // Match first sentence ending with . ! or ? followed by space or end
  const match = text.match(/^(.+?[.!?])(?:\s|$)/);
  return match ? match[1] : text.slice(0, 200);
}

// ─── Firm Card ────────────────────────────────────────────────────────────────

function FirmCard({
  firm,
  isSelected,
  cardRef,
  index = 0,
}: {
  firm: Firm;
  isSelected?: boolean;
  cardRef?: React.RefObject<HTMLDivElement>;
  index?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = firm.final_score ?? null;
  const scoreColor =
    score == null ? '#CAD8D0' : score >= 80 ? '#2DBD74' : score >= 50 ? '#F59E0B' : '#EF4444';
  const isFeatured = score != null && score >= 80;
  const description = firm.specialty_strategies || firm.investment_philosophy || null;
  const firmName = firm.display_name || firm.primary_business_name;

  // Computed values for expanded panel
  const aboutText = firm.business_profile || firm.investment_philosophy || firm.firm_character || null;
  const aboutSnippet = aboutText ? getFirstSentence(aboutText) : null;

  const totalClients = getTotalClients(firm);
  const avgClientSize = getAvgClientSize(firm);
  const clientsPerAdvisor = getClientsPerAdvisor(firm);
  const minAccountVal = parseMinAccount(firm.minimum_account_size);
  const formattedMinAccount = minAccountVal ? formatAUM(minAccountVal) : null;

  const hasGrowthData = firm.aum_1yr_growth_annualized != null || firm.aum_5yr_growth_annualized != null ||
    firm.clients_1yr_growth_annualized != null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking a link or the More button
    if ((e.target as HTMLElement).closest('a[href]')) return;
    if ((e.target as HTMLElement).closest('[data-more-btn]')) return;
    window.location.href = `/firm/${firm.crd}`;
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => !prev);
  };

  const scoreBreakdown = [
    { label: 'Fee Competitiveness', value: firm.fee_competitiveness_score ?? null },
    { label: 'Fee Transparency', value: firm.fee_transparency_score ?? null },
    { label: 'Conflict Exposure', value: firm.conflict_free_score ?? null },
    { label: 'AUM Growth', value: firm.aum_growth_score ?? null },
  ];

  return (
    <div
      ref={cardRef}
      className="search-card-stagger relative"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Green accent bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[2px] z-10 origin-top transition-transform duration-300 bg-[#2DBD74]',
        )}
        style={{ transform: (isFeatured || expanded) ? 'scaleY(1)' : 'scaleY(0)' }}
      />

      <div
        onClick={handleCardClick}
        className={cn(
          'transition-all duration-200 cursor-pointer border bg-white',
          'hover:border-[#1A7A4A]/30',
          expanded ? 'border-[rgba(45,189,116,0.3)] bg-[rgba(45,189,116,0.04)]' : '',
          isFeatured && !expanded ? 'border-[rgba(45,189,116,0.2)]' : '',
          !isFeatured && !expanded ? 'border-[#CAD8D0]' : '',
          isSelected && 'border-[rgba(45,189,116,0.5)] bg-[rgba(45,189,116,0.04)]'
        )}
      >
        {/* Desktop list layout */}
        <div className="hidden md:grid grid-cols-[56px_1fr_90px_90px_90px_100px_90px]" style={{ minHeight: 80 }}>
          {/* Logo column */}
          <div className="grid place-items-center border-r border-[#CAD8D0]/50" style={{ width: 56 }}>
            {firm.logo_key ? (
              <FirmLogo logoKey={firm.logo_key} firmName={firmName} size="sm" />
            ) : (
              (() => { const c = getAvatarColor(firmName); return (
                <div className="h-10 w-10 rounded-full grid place-items-center font-serif text-[13px] font-bold" style={{ backgroundColor: c.bg, color: c.text }}>
                  {firmName.slice(0, 2).toUpperCase()}
                </div>
              ); })()
            )}
          </div>

          {/* Main info column */}
          <div className="px-5 py-[12px] border-r border-[#CAD8D0]/50 min-w-0">
            <p className="font-serif text-[16px] font-semibold text-[#0C1810] truncate mb-0.5">{firmName}</p>
            <span className="text-[11px] text-[#5A7568] block mb-0.5">{firm.main_office_city}, {firm.main_office_state}</span>
            {(firm.services_financial_planning === 'Y' || firm.services_mgr_selection === 'Y') && (
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] px-[7px] py-[2px] border border-[#CAD8D0] text-[#5A7568] inline-block mb-0.5">
                {firm.services_financial_planning === 'Y' ? 'Fee-only · RIA' : 'RIA'}
              </span>
            )}
            {description && <p className="text-[11px] text-[#5A7568]/80 truncate max-w-[340px]">{description}</p>}
            <button
              data-more-btn
              onClick={handleMoreClick}
              className="text-[10px] font-semibold text-[#5A7568] hover:text-[#0C1810] transition-colors mt-0.5"
            >
              {expanded ? '▾ Less' : '▸ More'}
            </button>
          </div>

          {/* AUM */}
          <div className="border-r border-[#CAD8D0]/50 flex flex-col items-center justify-center">
            <p className="font-serif text-[24px] font-bold text-[#0C1810] leading-none tracking-[-0.02em] mb-0.5"><FormatAUMDisplay value={firm.aum} /></p>
            <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">AUM</p>
          </div>

          {/* Min. Account */}
          <div className="border-r border-[#CAD8D0]/50 flex flex-col items-center justify-center">
            {formattedMinAccount
              ? <p className="font-serif text-[24px] font-bold text-[#0C1810] leading-none tracking-[-0.02em] mb-0.5"><FormatAUMDisplay value={minAccountVal} /></p>
              : <div className="mb-0.5"><p className="text-[10px] text-[#CAD8D0] leading-tight text-center">None</p></div>
            }
            <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">Min. Acct</p>
          </div>

          {/* Avg. Account Size */}
          <div className="border-r border-[#CAD8D0]/50 flex flex-col items-center justify-center">
            <p className="font-serif text-[24px] font-bold text-[#0C1810] leading-none tracking-[-0.02em] mb-0.5"><FormatAUMDisplay value={avgClientSize} /></p>
            <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">Avg. Acct</p>
          </div>

          {/* Clients / Advisor */}
          <div className="border-r border-[#CAD8D0]/50 flex flex-col items-center justify-center">
            <p className="font-serif text-[24px] font-bold text-[#0C1810] leading-none tracking-[-0.02em] mb-0.5">
              {clientsPerAdvisor != null ? Math.round(clientsPerAdvisor) : '—'}
            </p>
            <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">Clients/Inv Pro</p>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center justify-center">
            {score != null ? (
              <>
                <p className="font-serif text-[24px] font-bold leading-none tracking-[-0.02em] mb-0.5" style={{ color: scoreColor }}>{score}</p>
                <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">Score</p>
                <div className="h-[2px] bg-[#CAD8D0] mt-1.5 w-12">
                  <div className="h-full transition-[width] duration-500" style={{ width: `${score}%`, background: scoreColor }} />
                </div>
              </>
            ) : (
              <p className="text-[11px] text-[#CAD8D0]">N/A</p>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden p-4">
          {/* Top: logo + name + location + tags */}
          <div className="flex items-center gap-3 mb-3">
            <div className="shrink-0">
              {firm.logo_key ? (
                <FirmLogo logoKey={firm.logo_key} firmName={firmName} size="sm" />
              ) : (
                (() => { const c = getAvatarColor(firmName); return (
                  <div className="h-10 w-10 rounded-full grid place-items-center font-serif text-[13px] font-bold" style={{ backgroundColor: c.bg, color: c.text }}>
                    {firmName.slice(0, 2).toUpperCase()}
                  </div>
                ); })()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[15px] font-semibold text-[#0C1810] truncate">{firmName}</p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#5A7568]">{firm.main_office_city}, {firm.main_office_state}</span>
                {firm.services_financial_planning === 'Y' && (
                  <span className="text-[9px] font-semibold uppercase tracking-[0.1em] px-[5px] py-[1px] border border-[#CAD8D0] text-[#5A7568]">Fee-only</span>
                )}
              </div>
            </div>
          </div>
          {description && <p className="text-[11px] text-[#5A7568]/80 truncate mb-1">{description}</p>}
          <button
            data-more-btn
            onClick={handleMoreClick}
            className="text-[10px] font-semibold text-[#5A7568] hover:text-[#0C1810] transition-colors mb-3"
          >
            {expanded ? '▾ Less' : '▸ More'}
          </button>
          {/* Data grid: 5 columns matching firm profile order */}
          <div className="grid grid-cols-5 gap-x-1 border-t border-[#CAD8D0] pt-3">
            <div className="flex flex-col items-center">
              <p className="font-serif text-[18px] font-bold text-[#0C1810] leading-none tracking-[-0.02em] mb-0.5"><FormatAUMDisplay value={firm.aum} /></p>
              <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">AUM</p>
            </div>
            <div className="flex flex-col items-center">
              {formattedMinAccount
                ? <p className="font-serif text-[18px] font-bold text-[#0C1810] leading-none tracking-[-0.02em] mb-0.5"><FormatAUMDisplay value={minAccountVal} /></p>
                : <div className="mb-0.5"><p className="text-[9px] text-[#CAD8D0] leading-tight text-center">None</p></div>
              }
              <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">Min. Acct</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-serif text-[18px] font-bold text-[#0C1810] leading-none tracking-[-0.02em] mb-0.5"><FormatAUMDisplay value={avgClientSize} /></p>
              <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">Avg. Acct</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-serif text-[18px] font-bold text-[#0C1810] leading-none tracking-[-0.02em] mb-0.5">
                {clientsPerAdvisor != null ? Math.round(clientsPerAdvisor) : '—'}
              </p>
              <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">Clients/Inv Pro</p>
            </div>
            <div className="flex flex-col items-center">
              {score != null ? (
                <>
                  <p className="font-serif text-[18px] font-bold leading-none tracking-[-0.02em] mb-0.5" style={{ color: scoreColor }}>{score}</p>
                  <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">Score</p>
                  <div className="h-[2px] bg-[#CAD8D0] mt-1 w-10">
                    <div className="h-full" style={{ width: `${score}%`, background: scoreColor }} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-[#CAD8D0] mb-0.5">N/A</p>
                  <p className="text-[7px] uppercase tracking-[0.12em] text-[#5A7568]">Score</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Expanded detail panel ── */}
        {expanded && (
          <div className="border-t border-[#CAD8D0] px-6 py-5 animate-[cardFadeIn_0.2s_ease-out]">
            {/* About — first sentence */}
            {aboutSnippet && (
              <p className="text-[12px] leading-[1.7] text-[#5A7568] mb-5">{aboutSnippet}</p>
            )}

            <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
              {/* Left: Firm Details */}
              <div>
                <h4 className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5A7568] mb-3">Firm Details</h4>
                <div className="flex flex-col gap-2">
                  {avgClientSize != null && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#5A7568]">Avg. Client Size</span>
                      <span className="font-mono text-[#2E4438]">{formatAUM(avgClientSize)}</span>
                    </div>
                  )}
                  {firm.minimum_account_size && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#5A7568]">Minimum Account Size</span>
                      <span className="font-mono text-[#2E4438]">
                        {(() => {
                          const val = parseFloat(firm.minimum_account_size.replace(/[^0-9.]/g, ''));
                          return isNaN(val) ? firm.minimum_account_size : formatAUM(val);
                        })()}
                      </span>
                    </div>
                  )}
                  {firm.employee_total != null && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#5A7568]">Total Employees</span>
                      <span className="font-mono text-[#2E4438]">{firm.employee_total.toLocaleString()}</span>
                    </div>
                  )}
                  {firm.employee_investment != null && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#5A7568]">Investment Professionals</span>
                      <span className="font-mono text-[#2E4438]">{firm.employee_investment.toLocaleString()}</span>
                    </div>
                  )}
                  {firm.website && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#5A7568]">Website</span>
                      <a
                        href={firm.website.startsWith('http') ? firm.website : `https://${firm.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[#1A7A4A] hover:text-[#2DBD74] transition-colors truncate max-w-[200px]"
                        onClick={e => e.stopPropagation()}
                      >
                        {firm.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Growth Rates */}
              <div>
                {hasGrowthData && (
                  <>
                    <h4 className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5A7568] mb-3">Growth</h4>
                    <div className="grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1.5 text-[11px]">
                      {/* Header row */}
                      <span />
                      <span className="text-[8px] uppercase tracking-[0.12em] text-[#5A7568] text-right">AUM</span>
                      <span className="text-[8px] uppercase tracking-[0.12em] text-[#5A7568] text-right">Clients</span>

                      {/* 1 Yr row */}
                      <span className="text-[#5A7568]">1 Yr</span>
                      <GrowthCell value={firm.aum_1yr_growth_annualized} />
                      <GrowthCell value={firm.clients_1yr_growth_annualized} />

                      {/* 5 Yr row */}
                      <span className="text-[#5A7568]">5 Yr</span>
                      <GrowthCell value={firm.aum_5yr_growth_annualized} />
                      <GrowthCell value={firm.clients_5yr_growth_annualized} />

                      {/* 10 Yr row */}
                      <span className="text-[#5A7568]">10 Yr</span>
                      <GrowthCell value={firm.aum_10yr_growth_annualized} />
                      <GrowthCell value={firm.clients_10yr_growth_annualized} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 border-t border-[#CAD8D0] pt-4 mt-5">
              <Link
                href={`/firm/${firm.crd}`}
                className="text-[11px] font-semibold text-[#0C1810] border border-[#CAD8D0] px-4 py-2 hover:border-[#1A7A4A]/30 hover:text-[#0C1810] transition-all"
                onClick={e => e.stopPropagation()}
              >
                View Full Profile →
              </Link>
              <Link
                href={`/compare?crds=${firm.crd}`}
                className="text-[11px] font-semibold text-[#1A7A4A] hover:text-[#2DBD74] transition-colors"
                onClick={e => e.stopPropagation()}
              >
                + Add to Compare
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div>
      {/* Branded circular loading indicator + logo */}
      <div className="flex items-center justify-center gap-5 pt-12 pb-8">
        {/* Spinning score ring */}
        <div className="relative h-[72px] w-[72px] shrink-0">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#0A1C2A" strokeWidth="3" opacity="0.12" />
          </svg>
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 100 100"
            style={{ animation: 'scoreRingSpin 1.4s linear infinite' }}
          >
            <circle cx="50" cy="50" r="42" fill="none" stroke="#2DBD74" strokeWidth="3" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="165" />
          </svg>
        </div>
        {/* Logo + loading text */}
        <div className="flex flex-col">
          <span className="font-serif text-[24px] font-bold italic tracking-[0.02em] text-[#0A1C2A]">
            VISOR<span className="ml-[0.12em] text-[#2DBD74]">INDEX</span>
          </span>
          <span className="text-[11px] text-[#5A7568] tracking-[0.08em] mt-0.5">
            Loading advisors
          </span>
        </div>
        <style suppressHydrationWarning>{`
          @keyframes scoreRingSpin {
            0% { transform: rotate(-90deg); }
            100% { transform: rotate(270deg); }
          }
        `}</style>
      </div>

      {/* Skeleton cards */}
      <div className="flex flex-col gap-[1px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-[#CAD8D0] animate-pulse"
            style={{ opacity: 1 - i * 0.12 }}
          >
            <div className="hidden md:grid grid-cols-[56px_1fr_auto_auto] h-[56px]">
              {/* Logo placeholder */}
              <div className="grid place-items-center border-r border-[#CAD8D0]/50">
                <div className="h-8 w-8 bg-[#CAD8D0]/30" />
              </div>
              {/* Name + location placeholder */}
              <div className="px-5 py-3 border-r border-[#CAD8D0]/50">
                <div className="h-4 w-48 bg-[#CAD8D0]/30 mb-2" />
                <div className="h-3 w-28 bg-[#CAD8D0]/20" />
              </div>
              {/* AUM placeholder */}
              <div className="px-5 py-3 border-r border-[#CAD8D0]/50" style={{ minWidth: 110 }}>
                <div className="h-5 w-14 bg-[#CAD8D0]/30 mb-1 ml-auto" />
                <div className="h-2 w-8 bg-[#CAD8D0]/20 ml-auto" />
              </div>
              {/* Score placeholder */}
              <div className="px-5 py-2.5 flex items-center justify-center" style={{ minWidth: 90 }}>
                <div className="h-7 w-7 rounded-full bg-[#CAD8D0]/25" />
              </div>
            </div>
            {/* Mobile placeholder */}
            <div className="md:hidden h-[72px] p-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 bg-[#CAD8D0]/30 shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-[#CAD8D0]/30 mb-2" />
                  <div className="h-3 w-24 bg-[#CAD8D0]/20" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Search Page ──────────────────────────────────────────────────────────────

export default function SearchPage() {
  const searchParams = useSearchParams();
  // ── Protected state (do not remove) ──
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const f = { ...DEFAULT_FILTERS };
    // Geo location
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    if (city && state) {
      const cities = getUSCities();
      const match = cities.find(c => c.city.toLowerCase() === city.toLowerCase() && c.state.toLowerCase() === state.toLowerCase());
      if (match) {
        f.geoLocation = { city: match.city, state: match.state, lat: match.lat, lng: match.lng };
        f.geoRadius = Number(searchParams.get('radius')) || 10;
      }
    }
    // Simple string/number filters
    if (searchParams.get('score')) f.minVisorScore = Number(searchParams.get('score'));
    if (searchParams.get('feeComp')) f.minFeeCompetitiveness = Number(searchParams.get('feeComp'));
    if (searchParams.get('aum')) f.minAUM = searchParams.get('aum')!;
    if (searchParams.get('minAcct')) f.minAccountSize = searchParams.get('minAcct')!;
    if (searchParams.get('aumGrowth')) f.minAUMGrowth = searchParams.get('aumGrowth')!;
    if (searchParams.get('clientGrowth')) f.minClientGrowth = searchParams.get('clientGrowth')!;
    if (searchParams.get('avgSize')) f.avgClientSizeMin = searchParams.get('avgSize')!;
    if (searchParams.get('totalClients')) f.totalClientsMin = searchParams.get('totalClients')!;
    if (searchParams.get('aumPerAdvisor')) f.aumPerAdvisorMin = searchParams.get('aumPerAdvisor')!;
    if (searchParams.get('clientsPerAdvisor')) f.clientsPerAdvisorMin = searchParams.get('clientsPerAdvisor')!;
    // Set-based filters
    if (searchParams.get('fee')) f.feeStructure = new Set(searchParams.get('fee')!.split(',') as FeeStructureFilter[]);
    if (searchParams.get('type')) f.firmType = new Set(searchParams.get('type')!.split(',') as FirmTypeFilter[]);
    if (searchParams.get('client')) f.clientType = new Set(searchParams.get('client')!.split(',') as ClientTypeFilter[]);
    if (searchParams.get('alts') === '1') f.hasAlternatives = true;
    if (searchParams.get('tag')) f.tags = new Set(searchParams.get('tag')!.split(','));
    return f;
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const selectedRef = useRef<HTMLDivElement>(null);

  // ── Sync filters to URL (shallow, no navigation) ──
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.geoLocation) {
      params.set('city', filters.geoLocation.city);
      params.set('state', filters.geoLocation.state);
      if (filters.geoRadius !== 10) params.set('radius', String(filters.geoRadius));
    }
    if (filters.minVisorScore > 0) params.set('score', String(filters.minVisorScore));
    if (filters.minFeeCompetitiveness > 0) params.set('feeComp', String(filters.minFeeCompetitiveness));
    if (filters.minAUM) params.set('aum', filters.minAUM);
    if (filters.minAccountSize) params.set('minAcct', filters.minAccountSize);
    if (filters.minAUMGrowth) params.set('aumGrowth', filters.minAUMGrowth);
    if (filters.minClientGrowth) params.set('clientGrowth', filters.minClientGrowth);
    if (filters.avgClientSizeMin) params.set('avgSize', filters.avgClientSizeMin);
    if (filters.totalClientsMin) params.set('totalClients', filters.totalClientsMin);
    if (filters.aumPerAdvisorMin) params.set('aumPerAdvisor', filters.aumPerAdvisorMin);
    if (filters.clientsPerAdvisorMin) params.set('clientsPerAdvisor', filters.clientsPerAdvisorMin);
    if (filters.feeStructure.size > 0) params.set('fee', [...filters.feeStructure].join(','));
    if (filters.firmType.size > 0) params.set('type', [...filters.firmType].join(','));
    if (filters.clientType.size > 0) params.set('client', [...filters.clientType].join(','));
    if (filters.hasAlternatives) params.set('alts', '1');
    if (filters.tags.size > 0) params.set('tag', [...filters.tags].join(','));
    if (searchQuery) params.set('q', searchQuery);
    const qs = params.toString();
    const newUrl = qs ? `/search?${qs}` : '/search';
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [filters, searchQuery]);

  // ── Presentation state ──
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [sortBy, setSortBy] = useState('score');
  // Revert from proximity sort when geo filter is cleared
  useEffect(() => {
    if (!filters.geoLocation && sortBy === 'proximity') setSortBy('score');
  }, [filters.geoLocation, sortBy]);
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Auth session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Auto-scroll selected card into view (protected)
  useEffect(() => {
    if (selectedIndex >= 0 && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedIndex]);

  // Fetch all firms from Supabase (full dataset — filtering is client-side)
  const fetchFirms = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      let queryBuilder = supabase
        .from('firmdata_current')
        .select(`
          crd,
          primary_business_name,
          main_office_city,
          main_office_state,
          main_office_zip,
          aum,
          employee_total,
          employee_investment,
          number_of_offices,
          services_financial_planning,
          services_mgr_selection,
          services_pension_consulting,
          client_hnw_number,
          client_non_hnw_number,
          client_pension_number,
          client_charitable_number,
          client_corporations_number,
          client_pooled_vehicles_number,
          client_other_number,
          client_banks_number,
          client_bdc_number,
          client_govt_number,
          client_insurance_number,
          client_investment_cos_number,
          client_other_advisors_number,
          client_swf_number,
          asset_allocation_private_equity_direct
        `);

      if (query && query.length > 0) {
        queryBuilder = queryBuilder.ilike('primary_business_name', `%${query}%`);
      }

      // Paginate through all results (Supabase caps at 1000 per request)
      const PAGE_SIZE = 1000;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let allBaseFirms: any[] = [];
      let pageNum = 0;
      let hasMore = true;

      while (hasMore) {
        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data: baseFirmsPage, error: baseError } = await queryBuilder.range(from, to);

        if (baseError) {
          console.error('Error fetching firms:', baseError);
          setError(baseError.message);
          setFirms([]);
          setLoading(false);
          return;
        }

        if (!baseFirmsPage || baseFirmsPage.length === 0) {
          hasMore = false;
        } else {
          allBaseFirms = [...allBaseFirms, ...baseFirmsPage];
          hasMore = baseFirmsPage.length === PAGE_SIZE;
          pageNum++;
        }
      }

      const baseFirms = allBaseFirms;

      if (baseFirms.length === 0) {
        setFirms([]);
        setLoading(false);
        return;
      }

      const crds = baseFirms.map((f: { crd: number }) => f.crd);

      // Batch CRDs into chunks of 500 to avoid Supabase .in() limits
      const CHUNK = 500;
      const crdChunks: number[][] = [];
      for (let i = 0; i < crds.length; i += CHUNK) {
        crdChunks.push(crds.slice(i, i + CHUNK));
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fetchChunked = async (table: string, select: string, extraFilter?: (q: any) => any) => {
        const results = await Promise.all(
          crdChunks.map(chunk => {
            let q = supabase.from(table).select(select).in('crd', chunk);
            if (extraFilter) q = extraFilter(q);
            return q;
          })
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return results.flatMap(r => (r.data || []) as any[]);
      };

      const [profileData, feeData, nameData, logoData, scoreData, websiteData, feesAndMinsData, growthRankData, tagsData] = await Promise.all([
        fetchChunked('firmdata_profile_text', 'crd, client_base, wealth_tier, investment_philosophy, firm_character, specialty_strategies, business_profile'),
        fetchChunked('firmdata_feetiers', 'crd, min_aum'),
        fetchChunked('firm_names', 'crd, display_name'),
        fetchChunked('firm_logos', 'crd, logo_key', q => q.eq('has_logo', true)),
        fetchChunked('firm_scores', 'crd, final_score, stars, fee_competitiveness_score, conflict_free_score, aum_growth_score, fee_transparency_score'),
        fetchChunked('firmdata_website', 'crd, website'),
        fetchChunked('firmdata_feesandmins', 'crd, minimum_account_size, fee_structure_type'),
        fetchChunked('firmdata_growth_rate_rankings', 'crd, aum_1y_growth_annualized, aum_5y_growth_annualized, aum_10y_growth_annualized, clients_1y_growth_annualized, clients_5y_growth_annualized, clients_10y_growth_annualized'),
        fetchChunked('firmdata_manual', 'crd, tag_1, tag_2, tag_3'),
      ]);

      const profileMap = new Map(profileData.map(p => [p.crd, p]));
      const feeMap = new Map(feeData.map(f => [f.crd, f]));
      const nameMap = new Map(nameData.map(n => [n.crd, n.display_name]));
      const logoMap = new Map(logoData.map(l => [l.crd, l.logo_key]));
      const scoreMap = new Map(scoreData.map(s => [s.crd, s]));
      const websiteMap = new Map(websiteData.map(w => [w.crd, w.website]));
      const feesAndMinsMap = new Map(feesAndMinsData.map(f => [f.crd, f]));
      const growthRankMap = new Map(growthRankData.map(g => [g.crd, g]));
      const tagsMap = new Map(tagsData.map(t => [t.crd, t]));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mergedFirms: Firm[] = baseFirms.map((firm: any) => ({
        ...firm,
        display_name: nameMap.get(firm.crd as number) || null,
        logo_key: logoMap.get(firm.crd as number) || null,
        client_base: profileMap.get(firm.crd as number)?.client_base || null,
        wealth_tier: profileMap.get(firm.crd as number)?.wealth_tier || null,
        investment_philosophy: profileMap.get(firm.crd as number)?.investment_philosophy || null,
        firm_character: profileMap.get(firm.crd as number)?.firm_character || null,
        specialty_strategies: profileMap.get(firm.crd as number)?.specialty_strategies || null,
        business_profile: profileMap.get(firm.crd as number)?.business_profile || null,
        min_fee: feeMap.get(firm.crd as number)?.min_aum ? parseFloat(feeMap.get(firm.crd as number)!.min_aum) : null,
        minimum_account_size: feesAndMinsMap.get(firm.crd as number)?.minimum_account_size || null,
        fee_structure_type: feesAndMinsMap.get(firm.crd as number)?.fee_structure_type || null,
        website: websiteMap.get(firm.crd as number) || null,
        final_score: scoreMap.get(firm.crd as number)?.final_score ?? null,
        stars: scoreMap.get(firm.crd as number)?.stars ?? null,
        fee_competitiveness_score: scoreMap.get(firm.crd as number)?.fee_competitiveness_score ?? null,
        conflict_free_score: scoreMap.get(firm.crd as number)?.conflict_free_score ?? null,
        aum_growth_score: scoreMap.get(firm.crd as number)?.aum_growth_score ?? null,
        fee_transparency_score: scoreMap.get(firm.crd as number)?.fee_transparency_score ?? null,
        aum_1yr_growth_annualized: growthRankMap.get(firm.crd as number)?.aum_1y_growth_annualized != null ? parseFloat(growthRankMap.get(firm.crd as number)!.aum_1y_growth_annualized) : null,
        aum_5yr_growth_annualized: growthRankMap.get(firm.crd as number)?.aum_5y_growth_annualized != null ? parseFloat(growthRankMap.get(firm.crd as number)!.aum_5y_growth_annualized) : null,
        aum_10yr_growth_annualized: growthRankMap.get(firm.crd as number)?.aum_10y_growth_annualized != null ? parseFloat(growthRankMap.get(firm.crd as number)!.aum_10y_growth_annualized) : null,
        clients_1yr_growth_annualized: growthRankMap.get(firm.crd as number)?.clients_1y_growth_annualized != null ? parseFloat(growthRankMap.get(firm.crd as number)!.clients_1y_growth_annualized) : null,
        clients_5yr_growth_annualized: growthRankMap.get(firm.crd as number)?.clients_5y_growth_annualized != null ? parseFloat(growthRankMap.get(firm.crd as number)!.clients_5y_growth_annualized) : null,
        clients_10yr_growth_annualized: growthRankMap.get(firm.crd as number)?.clients_10y_growth_annualized != null ? parseFloat(growthRankMap.get(firm.crd as number)!.clients_10y_growth_annualized) : null,
        tag_1: tagsMap.get(firm.crd as number)?.tag_1 || null,
        tag_2: tagsMap.get(firm.crd as number)?.tag_2 || null,
        tag_3: tagsMap.get(firm.crd as number)?.tag_3 || null,
      }));

      setFirms(mergedFirms);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch firms');
    }

    setLoading(false);
  }, []);

  // Initial load (protected)
  useEffect(() => {
    fetchFirms('');
  }, [fetchFirms]);

  // Handle search submit (protected)
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchFirms(searchQuery);
  };

  // Handle filter changes (all client-side now)
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  // Handle clear filters (protected)
  const handleClearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setSearchQuery('');
    fetchFirms('');
  };

  // ── Pre-compute firm coordinates from ZIP codes ──
  const firmCoords = useMemo(() => {
    const coords = new Map<number, { lat: number; lng: number }>();
    for (const f of firms) {
      if (f.main_office_zip) {
        const c = zipToCoords(f.main_office_zip);
        if (c) coords.set(f.crd, c);
      }
    }
    return coords;
  }, [firms]);

  // ── Presentation: filtered + sorted list ──
  const visibleFirms = useMemo(() => {
    setCurrentPage(1);
    let result = [...firms];

    // ── Geographic Radius ──
    if (filters.geoLocation) {
      if (filters.geoRadius === 0) {
        // "Any" radius — keep all firms that have coordinates
        result = result.filter(f => firmCoords.has(f.crd));
      } else {
        const { lat: cLat, lng: cLng } = filters.geoLocation;
        const maxDist = filters.geoRadius;
        result = result.filter(f => {
          const coords = firmCoords.get(f.crd);
          if (!coords) return false;
          return haversineDistance(cLat, cLng, coords.lat, coords.lng) <= maxDist;
        });
      }
    }

    // ── Visor Index ──
    if (filters.minVisorScore > 0) {
      result = result.filter(f => f.final_score != null && f.final_score >= filters.minVisorScore);
    }

    // ── Fee Competitiveness ──
    if (filters.minFeeCompetitiveness > 0) {
      result = result.filter(f => (f.fee_competitiveness_score ?? 0) >= filters.minFeeCompetitiveness);
    }

    // ── Fee Structure ──
    if (filters.feeStructure.size > 0) {
      result = result.filter(f => {
        if (!f.fee_structure_type) return false;
        const fst = f.fee_structure_type;
        for (const ft of Array.from(filters.feeStructure)) {
          if (ft === 'capped' && (fst === 'capped' || fst === 'maximum_only')) return true;
          if (ft === fst) return true;
        }
        return false;
      });
    }

    // ── Firm AUM ──
    if (filters.minAUM) {
      switch (filters.minAUM) {
        case 'under100m': result = result.filter(f => f.aum != null && f.aum < 100000000); break;
        case '100000000': result = result.filter(f => f.aum != null && f.aum >= 100000000 && f.aum < 500000000); break;
        case '500000000': result = result.filter(f => f.aum != null && f.aum >= 500000000 && f.aum < 2000000000); break;
        case '2000000000': result = result.filter(f => f.aum != null && f.aum >= 2000000000); break;
      }
    }

    // ── Investment Minimum (uses minimum_account_size from firmdata_feesandmins) ──
    if (filters.minAccountSize) {
      result = result.filter(f => {
        const minAcct = f.minimum_account_size ? parseFloat(f.minimum_account_size) : null;
        switch (filters.minAccountSize) {
          case '0': return minAcct === null || minAcct === 0;
          case 'under250k': return minAcct != null && minAcct > 0 && minAcct < 250000;
          case '250000': return minAcct != null && minAcct >= 250000 && minAcct < 1000000;
          case '1000000': return minAcct != null && minAcct >= 1000000;
          default: return true;
        }
      });
    }

    // ── AUM Growth (1yr) ──
    if (filters.minAUMGrowth) {
      const threshold = parseFloat(filters.minAUMGrowth);
      result = result.filter(f => (f.aum_1yr_growth_annualized ?? -999) >= threshold);
    }

    // ── Client Growth (1yr) ──
    if (filters.minClientGrowth) {
      const threshold = parseFloat(filters.minClientGrowth);
      result = result.filter(f => (f.clients_1yr_growth_annualized ?? -999) >= threshold);
    }

    // ── Average Client Size ──
    if (filters.avgClientSizeMin) {
      result = result.filter(f => {
        const avg = getAvgClientSize(f);
        if (avg == null) return false;
        switch (filters.avgClientSizeMin) {
          case 'under1m': return avg < 1000000;
          case '1m_5m': return avg >= 1000000 && avg < 5000000;
          case '5m_25m': return avg >= 5000000 && avg < 25000000;
          case '25m_plus': return avg >= 25000000;
          default: return true;
        }
      });
    }

    // ── Total Clients ──
    if (filters.totalClientsMin) {
      result = result.filter(f => {
        const total = getTotalClients(f);
        switch (filters.totalClientsMin) {
          case 'under100': return total > 0 && total < 100;
          case '100_500': return total >= 100 && total < 500;
          case '500_2000': return total >= 500 && total < 2000;
          case '2000_plus': return total >= 2000;
          default: return true;
        }
      });
    }

    // ── AUM per Advisor ──
    if (filters.aumPerAdvisorMin) {
      result = result.filter(f => {
        const ratio = getAUMPerAdvisor(f);
        if (ratio == null) return false;
        switch (filters.aumPerAdvisorMin) {
          case 'under100m': return ratio < 100000000;
          case '100m_500m': return ratio >= 100000000 && ratio < 500000000;
          case '500m_plus': return ratio >= 500000000;
          default: return true;
        }
      });
    }

    // ── Clients per Advisor ──
    if (filters.clientsPerAdvisorMin) {
      result = result.filter(f => {
        const ratio = getClientsPerAdvisor(f);
        if (ratio == null) return false;
        switch (filters.clientsPerAdvisorMin) {
          case 'under25': return ratio < 25;
          case '25_75': return ratio >= 25 && ratio < 75;
          case '75_150': return ratio >= 75 && ratio < 150;
          case '150_plus': return ratio >= 150;
          default: return true;
        }
      });
    }

    // ── Client Type ──
    if (filters.clientType.size > 0) {
      result = result.filter(f => {
        for (const ct of Array.from(filters.clientType)) {
          switch (ct) {
            case 'hnw': if ((f.client_hnw_number ?? 0) > 0) return true; break;
            case 'non_hnw': if ((f.client_non_hnw_number ?? 0) > 0) return true; break;
            case 'pension': if ((f.client_pension_number ?? 0) > 0) return true; break;
            case 'charitable': if ((f.client_charitable_number ?? 0) > 0) return true; break;
            case 'corporations': if ((f.client_corporations_number ?? 0) > 0) return true; break;
            case 'pooled_vehicles': if ((f.client_pooled_vehicles_number ?? 0) > 0) return true; break;
            case 'banks': if ((f.client_banks_number ?? 0) > 0) return true; break;
            case 'govt': if ((f.client_govt_number ?? 0) > 0) return true; break;
            case 'insurance': if ((f.client_insurance_number ?? 0) > 0) return true; break;
          }
        }
        return false;
      });
    }

    // ── Firm Type ──
    if (filters.firmType.size > 0) {
      result = result.filter(f => {
        const character = (f.firm_character || '').toLowerCase();
        const profile = (f.business_profile || '').toLowerCase();
        const combined = character + ' ' + profile;
        for (const ft of Array.from(filters.firmType)) {
          if (ft === 'ria' && (combined.includes('ria') || combined.includes('registered investment'))) return true;
          if (ft === 'multi_family_office' && (combined.includes('family office') || combined.includes('multi-family'))) return true;
          if (ft === 'ocio' && (combined.includes('ocio') || combined.includes('outsourced chief investment'))) return true;
          if (ft === 'bank_affiliated' && (combined.includes('bank') || combined.includes('trust company'))) return true;
        }
        return false;
      });
    }

    // ── Conflict Screening ──
    if (filters.conflictScreening.size > 0) {
      if (filters.conflictScreening.has('no_referral')) {
        result = result.filter(f => (f.conflict_free_score ?? 0) >= 80);
      }
    }

    // ── Alternatives ──
    if (filters.hasAlternatives) {
      result = result.filter(f => (f.asset_allocation_private_equity_direct ?? 0) > 0);
    }

    // ── Tags ──
    if (filters.tags.size > 0) {
      result = result.filter(f => {
        // Match against tag_1/tag_2/tag_3 (exact match)
        const firmTags = [f.tag_1, f.tag_2, f.tag_3].filter(Boolean) as string[];
        if (firmTags.some(t => filters.tags.has(t))) return true;
        // Match against profile text fields (slug match)
        const profileText = [f.specialty_strategies, f.client_base, f.wealth_tier]
          .filter(Boolean)
          .join(',')
          .split(',')
          .map(t => t.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, ''));
        return profileText.some(slug => filters.tags.has(slug));
      });
    }

    // ── Sort ──
    if (sortBy === 'proximity' && filters.geoLocation) {
      const { lat: cLat, lng: cLng } = filters.geoLocation;
      result.sort((a, b) => {
        const ca = firmCoords.get(a.crd);
        const cb = firmCoords.get(b.crd);
        const da = ca ? haversineDistance(cLat, cLng, ca.lat, ca.lng) : Infinity;
        const db = cb ? haversineDistance(cLat, cLng, cb.lat, cb.lng) : Infinity;
        return da - db;
      });
    } else if (sortBy === 'score') result.sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0));
    else if (sortBy === 'score_asc') result.sort((a, b) => (a.final_score ?? 0) - (b.final_score ?? 0));
    else if (sortBy === 'aum_high') result.sort((a, b) => (b.aum ?? 0) - (a.aum ?? 0));
    else if (sortBy === 'aum_low') result.sort((a, b) => (a.aum ?? 0) - (b.aum ?? 0));
    else if (sortBy === 'avg_high') result.sort((a, b) => (getAvgClientSize(b) ?? 0) - (getAvgClientSize(a) ?? 0));
    else if (sortBy === 'avg_low') result.sort((a, b) => (getAvgClientSize(a) ?? 0) - (getAvgClientSize(b) ?? 0));
    else if (sortBy === 'min_high') result.sort((a, b) => {
      const av = parseMinAccount(a.minimum_account_size);
      const bv = parseMinAccount(b.minimum_account_size);
      if ((av !== null) !== (bv !== null)) return av !== null ? -1 : 1;
      return (bv ?? 0) - (av ?? 0);
    });
    else if (sortBy === 'min_low') result.sort((a, b) => {
      const av = parseMinAccount(a.minimum_account_size);
      const bv = parseMinAccount(b.minimum_account_size);
      if ((av !== null) !== (bv !== null)) return av !== null ? -1 : 1;
      return (av ?? 0) - (bv ?? 0);
    });
    else if (sortBy === 'cpa_high') result.sort((a, b) => (getClientsPerAdvisor(b) ?? 0) - (getClientsPerAdvisor(a) ?? 0));
    else if (sortBy === 'cpa_low') result.sort((a, b) => (getClientsPerAdvisor(a) ?? 0) - (getClientsPerAdvisor(b) ?? 0));
    else if (sortBy === 'alpha') result.sort((a, b) =>
      (a.display_name || a.primary_business_name).localeCompare(b.display_name || b.primary_business_name)
    );
    else if (sortBy === 'alpha_desc') result.sort((a, b) =>
      (b.display_name || b.primary_business_name).localeCompare(a.display_name || a.primary_business_name)
    );

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firms, filters, sortBy, firmCoords]);

  // ── Active filter chips (derived) ──
  const activeChips: { key: string; label: string; onRemove: () => void }[] = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.geoLocation) chips.push({ key: 'geo', label: filters.geoRadius === 0 ? `Near ${filters.geoLocation.city}, ${filters.geoLocation.state}` : `Within ${filters.geoRadius}mi of ${filters.geoLocation.city}, ${filters.geoLocation.state}`, onRemove: () => handleFiltersChange({ ...filters, geoLocation: null }) });
    if (filters.minAUM) chips.push({ key: 'minAUM', label: `AUM: ${filters.minAUM === 'under100m' ? '<$100M' : filters.minAUM === '100000000' ? '$100M–$500M' : filters.minAUM === '500000000' ? '$500M–$2B' : '$2B+'}`, onRemove: () => handleFiltersChange({ ...filters, minAUM: '' }) });
    if (filters.minAccountSize) chips.push({ key: 'minAccountSize', label: `Min. investment: ${filters.minAccountSize}`, onRemove: () => handleFiltersChange({ ...filters, minAccountSize: '' }) });
    if (filters.minVisorScore > 0) chips.push({ key: 'minVisorScore', label: `Visor Index ${filters.minVisorScore}+`, onRemove: () => handleFiltersChange({ ...filters, minVisorScore: 0 }) });
    if (filters.minFeeCompetitiveness > 0) chips.push({ key: 'feeComp', label: `Fee Comp. ${filters.minFeeCompetitiveness}+`, onRemove: () => handleFiltersChange({ ...filters, minFeeCompetitiveness: 0 }) });
    if (filters.feeStructure.size > 0) chips.push({ key: 'feeStructure', label: `Fee: ${Array.from(filters.feeStructure).join(', ')}`, onRemove: () => handleFiltersChange({ ...filters, feeStructure: new Set() }) });
    if (filters.firmType.size > 0) chips.push({ key: 'firmType', label: `Type: ${Array.from(filters.firmType).join(', ')}`, onRemove: () => handleFiltersChange({ ...filters, firmType: new Set() }) });
    if (filters.conflictScreening.size > 0) chips.push({ key: 'conflict', label: 'Conflict-free', onRemove: () => handleFiltersChange({ ...filters, conflictScreening: new Set() }) });
    if (filters.clientType.size > 0) chips.push({ key: 'clientType', label: `Clients: ${Array.from(filters.clientType).join(', ')}`, onRemove: () => handleFiltersChange({ ...filters, clientType: new Set() }) });
    if (filters.minAUMGrowth) chips.push({ key: 'aumGrowth', label: `AUM growth ${filters.minAUMGrowth}%+`, onRemove: () => handleFiltersChange({ ...filters, minAUMGrowth: '' }) });
    if (filters.minClientGrowth) chips.push({ key: 'clientGrowth', label: `Client growth ${filters.minClientGrowth}%+`, onRemove: () => handleFiltersChange({ ...filters, minClientGrowth: '' }) });
    if (filters.avgClientSizeMin) chips.push({ key: 'avgClient', label: `Avg client: ${filters.avgClientSizeMin}`, onRemove: () => handleFiltersChange({ ...filters, avgClientSizeMin: '' }) });
    if (filters.totalClientsMin) chips.push({ key: 'totalClients', label: `Clients: ${filters.totalClientsMin}`, onRemove: () => handleFiltersChange({ ...filters, totalClientsMin: '' }) });
    if (filters.aumPerAdvisorMin) chips.push({ key: 'aumPerAdvisor', label: `AUM/Advisor: ${filters.aumPerAdvisorMin}`, onRemove: () => handleFiltersChange({ ...filters, aumPerAdvisorMin: '' }) });
    if (filters.clientsPerAdvisorMin) chips.push({ key: 'clientsPerAdvisor', label: `Clients/Inv Proisor: ${filters.clientsPerAdvisorMin}`, onRemove: () => handleFiltersChange({ ...filters, clientsPerAdvisorMin: '' }) });
    if (filters.hasAlternatives) chips.push({ key: 'alts', label: 'Has alternatives', onRemove: () => handleFiltersChange({ ...filters, hasAlternatives: false }) });
    if (filters.tags.size > 0) chips.push({ key: 'tags', label: `Tags: ${Array.from(filters.tags).map(t => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ')}`, onRemove: () => handleFiltersChange({ ...filters, tags: new Set() }) });

    return chips;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="min-h-screen bg-[#0A1C2A]">
      <style suppressHydrationWarning>{SEARCH_PAGE_CSS}</style>

      {/* ── Sticky search strip ── */}
      <div className="sticky top-14 z-30 bg-[#0A1C2A] border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1280px]">
        {/* Search row */}
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-6 py-3">
          {/* Mobile filter toggle */}
          <button
            className="lg:hidden h-10 w-10 shrink-0 flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-all"
            onClick={() => setFiltersOpen(true)}
            aria-label="Open filters"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>

          <form onSubmit={handleSearch} className="flex flex-1 items-center border border-white/[0.12] bg-white/[0.04] focus-within:border-[rgba(45,189,116,0.5)] px-3 gap-2 transition-colors">
            <svg className="h-4 w-4 shrink-0 text-white/45" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search firm name…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSelectedIndex(-1); }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedIndex(prev => Math.min(prev + 1, visibleFirms.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedIndex(prev => Math.max(prev - 1, -1));
                } else if (e.key === 'Enter' && selectedIndex >= 0) {
                  e.preventDefault();
                  const selected = visibleFirms[selectedIndex];
                  if (selected) window.location.href = `/firm/${selected.crd}`;
                }
              }}
              className="flex-1 h-10 bg-transparent text-[14px] text-white placeholder:text-white/45 outline-none font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); fetchFirms(''); }}
                className="text-[11px] text-white/50 hover:text-white/75 transition-colors shrink-0"
              >
                ✕ Clear
              </button>
            )}
          </form>

          <button
            onClick={() => handleSearch()}
            className="h-10 px-7 bg-[#1A7A4A] hover:bg-[#22995E] text-white text-[13px] font-semibold transition-colors shrink-0"
          >
            Search
          </button>

          <span className="font-mono text-[12px] text-white/50 shrink-0 hidden sm:block whitespace-nowrap">
            {loading ? '…' : `${firms.length.toLocaleString()} results`}
          </span>
        </div>

        {/* Quick filter tags */}
        <div className="flex items-center gap-2 px-6 py-2.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45 shrink-0">
            Quick:
          </span>
          {([
            { label: 'Fee-only', key: 'firmType', value: new Set(['ria'] as FirmTypeFilter[]), check: () => filters.firmType.has('ria') },
            { label: 'Top scored', key: 'minVisorScore', value: 80, check: () => filters.minVisorScore >= 80 },
            { label: 'No minimum', key: 'minAccountSize', value: '0', check: () => filters.minAccountSize === '0' },
            { label: 'Under $500K min', key: 'minAccountSize', value: 'under250k', check: () => filters.minAccountSize === 'under250k' },
            { label: '$1B+ AUM', key: 'minAUM', value: '2000000000', check: () => filters.minAUM === '2000000000' },
          ] as const).map(qf => {
            const isActive = qf.check();
            return (
              <button
                key={qf.label}
                onClick={() => {
                  if (isActive) {
                    const defaultVal = DEFAULT_FILTERS[qf.key as keyof SearchFilters];
                    setFilters(prev => ({ ...prev, [qf.key]: defaultVal }));
                  } else {
                    setFilters(prev => ({ ...prev, [qf.key]: qf.value }));
                  }
                }}
                className={cn(
                  'shrink-0 px-3 py-1 text-[11px] border transition-all whitespace-nowrap',
                  isActive
                    ? 'border-[rgba(45,189,116,0.5)] text-[#2DBD74] bg-[rgba(45,189,116,0.06)]'
                    : 'border-white/10 text-white/60 hover:border-[rgba(45,189,116,0.5)] hover:text-[#2DBD74] hover:bg-[rgba(45,189,116,0.06)]'
                )}
              >
                {qf.label}
              </button>
            );
          })}
        </div>
        </div>{/* end max-w inner */}
      </div>

      {/* ── Two-column layout ── */}
      <div className="mx-auto max-w-[1280px] flex">

        {/* Sidebar (hidden on mobile until filtersOpen) */}
        <div className="hidden lg:block w-[280px] shrink-0">
          <FilterSidebar
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            firms={firms}
            firmCoords={firmCoords}
            loading={loading}
            onGeoSelect={() => setSortBy('proximity')}
            onResetFilters={handleClearFilters}
          />
        </div>

        {/* Mobile sidebar */}
        <div className="lg:hidden">
          <FilterSidebar
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            firms={firms}
            firmCoords={firmCoords}
            loading={loading}
            onGeoSelect={() => setSortBy('proximity')}
            onResetFilters={handleClearFilters}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 border-l border-[#CAD8D0] bg-[#F6F8F7] px-8 pt-8 pb-20 min-h-[600px]">

          {/* Auth-conditional rendering */}
          {session === undefined ? (
            /* Auth loading */
            <div className="flex items-center justify-center pt-24">
              <div className="h-6 w-6 rounded-full border-2 border-[#2DBD74] border-t-transparent animate-spin" />
            </div>
          ) : session === null ? (
            /* Gate box for unauthenticated users */
            <GateBox firms={firms} loading={loading} />
          ) : (
            /* Full results for authenticated users */
            <>
              {/* Error state */}
              {error && (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-red-400">Error: {error}</p>
                </div>
              )}

              {/* Results */}
              {loading ? (
                <LoadingSkeleton />
              ) : (
                <>
              {/* Results toolbar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-serif text-[22px] font-bold text-[#0C1810]">
                    {visibleFirms.length}
                  </span>
                  <span className="text-[12px] text-[#5A7568]">firms match your filters</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-[#5A7568]">Sort by</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-white border border-[#CAD8D0] text-[#0C1810] font-sans text-[12px] px-3 py-1.5 outline-none"
                  >
                    {filters.geoLocation && (
                      <option value="proximity" className="bg-white">Proximity (nearest first)</option>
                    )}
                    <option value="score" className="bg-white">Visor Index™</option>
                    <option value="score_asc" className="bg-white" hidden>Visor Index™ (low)</option>
                    <option value="aum_high" className="bg-white">AUM</option>
                    <option value="aum_low" className="bg-white" hidden>AUM (low)</option>
                    <option value="avg_high" className="bg-white">Average Account</option>
                    <option value="avg_low" className="bg-white" hidden>Average Account (low)</option>
                    <option value="min_high" className="bg-white">Minimum Account</option>
                    <option value="min_low" className="bg-white" hidden>Minimum Account (low)</option>
                    <option value="alpha" className="bg-white">Alphabetical</option>
                    <option value="alpha_desc" className="bg-white" hidden>Alphabetical (Z–A)</option>
                  </select>
                </div>
              </div>

              {/* Active filter chips */}
              {activeChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {activeChips.map(chip => (
                    <span
                      key={chip.key}
                      className="inline-flex items-center gap-1.5 text-[11px] text-[#2DBD74] bg-[rgba(45,189,116,0.08)] border border-[rgba(45,189,116,0.2)] px-2.5 py-1"
                    >
                      {chip.label}
                      <button
                        onClick={chip.onRemove}
                        className="text-[rgba(45,189,116,0.5)] hover:text-[#2DBD74] transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center text-[11px] font-semibold text-[#0C1810] bg-[#F6F8F7] border border-[#CAD8D0] px-3 py-1 hover:bg-white hover:border-[#5A7568] transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              )}

                  {(() => {
                    const totalPages = Math.max(1, Math.ceil(visibleFirms.length / perPage));
                    const safePage = Math.min(currentPage, totalPages);
                    const startIdx = (safePage - 1) * perPage;
                    const pageSlice = visibleFirms.slice(startIdx, startIdx + perPage);

                    return (
                      <>
                        {/* Column header row with sort arrows (desktop only) */}
                        {(
                          <div className="hidden md:grid grid-cols-[56px_1fr_90px_90px_90px_100px_90px] mb-1 border border-transparent">
                            <div style={{ width: 56 }} />
                            <button
                              data-more-btn
                              onClick={(e) => {
                                e.stopPropagation();
                                setSortBy(sortBy === 'alpha' ? 'alpha_desc' : 'alpha');
                              }}
                              className={cn(
                                'px-5 flex items-center justify-center gap-1 transition-colors cursor-pointer',
                                sortBy === 'alpha' || sortBy === 'alpha_desc' ? 'text-[#2DBD74]' : 'text-[#5A7568] hover:text-[#0C1810]'
                              )}
                            >
                              <span className="text-[10px] uppercase tracking-[0.08em] font-semibold">Firm Name</span>
                              <span className="text-[10px]">{sortBy === 'alpha' || sortBy === 'alpha_desc' ? (sortBy === 'alpha' ? '↓' : '↑') : '↕'}</span>
                            </button>
                            {([
                              { label: 'AUM', high: 'aum_high', low: 'aum_low' },
                              { label: 'Min. Acct', high: 'min_high', low: 'min_low' },
                              { label: 'Avg. Acct', high: 'avg_high', low: 'avg_low' },
                              { label: 'Clients/Inv Pro', high: 'cpa_high', low: 'cpa_low' },
                              { label: 'Score', high: 'score', low: 'score_asc' },
                            ] as const).map(col => {
                              const isHigh = sortBy === col.high;
                              const isLow = sortBy === col.low;
                              const isActive = isHigh || isLow;
                              return (
                                <button
                                  key={col.label}
                                  data-more-btn
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Toggle: if already high → low, if already low → high, default → high
                                    setSortBy(isHigh ? col.low : col.high);
                                  }}
                                  className={cn(
                                    'flex items-center justify-center gap-1 transition-colors cursor-pointer',
                                    isActive ? 'text-[#2DBD74]' : 'text-[#5A7568] hover:text-[#0C1810]'
                                  )}
                                >
                                  <span className="text-[10px] uppercase tracking-[0.08em] font-semibold">{col.label}</span>
                                  <span className="text-[10px]">{isActive ? (isHigh ? '↓' : '↑') : '↕'}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex flex-col gap-[1px]">
                          {pageSlice.map((firm, idx) => (
                            <FirmCard
                              key={firm.crd}
                              firm={firm}
                              index={idx}
                              isSelected={startIdx + idx === selectedIndex}
                              cardRef={startIdx + idx === selectedIndex ? selectedRef : undefined}
                            />
                          ))}
                        </div>

                        {/* Empty state */}
                        {visibleFirms.length === 0 && (
                          <div className="py-20 text-center">
                            <div className="h-12 w-12 border border-[#CAD8D0] grid place-items-center mx-auto mb-5 opacity-40">
                              <svg className="h-5 w-5 text-[#5A7568]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                              </svg>
                            </div>
                            <p className="font-serif text-[22px] text-[#0C1810] mb-2">No results found</p>
                            <p className="text-[13px] text-[#5A7568] leading-[1.6] mb-6 max-w-[360px] mx-auto">
                              {filters.geoLocation && filters.geoRadius > 0
                                ? `No firms found within ${filters.geoRadius}mi of ${filters.geoLocation.city}, ${filters.geoLocation.state}. Try expanding your radius or removing some filters.`
                                : filters.minVisorScore >= 80
                                ? 'No firms match your score threshold with the current filters. Try lowering the Visor Index minimum or removing other filters.'
                                : activeChips.length > 2
                                ? `You have ${activeChips.length} active filters. Try removing some to see more results.`
                                : 'Try adjusting your filters or broadening your search.'}
                            </p>
                            <div className="flex items-center gap-3 flex-wrap justify-center">
                              {(() => {
                                if (!filters.geoLocation || filters.geoRadius <= 0) return null;
                                const presets = [10, 25, 50, 100];
                                const next = presets.find(p => p > filters.geoRadius);
                                if (!next) return null;
                                return (
                                  <button
                                    onClick={() => setFilters(prev => ({ ...prev, geoRadius: next }))}
                                    className="text-[13px] border border-[#2DBD74]/30 text-[#2DBD74] px-6 py-2.5 hover:bg-[rgba(45,189,116,0.06)] transition-all"
                                  >
                                    Expand to {next}mi
                                  </button>
                                );
                              })()}
                              <button
                                onClick={handleClearFilters}
                                className="text-[13px] border border-[#CAD8D0] text-[#0C1810] px-6 py-2.5 hover:border-[#1A7A4A]/30 hover:text-[#0C1810] transition-all"
                              >
                                Reset all filters
                              </button>
                            </div>

                            {/* Contact CTA */}
                            <div className="mt-8 pt-6 border-t border-[#CAD8D0] max-w-[360px] mx-auto text-center">
                              <p className="text-[12px] text-[#5A7568] leading-[1.6] mb-3">
                                Can't find the firm you're looking for? Let us know and we'll look into it.
                              </p>
                              <Link
                                href="/contact"
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2DBD74]/80 hover:text-[#2DBD74] transition-colors"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                                Contact us
                              </Link>
                            </div>
                          </div>
                        )}

                        {/* Pagination footer */}
                        {visibleFirms.length > 0 && (
                          <div className="flex flex-col items-center gap-4 pt-8 mt-4 border-t border-[#CAD8D0]">
                            {/* Page numbers */}
                            {totalPages > 1 && (() => {
                              // Build truncated page list: 1 ... 4 5 [6] 7 8 ... 78
                              const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
                              const delta = 2; // pages around current
                              const left = Math.max(2, safePage - delta);
                              const right = Math.min(totalPages - 1, safePage + delta);

                              pages.push(1);
                              if (left > 2) pages.push('ellipsis-start');
                              for (let i = left; i <= right; i++) pages.push(i);
                              if (right < totalPages - 1) pages.push('ellipsis-end');
                              if (totalPages > 1) pages.push(totalPages);

                              return (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={safePage === 1}
                                    className="h-8 w-8 flex items-center justify-center border border-[#CAD8D0] text-[#5A7568] hover:border-[#1A7A4A]/30 hover:text-[#0C1810] transition-all disabled:opacity-20 disabled:cursor-not-allowed text-[12px]"
                                  >
                                    ←
                                  </button>
                                  {pages.map((page, idx) =>
                                    typeof page === 'string' ? (
                                      <span key={page} className="h-8 w-8 flex items-center justify-center text-[12px] text-[#CAD8D0]">…</span>
                                    ) : (
                                      <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                          'h-8 w-8 flex items-center justify-center border text-[12px] transition-all',
                                          page === safePage
                                            ? 'border-[rgba(45,189,116,0.5)] bg-[rgba(45,189,116,0.08)] text-[#2DBD74]'
                                            : 'border-[#CAD8D0] text-[#5A7568] hover:border-[#1A7A4A]/30 hover:text-[#0C1810]'
                                        )}
                                      >
                                        {page}
                                      </button>
                                    )
                                  )}
                                  <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={safePage === totalPages}
                                    className="h-8 w-8 flex items-center justify-center border border-[#CAD8D0] text-[#5A7568] hover:border-[#1A7A4A]/30 hover:text-[#0C1810] transition-all disabled:opacity-20 disabled:cursor-not-allowed text-[12px]"
                                  >
                                    →
                                  </button>
                                </div>
                              );
                            })()}

                            {/* Per-page + count row */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5A7568]">Per page</span>
                                <div className="flex gap-0.5">
                                  {([25, 50, 100] as const).map(n => (
                                    <button
                                      key={n}
                                      onClick={() => { setPerPage(n); setCurrentPage(1); }}
                                      className={cn(
                                        'h-7 px-2.5 text-[11px] border transition-all',
                                        perPage === n
                                          ? 'border-[rgba(45,189,116,0.4)] bg-[rgba(45,189,116,0.07)] text-[#2DBD74]'
                                          : 'border-[#CAD8D0] text-[#5A7568] hover:border-[#1A7A4A]/30 hover:text-[#0C1810]'
                                      )}
                                    >
                                      {n}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <span className="font-mono text-[11px] text-[#5A7568]">
                                {startIdx + 1}–{Math.min(startIdx + perPage, visibleFirms.length)} of {visibleFirms.length}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
