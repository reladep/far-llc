'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import FirmLogo from '@/components/firms/FirmLogo';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Session } from '@supabase/supabase-js';

const supabase = createSupabaseBrowserClient();

interface Firm {
  crd: number;
  primary_business_name: string;
  display_name?: string | null;
  logo_key?: string | null;
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
  // Visor Score
  final_score?: number | null;
  stars?: number | null;
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
  onApply: (filters: Record<string, unknown>) => void;
  onMinScoreChange: (v: number) => void;
  minScore: number;
}

function FilterSidebar({ open, onClose, onApply, onMinScoreChange, minScore }: FilterSidebarProps) {
  const [minAUM, setMinAUM] = useState('');
  const [minAccountSize, setMinAccountSize] = useState('');

  const applyAndClose = () => {
    onApply({ location: '', minAUM, minAccountSize, clientBase: '', wealthTier: '' });
    onClose();
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
          'lg:relative lg:z-auto lg:h-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] p-4 lg:hidden">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/40">Filters</h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center text-white/40 hover:text-white" aria-label="Close">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="pr-8 pt-2 pb-12">

          {/* Fee Structure */}
          <FilterGroup label="Fee Structure">
            {[
              { label: 'Fee-only', count: '1,204' },
              { label: 'Fee-based', count: '892' },
              { label: 'Commission-based', count: '418' },
              { label: 'Flat / subscription', count: '333' },
            ].map(opt => (
              <FilterCheckbox key={opt.label} label={opt.label} count={opt.count} />
            ))}
          </FilterGroup>

          {/* Visor Score Range */}
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
                <span className="font-mono text-[11px] text-white/40">{minScore === 0 ? 'Any' : minScore}</span>
                <span className="font-mono text-[11px] text-white/40">100</span>
              </div>
              <div className="relative h-[3px] bg-white/[0.08] rounded-full mb-3">
                <div
                  className="absolute top-0 bottom-0 bg-[#1A7A4A] rounded-full"
                  style={{ left: `${minScore}%`, right: 0 }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={minScore}
                onChange={e => onMinScoreChange(Number(e.target.value))}
                className="score-range-input"
                style={{ marginTop: '-16px' }}
              />
              <p className="text-[10px] text-white/25 mt-2">
                {minScore === 0 ? 'Showing all scores' : `Minimum score: ${minScore}`}
              </p>
            </div>
          </FilterGroup>

          {/* Firm AUM */}
          <FilterGroup label="Firm AUM">
            {[
              { label: 'Under $100M', count: '341', value: '' },
              { label: '$100M – $500M', count: '628', value: '100000000' },
              { label: '$500M – $2B', count: '512', value: '500000000' },
              { label: '$2B+', count: '204', value: '2000000000' },
            ].map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={opt.count}
                checked={minAUM === opt.value && opt.value !== ''}
                onChange={() => {
                  setMinAUM(prev => prev === opt.value ? '' : opt.value);
                  setTimeout(applyAndClose, 0);
                }}
              />
            ))}
          </FilterGroup>

          {/* Minimum Investment */}
          <FilterGroup label="Minimum Investment">
            {[
              { label: 'No minimum', count: '289', value: '0' },
              { label: 'Under $250K', count: '441', value: '' },
              { label: '$250K – $1M', count: '617', value: '250000' },
              { label: '$1M+', count: '398', value: '1000000' },
            ].map(opt => (
              <FilterCheckbox
                key={opt.label}
                label={opt.label}
                count={opt.count}
                checked={minAccountSize === opt.value && opt.value !== ''}
                onChange={() => {
                  setMinAccountSize(prev => prev === opt.value ? '' : opt.value);
                  setTimeout(applyAndClose, 0);
                }}
              />
            ))}
          </FilterGroup>

          {/* Firm Type */}
          <FilterGroup label="Firm Type">
            {[
              { label: 'RIA (independent)', count: '1,847' },
              { label: 'Multi-family office', count: '142' },
              { label: 'OCIO', count: '88' },
              { label: 'Bank-affiliated', count: '334' },
            ].map(opt => (
              <FilterCheckbox key={opt.label} label={opt.label} count={opt.count} />
            ))}
          </FilterGroup>

          {/* Conflict Screening */}
          <FilterGroup label="Conflict Screening">
            {[
              { label: 'No referral arrangements', count: '982' },
              { label: 'No 12b-1 fees', count: '1,204' },
              { label: 'No disciplinary history', count: '2,491' },
              { label: 'No PE ownership', count: '1,798' },
            ].map(opt => (
              <FilterCheckbox key={opt.label} label={opt.label} count={opt.count} />
            ))}
          </FilterGroup>

        </div>
      </aside>
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="border-t border-white/[0.05] my-4" />
      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">{label}</p>
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
      <span className="flex-1 text-[12px] text-white/50 group-hover:text-white/70 transition-colors">{label}</span>
      <span className="font-mono text-[10px] text-white/20">{count}</span>
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
        <span className="font-serif text-[22px] font-bold text-white">{count}</span>
        <span className="text-[12px] text-white/30">advisors match your filters</span>
      </div>

      {/* Blurred cards + CTA overlay */}
      <div className="relative">
        {/* Blurred firm cards */}
        <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)' }}>
          <div className="flex flex-col gap-[1px]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[56px] bg-[#0F2538] border border-white/[0.06] animate-pulse" />
              ))
            ) : previewFirms.length > 0 ? (
              previewFirms.map((firm) => {
                const score = firm.final_score ?? null;
                const scoreColor = score == null ? '#ffffff' : score >= 80 ? '#2DBD74' : score >= 50 ? '#F59E0B' : '#EF4444';
                return (
                  <div key={firm.crd} className="grid grid-cols-[56px_1fr_auto_auto] border border-white/[0.06] bg-[#0F2538]">
                    <div className="grid place-items-center border-r border-white/[0.06]" style={{ height: 56, width: 56 }}>
                      <div className="h-8 w-8 bg-white/[0.04] border border-white/[0.08] grid place-items-center font-serif text-[13px] font-bold text-white/25">
                        {(firm.display_name || firm.primary_business_name).slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="px-5 py-[14px] min-w-0">
                      <p className="font-serif text-[16px] font-semibold text-white truncate mb-1">
                        {firm.display_name || firm.primary_business_name}
                      </p>
                      <span className="text-[11px] text-white/35">{firm.main_office_city}, {firm.main_office_state}</span>
                    </div>
                    <div className="px-5 py-[14px] text-right" style={{ minWidth: 100 }}>
                      <p className="font-serif text-[18px] font-bold text-white leading-none mb-1">{formatAUM(firm.aum)}</p>
                      <p className="text-[9px] uppercase tracking-[0.1em] text-white/25">AUM</p>
                    </div>
                    <div className="px-5 py-[14px] text-center" style={{ minWidth: 80 }}>
                      {score != null ? (
                        <p className="font-serif text-[28px] font-bold leading-none" style={{ color: scoreColor }}>{score}</p>
                      ) : (
                        <p className="text-[11px] text-white/20">N/A</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[56px] bg-[#0F2538] border border-white/[0.06]" />
              ))
            )}
          </div>
        </div>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(10,28,42,0) 0%, rgba(10,28,42,0.6) 60%, rgba(10,28,42,0.95) 100%)' }}
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
            <p className="text-[13px] text-white/35 leading-[1.7] border-t border-white/[0.06] pt-4 mb-6">
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
                className="inline-flex items-center px-7 py-3 border border-white/10 text-white/40 hover:border-white/30 hover:text-white text-[13px] transition-all"
              >
                View Pricing
              </Link>
            </div>

            {/* Trust line */}
            <p className="flex items-center gap-2 text-[11px] text-white/20">
              <span className="h-[5px] w-[5px] rounded-full bg-[#2DBD74] shrink-0" />
              Free forever · No credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Firm Card ────────────────────────────────────────────────────────────────

function FirmCard({
  firm,
  isSelected,
  cardRef,
}: {
  firm: Firm;
  isSelected?: boolean;
  cardRef?: React.RefObject<HTMLDivElement>;
}) {
  const score = firm.final_score ?? null;
  const scoreColor =
    score == null ? '#ffffff' : score >= 80 ? '#2DBD74' : score >= 50 ? '#F59E0B' : '#EF4444';
  const isFeatured = score != null && score >= 85;

  return (
    <div ref={cardRef} className="relative">
      {isFeatured && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#2DBD74] z-10" />
      )}
      <Link href={`/firm/${firm.crd}`}>
        <div
          className={cn(
            'grid border bg-[#0F2538] hover:border-white/[0.14] transition-all cursor-pointer',
            'grid-cols-[56px_1fr_auto_auto_auto]',
            isFeatured ? 'border-[rgba(45,189,116,0.2)]' : 'border-white/[0.06]',
            isSelected && 'border-[rgba(45,189,116,0.5)] bg-[rgba(45,189,116,0.04)]'
          )}
        >
          {/* Logo column */}
          <div className="grid place-items-center border-r border-white/[0.06]" style={{ height: 56, width: 56 }}>
            {firm.logo_key ? (
              <FirmLogo
                logoKey={firm.logo_key}
                firmName={firm.display_name || firm.primary_business_name}
                size="sm"
              />
            ) : (
              <div className="h-8 w-8 bg-white/[0.04] border border-white/[0.08] grid place-items-center font-serif text-[13px] font-bold text-white/25">
                {(firm.display_name || firm.primary_business_name).slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Main info column */}
          <div className="px-5 py-[14px] border-r border-white/[0.05] min-w-0">
            <p className="font-serif text-[16px] font-semibold text-white truncate mb-1">
              {firm.display_name || firm.primary_business_name}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] text-white/35">
                {firm.main_office_city}, {firm.main_office_state}
              </span>
              {(firm.services_financial_planning === 'Y' ||
                firm.services_mgr_selection === 'Y') && (
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] px-[7px] py-[2px] border border-white/10 text-white/30">
                  {firm.services_financial_planning === 'Y' ? 'Fee-only · RIA' : 'RIA'}
                </span>
              )}
            </div>
          </div>

          {/* AUM column */}
          <div className="px-5 py-[14px] border-r border-white/[0.05] text-right" style={{ minWidth: 110 }}>
            <p className="font-serif text-[18px] font-bold text-white leading-none mb-1">
              {formatAUM(firm.aum)}
            </p>
            <p className="text-[9px] uppercase tracking-[0.1em] text-white/25">AUM</p>
            {firm.employee_total ? (
              <p className="font-mono text-[10px] text-white/25 mt-1">{firm.employee_total} empl.</p>
            ) : null}
          </div>

          {/* Score column */}
          <div className="px-5 py-[14px] border-r border-white/[0.05] text-center" style={{ minWidth: 90 }}>
            {score != null ? (
              <>
                <p
                  className="font-serif text-[28px] font-bold leading-none tracking-[-0.02em] mb-0.5"
                  style={{ color: scoreColor }}
                >
                  {score}
                </p>
                <p className="text-[8px] uppercase tracking-[0.12em] text-white/25">Visor Score™</p>
                <div className="h-[2px] bg-white/[0.08] mt-2">
                  <div
                    className="h-full transition-[width] duration-500"
                    style={{ width: `${score}%`, background: scoreColor }}
                  />
                </div>
              </>
            ) : (
              <p className="text-[11px] text-white/20">N/A</p>
            )}
          </div>

          {/* Actions column */}
          <div className="px-4 py-[14px] flex flex-col gap-2 items-center justify-center" style={{ minWidth: 80 }}>
            <span className="text-[11px] font-semibold text-white/50 border border-white/10 px-3 py-1.5 hover:border-white/30 hover:text-white transition-all whitespace-nowrap">
              View →
            </span>
            <span className="text-[10px] text-[rgba(45,189,116,0.5)] hover:text-[#2DBD74] transition-colors whitespace-nowrap">
              + Compare
            </span>
          </div>
        </div>
      </Link>
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
          className="h-[56px] bg-[#0F2538] border border-white/[0.06] animate-pulse"
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
  const [filters, setFilters] = useState<Record<string, unknown>>({});
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
  const [minScore, setMinScore] = useState(0);
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

  // Fetch firms from Supabase with filters (protected — do not modify)
  const fetchFirms = useCallback(async (query: string, filterOptions: Record<string, unknown>) => {
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
          number_of_offices,
          services_financial_planning,
          services_mgr_selection,
          services_pension_consulting
        `);

      if (query && query.length > 0) {
        queryBuilder = queryBuilder.ilike('primary_business_name', `%${query}%`);
      }

      if (filterOptions.location && (filterOptions.location as string).length > 0) {
        const loc = (filterOptions.location as string).toLowerCase();
        queryBuilder = queryBuilder.or(`main_office_city.ilike.%${loc}%,main_office_state.ilike.%${loc}%`);
      }

      if (filterOptions.minAUM && (filterOptions.minAUM as string).length > 0) {
        const minAUM = parseInt(filterOptions.minAUM as string);
        queryBuilder = queryBuilder.gte('aum', minAUM);
      }

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

      const crds = baseFirms.map(f => f.crd);

      const { data: profileData } = await supabase
        .from('firmdata_profile_text')
        .select('crd, client_base, wealth_tier, investment_philosophy, firm_character, specialty_strategies')
        .in('crd', crds);

      const { data: feeData } = await supabase
        .from('firmdata_feetiers')
        .select('crd, min_aum')
        .in('crd', crds);

      const [{ data: nameData }, { data: logoData }, { data: scoreData }] = await Promise.all([
        supabase.from('firm_names').select('crd, display_name').in('crd', crds),
        supabase.from('firm_logos').select('crd, logo_key').eq('has_logo', true).in('crd', crds),
        supabase.from('firm_scores').select('crd, final_score, stars').in('crd', crds),
      ]);

      const profileMap = new Map((profileData || []).map(p => [p.crd, p]));
      const feeMap = new Map((feeData || []).map(f => [f.crd, f]));
      const nameMap = new Map((nameData || []).map(n => [n.crd, n.display_name]));
      const logoMap = new Map((logoData || []).map(l => [l.crd, l.logo_key]));
      const scoreMap = new Map((scoreData || []).map(s => [s.crd, s]));

      let mergedFirms = baseFirms.map(firm => ({
        ...firm,
        display_name: nameMap.get(firm.crd) || null,
        logo_key: logoMap.get(firm.crd) || null,
        client_base: profileMap.get(firm.crd)?.client_base || null,
        wealth_tier: profileMap.get(firm.crd)?.wealth_tier || null,
        investment_philosophy: profileMap.get(firm.crd)?.investment_philosophy || null,
        firm_character: profileMap.get(firm.crd)?.firm_character || null,
        specialty_strategies: profileMap.get(firm.crd)?.specialty_strategies || null,
        min_fee: feeMap.get(firm.crd)?.min_aum ? parseFloat(feeMap.get(firm.crd)!.min_aum) : null,
        final_score: scoreMap.get(firm.crd)?.final_score ?? null,
        stars: scoreMap.get(firm.crd)?.stars ?? null,
      }));

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

  // Initial load (protected)
  useEffect(() => {
    fetchFirms('', {});
  }, [fetchFirms]);

  // Handle search submit (protected)
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchFirms(searchQuery, filters);
  };

  // Handle filter apply (protected)
  const handleApplyFilters = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
    fetchFirms(searchQuery, newFilters);
    setFiltersOpen(false);
  };

  // Handle clear filters (protected)
  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    fetchFirms('', {});
  };

  // ── Presentation: sorted + score-filtered list ──
  const sortedFirms = useMemo(() => {
    const copy = [...firms];
    if (sortBy === 'score') copy.sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0));
    else if (sortBy === 'aum_high') copy.sort((a, b) => (b.aum ?? 0) - (a.aum ?? 0));
    else if (sortBy === 'aum_low') copy.sort((a, b) => (a.aum ?? 0) - (b.aum ?? 0));
    else if (sortBy === 'alpha') copy.sort((a, b) =>
      (a.display_name || a.primary_business_name).localeCompare(b.display_name || b.primary_business_name)
    );
    return copy;
  }, [firms, sortBy]);

  const visibleFirms = useMemo(() => {
    setCurrentPage(1);
    return sortedFirms.filter(f => minScore === 0 || (f.final_score != null && f.final_score >= minScore));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedFirms, minScore]);

  // ── Active filter chips (derived) ──
  const activeChips = Object.entries(filters).filter(([, v]) => v && String(v).length > 0);

  const removeChip = (key: string) => {
    const newFilters = { ...filters, [key]: '' };
    setFilters(newFilters);
    fetchFirms(searchQuery, newFilters);
  };

  const chipLabel: Record<string, string> = {
    minAUM: 'AUM filter',
    minAccountSize: 'Min. account',
    location: 'Location',
    clientBase: 'Client base',
    wealthTier: 'Wealth tier',
  };

  return (
    <div className="min-h-screen bg-[#0A1C2A]">

      {/* ── Sticky search strip ── */}
      <div className="sticky top-14 z-30 bg-[#0A1C2A] border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1280px]">
        {/* Search row */}
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-6 py-3">
          {/* Mobile filter toggle */}
          <button
            className="lg:hidden h-10 w-10 shrink-0 flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all"
            onClick={() => setFiltersOpen(true)}
            aria-label="Open filters"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>

          <form onSubmit={handleSearch} className="flex flex-1 items-center border border-white/[0.12] bg-white/[0.04] focus-within:border-[rgba(45,189,116,0.5)] px-3 gap-2 transition-colors">
            <svg className="h-4 w-4 shrink-0 text-white/25" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
              className="flex-1 h-10 bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); fetchFirms('', filters); }}
                className="text-[11px] text-white/30 hover:text-white/60 transition-colors shrink-0"
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

          <span className="font-mono text-[12px] text-white/30 shrink-0 hidden sm:block whitespace-nowrap">
            {loading ? '…' : `${firms.length.toLocaleString()} results`}
          </span>
        </div>

        {/* Quick filter tags */}
        <div className="flex items-center gap-2 px-6 py-2.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25 shrink-0">
            Quick:
          </span>
          {['Fee-only', 'Fiduciary', 'No minimum', 'Under $500K min', '$1M+ AUM', 'Conflict-free', 'Top scored'].map(tag => (
            <button
              key={tag}
              className="shrink-0 px-3 py-1 text-[11px] border border-white/10 text-white/45 hover:border-[rgba(45,189,116,0.5)] hover:text-[#2DBD74] hover:bg-[rgba(45,189,116,0.06)] transition-all whitespace-nowrap"
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
            onApply={handleApplyFilters}
            onMinScoreChange={setMinScore}
            minScore={minScore}
          />
        </div>

        {/* Mobile sidebar */}
        <div className="lg:hidden">
          <FilterSidebar
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            onApply={handleApplyFilters}
            onMinScoreChange={setMinScore}
            minScore={minScore}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 border-l border-white/[0.06] px-8 pt-8 pb-20 min-h-[600px]">

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
                  <span className="font-serif text-[22px] font-bold text-white">
                    {visibleFirms.length}
                  </span>
                  <span className="text-[12px] text-white/30">advisors match your filters</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-white/30">Sort by</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-white/[0.05] border border-white/10 text-white/70 font-sans text-[12px] px-3 py-1.5 outline-none"
                  >
                    <option value="score" className="bg-[#0F2538]">Visor Score™ (high to low)</option>
                    <option value="aum_high" className="bg-[#0F2538]">AUM (high to low)</option>
                    <option value="aum_low" className="bg-[#0F2538]">AUM (low to high)</option>
                    <option value="alpha" className="bg-[#0F2538]">Alphabetical</option>
                    <option value="newest" className="bg-[#0F2538]">Newest filing</option>
                  </select>
                  {/* View toggle */}
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'h-[30px] w-[30px] border border-white/[0.08] grid place-items-center transition-all',
                        viewMode === 'list' && 'bg-white/[0.06] border-white/20'
                      )}
                      aria-label="List view"
                    >
                      <svg className={cn('h-3.5 w-3.5', viewMode === 'list' ? 'text-white' : 'text-white/40')} fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" d="M2 4h12M2 8h12M2 12h12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'h-[30px] w-[30px] border border-white/[0.08] grid place-items-center transition-all',
                        viewMode === 'grid' && 'bg-white/[0.06] border-white/20'
                      )}
                      aria-label="Grid view"
                    >
                      <svg className={cn('h-3.5 w-3.5', viewMode === 'grid' ? 'text-white' : 'text-white/40')} fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
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
              {(activeChips.length > 0 || minScore > 0) && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {activeChips.map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1.5 text-[11px] text-[#2DBD74] bg-[rgba(45,189,116,0.08)] border border-[rgba(45,189,116,0.2)] px-2.5 py-1"
                    >
                      {chipLabel[k] || k}: {String(v)}
                      <button
                        onClick={() => removeChip(k)}
                        className="text-[rgba(45,189,116,0.5)] hover:text-[#2DBD74] transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {minScore > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#2DBD74] bg-[rgba(45,189,116,0.08)] border border-[rgba(45,189,116,0.2)] px-2.5 py-1">
                      Visor Score {minScore}+
                      <button
                        onClick={() => setMinScore(0)}
                        className="text-[rgba(45,189,116,0.5)] hover:text-[#2DBD74] transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => { handleClearFilters(); setMinScore(0); }}
                    className="text-[11px] text-white/30 hover:text-white/60 transition-colors px-1"
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
                              isSelected={startIdx + idx === selectedIndex}
                              cardRef={startIdx + idx === selectedIndex ? selectedRef : undefined}
                            />
                          ))}
                        </div>

                        {/* Empty state */}
                        {visibleFirms.length === 0 && (
                          <div className="py-20 text-center">
                            <div className="h-12 w-12 border border-white/[0.08] grid place-items-center mx-auto mb-5 opacity-40">
                              <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                              </svg>
                            </div>
                            <p className="font-serif text-[22px] text-white/50 mb-2">No results found</p>
                            <p className="text-[13px] text-white/25 leading-[1.6] mb-6">
                              Try adjusting your filters or broadening your search.
                            </p>
                            <button
                              onClick={() => { handleClearFilters(); setMinScore(0); }}
                              className="text-[13px] border border-white/10 text-white/50 px-6 py-2.5 hover:border-white/30 hover:text-white transition-all"
                            >
                              Clear filters
                            </button>
                          </div>
                        )}

                        {/* Pagination footer */}
                        {visibleFirms.length > 0 && (
                          <div className="flex flex-col items-center gap-4 pt-8 mt-4 border-t border-white/[0.06]">
                            {/* Page numbers */}
                            {totalPages > 1 && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                  disabled={safePage === 1}
                                  className="h-8 w-8 flex items-center justify-center border border-white/10 text-white/40 hover:border-white/30 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed text-[12px]"
                                >
                                  ←
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                      'h-8 w-8 flex items-center justify-center border text-[12px] transition-all',
                                      page === safePage
                                        ? 'border-[rgba(45,189,116,0.5)] bg-[rgba(45,189,116,0.08)] text-[#2DBD74]'
                                        : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                                    )}
                                  >
                                    {page}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                  disabled={safePage === totalPages}
                                  className="h-8 w-8 flex items-center justify-center border border-white/10 text-white/40 hover:border-white/30 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed text-[12px]"
                                >
                                  →
                                </button>
                              </div>
                            )}

                            {/* Per-page + count row */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/20">Per page</span>
                                <div className="flex gap-0.5">
                                  {([25, 50, 100] as const).map(n => (
                                    <button
                                      key={n}
                                      onClick={() => { setPerPage(n); setCurrentPage(1); }}
                                      className={cn(
                                        'h-7 px-2.5 text-[11px] border transition-all',
                                        perPage === n
                                          ? 'border-[rgba(45,189,116,0.4)] bg-[rgba(45,189,116,0.07)] text-[#2DBD74]'
                                          : 'border-white/10 text-white/35 hover:border-white/25 hover:text-white/70'
                                      )}
                                    >
                                      {n}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <span className="font-mono text-[11px] text-white/20">
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
