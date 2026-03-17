'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import FirmLogo from '@/components/firms/FirmLogo';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
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
  // Visor Score
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
  // Text / location
  location: string;
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
  // Alternatives
  hasAlternatives: boolean;
  // Legacy
  clientBase: string;
  wealthTier: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  location: '',
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

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

// ─── Filter Sidebar ──────────────────────────────────────────────────────────

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  firms: Firm[];           // all fetched firms — for computing real counts
  loading: boolean;
}

function FilterSidebar({ open, onClose, filters, onFiltersChange, firms, loading }: FilterSidebarProps) {

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
      ctHnw, ctNonHnw, ctPension, ctCharitable, ctCorporations, ctPooled, ctBanks, ctGovt, ctInsurance,
      conflictHigh, feeCompHigh, hasAlts, topTags,
      aumGrowth5Plus, aumGrowth10Plus,
      clientGrowth5Plus, clientGrowth10Plus,
    };
  }, [firms, loading]);

  const fmt = (n: number | undefined) => n != null ? n.toLocaleString() : '—';

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

          {/* ── Visor Score Range ── */}
          <FilterGroup label="Visor Score™">
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

          {/* ── Conflict Screening ── */}
          <FilterGroup label="Conflict Screening">
            {([
              { label: 'High conflict-free score (80+)', key: 'no_referral' as ConflictFilter, count: counts?.conflictHigh },
            ]).map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={fmt(opt.count)}
                checked={filters.conflictScreening.has(opt.key)}
                onChange={() => toggleSet('conflictScreening', opt.key)}
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
        <span className="text-[12px] text-[#5A7568]">advisors match your filters</span>
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
              Search and filter freely. Full profiles with Visor Scores, fee breakdowns, and regulatory history require an account.
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
  viewMode = 'list',
}: {
  firm: Firm;
  isSelected?: boolean;
  cardRef?: React.RefObject<HTMLDivElement>;
  index?: number;
  viewMode?: 'list' | 'grid';
}) {
  const [expanded, setExpanded] = useState(false);
  const score = firm.final_score ?? null;
  const scoreColor =
    score == null ? '#CAD8D0' : score >= 80 ? '#2DBD74' : score >= 50 ? '#F59E0B' : '#EF4444';
  const isFeatured = score != null && score >= 85;
  const description = firm.specialty_strategies || firm.investment_philosophy || null;
  const firmName = firm.display_name || firm.primary_business_name;

  // Computed values for expanded panel
  const aboutText = firm.business_profile || firm.investment_philosophy || firm.firm_character || null;
  const aboutSnippet = aboutText ? getFirstSentence(aboutText) : null;

  const totalClients = getTotalClients(firm);
  const avgClientSize = getAvgClientSize(firm);

  const hasGrowthData = firm.aum_1yr_growth_annualized != null || firm.aum_5yr_growth_annualized != null ||
    firm.clients_1yr_growth_annualized != null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking a link inside the card
    if ((e.target as HTMLElement).closest('a[href]')) return;
    e.preventDefault();
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
        {/* Grid card layout */}
        {viewMode === 'grid' && (
          <div className="p-4">
            {/* Top: logo + name */}
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0">
                {firm.logo_key ? (
                  <FirmLogo logoKey={firm.logo_key} firmName={firmName} size="sm" />
                ) : (
                  <div className="h-9 w-9 bg-[#F6F8F7] border border-[#CAD8D0] grid place-items-center font-serif text-[13px] font-bold text-[#CAD8D0]">
                    {firmName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[15px] font-semibold text-[#0C1810] leading-tight mb-1 line-clamp-2">{firmName}</p>
                <span className="text-[11px] text-[#5A7568]">{firm.main_office_city}, {firm.main_office_state}</span>
              </div>
            </div>

            {/* Tags row */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(firm.services_financial_planning === 'Y' || firm.services_mgr_selection === 'Y') && (
                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] px-[6px] py-[2px] border border-[#CAD8D0] text-[#5A7568]">
                  {firm.services_financial_planning === 'Y' ? 'Fee-only' : 'RIA'}
                </span>
              )}
            </div>

            {/* Score + AUM row */}
            <div className="flex items-end justify-between border-t border-[#CAD8D0]/50 pt-3">
              <div>
                <p className="font-serif text-[17px] font-bold text-[#0C1810] leading-none mb-1">{formatAUM(firm.aum)}</p>
                <p className="text-[9px] uppercase tracking-[0.1em] text-[#5A7568]">AUM</p>
              </div>
              <div className="text-right">
                {score != null ? (
                  <>
                    <p className="font-serif text-[26px] font-bold leading-none tracking-[-0.02em]" style={{ color: scoreColor }}>{score}</p>
                    <p className="text-[8px] uppercase tracking-[0.12em] text-[#5A7568] mt-0.5">Visor Score™</p>
                    <div className="h-[2px] bg-[#CAD8D0] mt-1.5 w-16">
                      <div className="h-full" style={{ width: `${score}%`, background: scoreColor }} />
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-[#CAD8D0]">N/A</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Desktop list layout */}
        <div className={cn('hidden md:grid grid-cols-[56px_1fr_auto_auto_auto]', viewMode === 'grid' && '!hidden')}>
          {/* Logo column */}
          <div className="grid place-items-center border-r border-[#CAD8D0]/50" style={{ height: 56, width: 56 }}>
            {firm.logo_key ? (
              <FirmLogo logoKey={firm.logo_key} firmName={firmName} size="sm" />
            ) : (
              <div className="h-8 w-8 bg-[#F6F8F7] border border-[#CAD8D0] grid place-items-center font-serif text-[13px] font-bold text-[#CAD8D0]">
                {firmName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Main info column */}
          <div className="px-5 py-[12px] border-r border-[#CAD8D0]/50 min-w-0">
            <p className="font-serif text-[16px] font-semibold text-[#0C1810] truncate mb-0.5">{firmName}</p>
            <div className="flex flex-wrap items-center gap-3 mb-0.5">
              <span className="text-[11px] text-[#5A7568]">{firm.main_office_city}, {firm.main_office_state}</span>
              {(firm.services_financial_planning === 'Y' || firm.services_mgr_selection === 'Y') && (
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] px-[7px] py-[2px] border border-[#CAD8D0] text-[#5A7568]">
                  {firm.services_financial_planning === 'Y' ? 'Fee-only · RIA' : 'RIA'}
                </span>
              )}
            </div>
            {description && <p className="text-[11px] text-[#5A7568]/80 truncate max-w-[400px]">{description}</p>}
          </div>

          {/* AUM column */}
          <div className="px-5 py-[12px] border-r border-[#CAD8D0]/50 text-right" style={{ minWidth: 110 }}>
            <p className="font-serif text-[18px] font-bold text-[#0C1810] leading-none mb-1">{formatAUM(firm.aum)}</p>
            <p className="text-[9px] uppercase tracking-[0.1em] text-[#5A7568]">AUM</p>
            {firm.employee_total ? <p className="font-mono text-[10px] text-[#5A7568] mt-1">{firm.employee_total} empl.</p> : null}
          </div>

          {/* Score column */}
          <div className="px-5 py-[12px] border-r border-[#CAD8D0]/50 text-center" style={{ minWidth: 90 }}>
            {score != null ? (
              <>
                <p className="font-serif text-[28px] font-bold leading-none tracking-[-0.02em] mb-0.5" style={{ color: scoreColor }}>{score}</p>
                <p className="text-[8px] uppercase tracking-[0.12em] text-[#5A7568]">Visor Score™</p>
                <div className="h-[2px] bg-[#CAD8D0] mt-2">
                  <div className="h-full transition-[width] duration-500" style={{ width: `${score}%`, background: scoreColor }} />
                </div>
              </>
            ) : (
              <p className="text-[11px] text-[#CAD8D0]">N/A</p>
            )}
          </div>

          {/* Actions column */}
          <div className="px-4 py-[12px] flex flex-col gap-2 items-center justify-center" style={{ minWidth: 80 }}>
            <span className="text-[11px] font-semibold text-[#0C1810] border border-[#CAD8D0] px-3 py-1.5 hover:border-[#1A7A4A]/30 hover:text-[#0C1810] transition-all whitespace-nowrap">
              {expanded ? '▾ Less' : '▸ More'}
            </span>
          </div>
        </div>

        {/* Mobile layout */}
        <div className={cn('md:hidden p-4', viewMode === 'grid' && '!hidden')}>
          <div className="flex items-center gap-3 mb-2">
            <div className="shrink-0">
              {firm.logo_key ? (
                <FirmLogo logoKey={firm.logo_key} firmName={firmName} size="sm" />
              ) : (
                <div className="h-8 w-8 bg-[#F6F8F7] border border-[#CAD8D0] grid place-items-center font-serif text-[13px] font-bold text-[#CAD8D0]">
                  {firmName.slice(0, 2).toUpperCase()}
                </div>
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
            <span className="text-[10px] text-[#5A7568] shrink-0">{expanded ? '▾' : '▸'}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#CAD8D0] pt-2 mt-1">
            <div>
              <span className="font-serif text-[16px] font-bold text-[#0C1810]">{formatAUM(firm.aum)}</span>
              <span className="text-[9px] uppercase tracking-[0.1em] text-[#5A7568] ml-1.5">AUM</span>
            </div>
            {score != null ? (
              <div className="flex items-center gap-2">
                <span className="font-serif text-[20px] font-bold" style={{ color: scoreColor }}>{score}</span>
                <div className="text-center">
                  <p className="text-[7px] uppercase tracking-[0.1em] text-[#5A7568] leading-none">Visor</p>
                  <p className="text-[7px] uppercase tracking-[0.1em] text-[#5A7568] leading-none">Score™</p>
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-[#CAD8D0]">N/A</span>
            )}
          </div>
        </div>

        {/* ── Expanded detail panel ── */}
        {expanded && viewMode !== 'grid' && (
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
    <div className="flex flex-col gap-[1px]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-[56px] bg-white border border-[#CAD8D0] animate-pulse"
          style={{ opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  );
}

// ─── Search Page ──────────────────────────────────────────────────────────────

export default function SearchPage() {
  // ── Protected state (do not remove) ──
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({ ...DEFAULT_FILTERS });
  const [searchQuery, setSearchQuery] = useState('');
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const selectedRef = useRef<HTMLDivElement>(null);

  // ── Presentation state ──
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [sortBy, setSortBy] = useState('score');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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

  // ── Presentation: filtered + sorted list ──
  const visibleFirms = useMemo(() => {
    setCurrentPage(1);
    let result = [...firms];

    // ── Location ──
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      result = result.filter(f =>
        f.main_office_city?.toLowerCase().includes(loc) ||
        f.main_office_state?.toLowerCase().includes(loc)
      );
    }

    // ── Visor Score ──
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
        const firmTags = [f.tag_1, f.tag_2, f.tag_3].filter(Boolean) as string[];
        return firmTags.some(t => filters.tags.has(t));
      });
    }

    // ── Sort ──
    if (sortBy === 'score') result.sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0));
    else if (sortBy === 'aum_high') result.sort((a, b) => (b.aum ?? 0) - (a.aum ?? 0));
    else if (sortBy === 'aum_low') result.sort((a, b) => (a.aum ?? 0) - (b.aum ?? 0));
    else if (sortBy === 'alpha') result.sort((a, b) =>
      (a.display_name || a.primary_business_name).localeCompare(b.display_name || b.primary_business_name)
    );

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firms, filters, sortBy]);

  // ── Active filter chips (derived) ──
  const activeChips: { key: string; label: string; onRemove: () => void }[] = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.location) chips.push({ key: 'location', label: `Location: ${filters.location}`, onRemove: () => handleFiltersChange({ ...filters, location: '' }) });
    if (filters.minAUM) chips.push({ key: 'minAUM', label: `AUM: ${filters.minAUM === 'under100m' ? '<$100M' : filters.minAUM === '100000000' ? '$100M–$500M' : filters.minAUM === '500000000' ? '$500M–$2B' : '$2B+'}`, onRemove: () => handleFiltersChange({ ...filters, minAUM: '' }) });
    if (filters.minAccountSize) chips.push({ key: 'minAccountSize', label: `Min. investment: ${filters.minAccountSize}`, onRemove: () => handleFiltersChange({ ...filters, minAccountSize: '' }) });
    if (filters.minVisorScore > 0) chips.push({ key: 'minVisorScore', label: `Visor Score ${filters.minVisorScore}+`, onRemove: () => handleFiltersChange({ ...filters, minVisorScore: 0 }) });
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
    if (filters.hasAlternatives) chips.push({ key: 'alts', label: 'Has alternatives', onRemove: () => handleFiltersChange({ ...filters, hasAlternatives: false }) });
    if (filters.tags.size > 0) chips.push({ key: 'tags', label: `Tags: ${Array.from(filters.tags).join(', ')}`, onRemove: () => handleFiltersChange({ ...filters, tags: new Set() }) });

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
              placeholder="Search firm name, advisor, city, or ZIP…"
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
          {['Fee-only', 'Fiduciary', 'No minimum', 'Under $500K min', '$1M+ AUM', 'Conflict-free', 'Top scored'].map(tag => (
            <button
              key={tag}
              className="shrink-0 px-3 py-1 text-[11px] border border-white/10 text-white/60 hover:border-[rgba(45,189,116,0.5)] hover:text-[#2DBD74] hover:bg-[rgba(45,189,116,0.06)] transition-all whitespace-nowrap"
            >
              {tag}
            </button>
          ))}
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
            loading={loading}
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
            loading={loading}
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
              {/* Results toolbar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-serif text-[22px] font-bold text-[#0C1810]">
                    {visibleFirms.length}
                  </span>
                  <span className="text-[12px] text-[#5A7568]">advisors match your filters</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-[#5A7568]">Sort by</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-white border border-[#CAD8D0] text-[#0C1810] font-sans text-[12px] px-3 py-1.5 outline-none"
                  >
                    <option value="score" className="bg-white">Visor Score™ (high to low)</option>
                    <option value="aum_high" className="bg-white">AUM (high to low)</option>
                    <option value="aum_low" className="bg-white">AUM (low to high)</option>
                    <option value="alpha" className="bg-white">Alphabetical</option>
                    <option value="newest" className="bg-white">Newest filing</option>
                  </select>
                  {/* View toggle */}
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'h-[30px] w-[30px] border border-[#CAD8D0] grid place-items-center transition-all',
                        viewMode === 'list' && 'bg-[rgba(26,122,74,0.06)] border-[#1A7A4A]/30'
                      )}
                      aria-label="List view"
                    >
                      <svg className={cn('h-3.5 w-3.5', viewMode === 'list' ? 'text-[#0C1810]' : 'text-[#5A7568]')} fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" d="M2 4h12M2 8h12M2 12h12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'h-[30px] w-[30px] border border-[#CAD8D0] grid place-items-center transition-all',
                        viewMode === 'grid' && 'bg-[rgba(26,122,74,0.06)] border-[#1A7A4A]/30'
                      )}
                      aria-label="Grid view"
                    >
                      <svg className={cn('h-3.5 w-3.5', viewMode === 'grid' ? 'text-[#0C1810]' : 'text-[#5A7568]')} fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                        <rect x="2" y="2" width="5" height="5" rx="0.5" />
                        <rect x="9" y="2" width="5" height="5" rx="0.5" />
                        <rect x="2" y="9" width="5" height="5" rx="0.5" />
                        <rect x="9" y="9" width="5" height="5" rx="0.5" />
                      </svg>
                    </button>
                  </div>
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
                    className="text-[11px] text-[#5A7568] hover:text-[#0C1810] transition-colors px-1"
                  >
                    Clear all
                  </button>
                </div>
              )}

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
                  {(() => {
                    const totalPages = Math.max(1, Math.ceil(visibleFirms.length / perPage));
                    const safePage = Math.min(currentPage, totalPages);
                    const startIdx = (safePage - 1) * perPage;
                    const pageSlice = visibleFirms.slice(startIdx, startIdx + perPage);

                    return (
                      <>
                        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-[1px]')}>
                          {pageSlice.map((firm, idx) => (
                            <FirmCard
                              key={firm.crd}
                              firm={firm}
                              index={idx}
                              viewMode={viewMode}
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
                            <p className="text-[13px] text-[#5A7568] leading-[1.6] mb-6">
                              Try adjusting your filters or broadening your search.
                            </p>
                            <div className="flex items-center gap-3 flex-wrap justify-center">
                              <button
                                onClick={handleClearFilters}
                                className="text-[13px] border border-[#CAD8D0] text-[#0C1810] px-6 py-2.5 hover:border-[#1A7A4A]/30 hover:text-[#0C1810] transition-all"
                              >
                                Clear filters
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
