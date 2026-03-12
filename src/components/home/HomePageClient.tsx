'use client';

import { FormEvent, ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button } from '@/components/ui';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { cn, formatCurrency } from '@/lib/utils';
import {
  comparisonPoints,
  heroBreakdown,
  homepageMetrics,
  howSteps,
  methodologyPillars,
  personas,
  pricingTiers,
  proofMetrics,
} from './homepage-data';

interface Suggestion {
  crd: number;
  primary_business_name: string;
  display_name?: string | null;
  main_office_city: string | null;
  main_office_state: string | null;
}

interface SearchCardProps {
  searchQuery: string;
  searching: boolean;
  suggestionsLoading: boolean;
  suggestions: Suggestion[];
  showDropdown: boolean;
  selectedIndex: number;
  listboxId: string;
  onSearchSubmit: (event: FormEvent) => void;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSuggestionClick: (crd: number) => void;
  onQuickSearch: (query: string) => void;
}

const supabase = createSupabaseBrowserClient();

const popularQueries = [
  'Multi-family office New York',
  'Fee-only planners Austin',
  'Tax strategy advisors NYC',
  'OCIO providers Boston',
];

const reviewedFirmFallback = [
  'National RIAs',
  'Independent advisors',
  'Regional wealth firms',
  'Institutional OCIOs',
];

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

function useInView<T extends HTMLElement>(threshold = 0.12, rootMargin = '0px 0px -10% 0px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [inView, rootMargin, threshold]);

  return { ref, inView };
}

function useCountUp(target: number, options?: { start?: boolean; duration?: number; delay?: number }) {
  const { start = true, duration = 1200, delay = 0 } = options || {};
  const prefersReducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    let frame = 0;
    let timeout = 0;
    let startTs = 0;
    timeout = window.setTimeout(() => {
      const tick = (ts: number) => {
        if (!startTs) startTs = ts;
        const progress = Math.min((ts - startTs) / duration, 1);
        setValue(target * easeOutCubic(progress));
        if (progress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [delay, duration, prefersReducedMotion, start, target]);

  return value;
}

function Reveal({
  children,
  className,
  delay = 0,
  threshold,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(threshold);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
        inView || prefersReducedMotion ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-8 opacity-0 blur-[2px]',
        className
      )}
      style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function scoreToneClass(tone: 'good' | 'warn' | 'risk') {
  if (tone === 'risk') return 'text-rose-500';
  if (tone === 'warn') return 'text-amber-400';
  return 'text-emerald-400';
}

function HeroScoreCard() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<'intro' | 'card' | 'settled'>('intro');
  const score = useCountUp(84, { start: true, duration: 1900, delay: 350 });
  const displayedScore = prefersReducedMotion ? 84 : Math.round(score);
  const ringColor = displayedScore < 40 ? '#ef4444' : displayedScore < 65 ? '#f59e0b' : '#34d399';
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (circumference * displayedScore) / 100;

  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase('settled');
      return;
    }

    const t1 = window.setTimeout(() => setPhase('card'), 2400);
    const t2 = window.setTimeout(() => setPhase('settled'), 3000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_30px_120px_-40px_rgba(0,0,0,0.85)] backdrop-blur-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        phase === 'intro' ? 'scale-[1.015]' : 'scale-100',
        phase === 'settled' && 'hover:-translate-y-1'
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(45,189,116,0.16),transparent_45%)]" />
      <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
        <p className="font-serif text-2xl text-white">Meridian Wealth Advisors</p>
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/35">
          SEC RIA · New York, NY · $2.4B AUM
        </p>
      </div>

      <div className="grid gap-6 border-b border-white/10 px-6 py-6 sm:grid-cols-[140px_1fr] sm:items-center">
        <div
          className={cn(
            'relative mx-auto flex h-32 w-32 items-center justify-center transition-all duration-[900ms] ease-[cubic-bezier(0.76,0,0.24,1)]',
            phase === 'intro' ? 'scale-110' : 'scale-100'
          )}
        >
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" className="fill-none stroke-white/10" strokeWidth="6" />
            <circle
              cx="60"
              cy="60"
              r="52"
              className="fill-none transition-[stroke-dashoffset,stroke] duration-700 ease-out"
              stroke={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="text-center">
            <div className="font-serif text-5xl leading-none tracking-[-0.04em] text-white transition-colors duration-300" style={{ color: ringColor }}>
              {displayedScore}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/35">Score</div>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Percentile Rank</p>
          <p
            className={cn(
              'mt-1 font-mono text-sm text-emerald-300 transition-all duration-700',
              phase === 'settled' ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            )}
          >
            Top 8% nationally
          </p>
          <div className="mt-4 space-y-3">
            {heroBreakdown.map((item, index) => (
              <div key={item.label} className="grid grid-cols-[1fr_88px_28px] items-center gap-3 text-[11px]">
                <span className="truncate text-white/55">{item.label}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      'h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
                      item.tone === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'
                    )}
                    style={{
                      width: phase === 'settled' ? `${item.value}%` : '0%',
                      transitionDelay: `${index * 120 + 120}ms`,
                    }}
                  />
                </div>
                <span
                  className={cn(
                    'text-right font-mono transition-opacity duration-500',
                    item.tone === 'warn' ? 'text-amber-300' : 'text-emerald-300',
                    phase === 'settled' ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{ transitionDelay: `${index * 120 + 180}ms` }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/50">
          Full profile requires access
        </span>
        <Link href="#pricing" className="text-sm font-medium text-white transition duration-300 hover:translate-x-1 hover:text-emerald-300">
          Unlock
        </Link>
      </div>

      <div
        className={cn(
          'pointer-events-none absolute -right-10 top-8 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-200 transition-all duration-700',
          phase === 'settled' ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
        )}
      >
        Conflict Flag
      </div>
      <div
        className={cn(
          'pointer-events-none absolute -left-8 bottom-10 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200 transition-all duration-700',
          phase === 'settled' ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'
        )}
      >
        Top 8%
      </div>
    </div>
  );
}

function SearchCard({
  searchQuery,
  searching,
  suggestionsLoading,
  suggestions,
  showDropdown,
  selectedIndex,
  listboxId,
  onSearchSubmit,
  onSearchChange,
  onSearchFocus,
  onSearchKeyDown,
  onSuggestionClick,
  onQuickSearch,
}: SearchCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_90px_-30px_rgba(15,23,42,0.4)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Search advisors free</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Search any registered advisor or firm by name, city, specialty, or fee structure.
      </p>

      <form onSubmit={onSearchSubmit} className="mt-5 space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={onSearchKeyDown}
            onFocus={onSearchFocus}
            placeholder="Search advisors, firms, or locations"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={selectedIndex >= 0 ? `${listboxId}-option-${selectedIndex}` : undefined}
          />
          {showDropdown && (suggestionsLoading || suggestions.length > 0) && (
            <div
              id={listboxId}
              role="listbox"
              className="absolute top-full z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
            >
              {suggestionsLoading
                ? Array.from({ length: 4 }, (_, index) => (
                    <div key={`skeleton-${index}`} className="flex items-center justify-between rounded-xl px-3 py-3">
                      <div className="space-y-2">
                        <div className="h-3.5 w-40 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                      </div>
                      <div className="h-3 w-14 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  ))
                : suggestions.map((firm, index) => (
                    <button
                      id={`${listboxId}-option-${index}`}
                      key={firm.crd}
                      type="button"
                      role="option"
                      aria-selected={index === selectedIndex}
                      onClick={() => onSuggestionClick(firm.crd)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition duration-200',
                        index === selectedIndex ? 'bg-emerald-50' : 'hover:bg-slate-50'
                      )}
                    >
                      <span>
                        <span className="block text-sm font-medium text-slate-900">
                          {firm.display_name || firm.primary_business_name}
                        </span>
                        {firm.main_office_city && firm.main_office_state && (
                          <span className="text-xs text-slate-500">
                            {firm.main_office_city}, {firm.main_office_state}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">CRD {firm.crd}</span>
                    </button>
                  ))}
            </div>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full justify-center rounded-2xl transition-transform duration-300 hover:-translate-y-0.5">
          {searching ? 'Searching...' : 'Search Directory'}
        </Button>
      </form>

      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Popular searches</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {popularQueries.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => onQuickSearch(query)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewedFirmsStrip() {
  const [logos, setLogos] = useState<{ crd: number; logo_key: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchLogos() {
      const { data } = await supabase
        .from('firm_logos')
        .select('crd, logo_key')
        .eq('has_logo', true)
        .limit(30);

      if (data?.length) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setLogos([...shuffled, ...shuffled]);
      }
      setLoaded(true);
    }

    fetchLogos();
  }, []);

  return (
    <section className="border-y border-white/6 bg-[#11283b]" aria-label="Firms reviewed">
      <div className="container-page py-5">
        <div className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
          Firms we review
        </div>
        {logos.length > 0 ? (
          <div className="relative overflow-hidden">
            <div className="flex animate-homepage-scroll gap-12">
              {logos.map((logo, index) => (
                <Link
                  key={`${logo.crd}-${index}`}
                  href={`/firm/${logo.crd}`}
                  className="flex h-10 w-28 shrink-0 items-center justify-center opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
                >
                  <img
                    src={`https://tgbatuqvvltemslwtpia.supabase.co/storage/v1/object/public/firm-logos/${logo.logo_key}`}
                    alt="Reviewed firm logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(loaded ? reviewedFirmFallback : Array.from({ length: 4 }, (_, index) => `loading-${index}`)).map((item) => (
              <div
                key={item}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em]',
                  loaded
                    ? 'border-white/10 bg-white/[0.04] text-white/55'
                    : 'h-9 w-32 animate-pulse border-white/5 bg-white/[0.04] text-transparent'
                )}
              >
                {loaded ? item : 'Loading'}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProofMetricCard({
  metric,
  index,
  start,
}: {
  metric: (typeof proofMetrics)[number];
  index: number;
  start: boolean;
}) {
  const count = useCountUp(metric.countTo || 0, { start: start && !!metric.countTo, duration: 1200, delay: index * 120 });
  const displayValue =
    metric.countTo && start
      ? `${metric.prefix || ''}${metric.decimals ? count.toFixed(metric.decimals) : Math.round(count)}${metric.suffix || ''}`
      : metric.value;

  return (
    <div className="bg-[#0c1d2b] px-6 py-8 transition-colors duration-500 hover:bg-white/[0.03]">
      <p className="font-serif text-4xl text-white">{displayValue}</p>
      <p className="mt-2 text-sm font-medium text-white/85">{metric.label}</p>
      <p className="mt-2 text-xs leading-5 text-white/45">{metric.detail}</p>
    </div>
  );
}

function ProofStrip() {
  const { ref, inView } = useInView<HTMLElement>(0.2);

  return (
    <section ref={ref} className="bg-[#0c1d2b]">
      <div className="container-page grid gap-px bg-white/5 py-0 md:grid-cols-4">
        {proofMetrics.map((metric, index) => (
          <ProofMetricCard key={metric.label} metric={metric} index={index} start={inView} />
        ))}
      </div>
    </section>
  );
}

function formatCompactMoney(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return formatCurrency(value);
}

function StakesCalculator() {
  const [portfolio, setPortfolio] = useState(500000);
  const [years, setYears] = useState(20);
  const { ref, inView } = useInView<HTMLElement>(0.18);

  const strongOutcome = portfolio * Math.pow(1.072, years);
  const midOutcome = portfolio * Math.pow(1.058, years);
  const weakOutcome = portfolio * Math.pow(1.041, years);
  const spread = strongOutcome - weakOutcome;
  const maxOutcome = Math.max(strongOutcome, midOutcome, weakOutcome);
  const chartHeights = useMemo(
    () => [
      Math.max((strongOutcome / maxOutcome) * 100, 18),
      Math.max((midOutcome / maxOutcome) * 100, 18),
      Math.max((weakOutcome / maxOutcome) * 100, 18),
    ],
    [maxOutcome, midOutcome, strongOutcome, weakOutcome]
  );

  return (
    <section ref={ref} className="bg-[#f6f8f5] py-20 text-slate-900 md:py-28">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Why this decision matters</p>
            <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-slate-900 md:text-5xl">
              Choose the wrong advisor and it <span className="italic text-emerald-700">compounds</span> for decades.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Small differences in fees, taxes, behavior, and portfolio discipline can create very large outcome gaps over time.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.28)] transition-transform duration-500 hover:-translate-y-1">
            <div className="font-serif text-5xl tracking-[-0.04em] text-slate-900">{formatCompactMoney(spread)}</div>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              Estimated difference · {formatCompactMoney(portfolio)} portfolio · {years} years
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Between a top-quartile (Visor 80–100) and low-score advisor (Visor 0–49). Adjust below.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.22)] md:p-8">
          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            <div className="space-y-6">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Starting portfolio</span>
                <div className="mt-2 font-mono text-lg text-slate-900">{formatCurrency(portfolio)}</div>
                <input
                  type="range"
                  min={100000}
                  max={5000000}
                  step={50000}
                  value={portfolio}
                  onChange={(event) => setPortfolio(Number(event.target.value))}
                  className="mt-4 w-full accent-emerald-600"
                />
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>$100K</span>
                  <span>$5M</span>
                </div>
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Time horizon</span>
                <div className="mt-2 font-mono text-lg text-slate-900">{years} years</div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={years}
                  onChange={(event) => setYears(Number(event.target.value))}
                  className="mt-4 w-full accent-emerald-600"
                />
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>5 years</span>
                  <span>30 years</span>
                </div>
              </label>
            </div>

            <div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 transition-transform duration-500 hover:-translate-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Stronger outcome</p>
                  <p className="mt-3 font-serif text-4xl text-emerald-800">{formatCompactMoney(strongOutcome)}</p>
                  <p className="mt-2 text-sm text-emerald-900/70">Illustrative ~7.2% net</p>
                </div>
                <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5 transition-transform duration-500 hover:-translate-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Mid case</p>
                  <p className="mt-3 font-serif text-4xl text-amber-800">{formatCompactMoney(midOutcome)}</p>
                  <p className="mt-2 text-sm text-amber-900/70">Illustrative ~5.8% net</p>
                </div>
                <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50 p-5 transition-transform duration-500 hover:-translate-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">Weaker outcome</p>
                  <p className="mt-3 font-serif text-4xl text-rose-800">{formatCompactMoney(weakOutcome)}</p>
                  <p className="mt-2 text-sm text-rose-900/70">Illustrative ~4.1% net</p>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 px-5 py-6 text-white">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Outcome gap over {years} years</p>
                    <p className="mt-2 font-serif text-4xl text-white">{formatCompactMoney(spread)}</p>
                  </div>
                  <div className="text-right text-xs leading-5 text-white/50">
                    Small annual differences become large wealth gaps over long periods.
                  </div>
                </div>
                <div className="mt-5 grid h-40 grid-cols-3 items-end gap-4">
                  {[
                    { color: 'bg-emerald-400/85', height: chartHeights[0] },
                    { color: 'bg-amber-400/85', height: chartHeights[1] },
                    { color: 'bg-rose-400/85', height: chartHeights[2] },
                  ].map((bar, index) => (
                    <div
                      key={bar.color}
                      className={cn('rounded-t-[1rem] transition-[height,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]', bar.color)}
                      style={{
                        height: inView ? `${bar.height}%` : '16%',
                        transitionDelay: `${index * 120}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-6 text-xs leading-6 text-slate-500">
            Illustrative model only. Actual results vary with markets, taxes, fees, asset allocation, and investor behavior.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-page">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">How it works</p>
          <h2 className="mt-4 font-serif text-4xl text-slate-900 md:text-5xl">Institutional-grade diligence, end to end.</h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Search, score, compare, and monitor across the major steps that drive a serious advisor selection process.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-200 md:grid-cols-2 xl:grid-cols-3">
          {howSteps.map((step, index) => (
            <Reveal key={step.title} delay={index * 80}>
            <article className="bg-white p-6 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-xl md:p-8">
              <p className="font-mono text-sm text-emerald-700">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
            </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 text-center" delay={150}>
          <Link href="#pricing" className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800">
            See plans and access tiers
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function MethodologySection() {
  return (
    <section className="bg-[#122b3f] py-20 text-white md:py-28">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">The Intelligence Layer</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              The <span className="italic text-emerald-300">Visor Value Score™</span> — our proprietary edge.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
              500+ SEC ADV data points. One score, 0–100. Every advisor in the country. Built entirely on public regulatory data — not influenced by the industry we evaluate.
            </p>
          </div>
          </Reveal>

          <Reveal delay={120}>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-serif text-2xl text-white">Meridian Wealth Advisors</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/35">SEC RIA · New York, NY · $2.4B AUM</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-5xl leading-none text-emerald-300">84</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/35">/ 100</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-white px-5 py-4 text-slate-900">
              <div className="flex items-center justify-between text-sm">
                <span>Visor Value Score</span>
                <span className="font-semibold text-emerald-700">84 / 100</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[84%] rounded-full bg-emerald-600 transition-[width] duration-1000 ease-out" />
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Percentile rank</span>
                <span className="font-medium text-slate-800">Top 8% of indexed firms</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {methodologyPillars.map((pillar) => (
                <div key={pillar.label} className="flex items-center justify-between gap-3 border-b border-white/8 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className={cn('h-2.5 w-2.5 rounded-full', pillar.tone)} />
                    <span className="text-sm text-white/75">{pillar.label}</span>
                  </div>
                  <span className="font-mono text-sm text-white/85">{pillar.weight}</span>
                </div>
              ))}
            </div>

            <Link href="/how-it-works" className="mt-6 inline-flex text-sm font-medium text-emerald-300 transition hover:text-emerald-200">
              Read the full methodology
            </Link>
          </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="bg-[#0c1d2b] py-20 text-white md:py-24">
      <div className="container-page">
        <div className="grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 lg:grid-cols-2">
          <Reveal>
          <div className="bg-[#0c1d2b] p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Free research path</p>
            <h3 className="mt-4 font-serif text-3xl text-white">Search and screen on your own.</h3>
            <p className="mt-4 text-sm leading-7 text-white/65">
              The free path gets you into the dataset and current routing without requiring an account for basic discovery.
            </p>
          </div>
          </Reveal>
          <Reveal delay={100}>
          <div className="bg-[#10263a] p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">Paid diligence path</p>
            <h3 className="mt-4 font-serif text-3xl text-white">Unlock deeper scoring, comparison, and monitoring.</h3>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Full scores, sub-metric breakdowns, filing alerts, and the advisor matching tool. Everything you need to make a confident, well-researched decision.
            </p>
          </div>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={160}>
          <div className="bg-[#0c1d2b] p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              {comparisonPoints.map((point) => (
                <div key={point.label} className="grid gap-px overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 transition-transform duration-500 hover:-translate-y-1 md:grid-cols-[180px_1fr_1fr]">
                  <div className="bg-[#091824] px-4 py-5 text-sm font-medium text-white/80">{point.label}</div>
                  <div className="bg-[#0c1d2b] px-4 py-5 text-sm leading-6 text-white/60">{point.free}</div>
                  <div className="bg-[#10263a] px-4 py-5 text-sm leading-6 text-white/80">{point.paid}</div>
                </div>
              ))}
            </div>
          </div>
          </Reveal>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {homepageMetrics.map((metric, index) => (
            <Reveal key={metric.label} delay={index * 90}>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 transition-transform duration-500 hover:-translate-y-1 hover:bg-white/[0.06]">
              <p className="font-serif text-3xl text-white">{metric.value}</p>
              <p className="mt-2 text-sm font-medium text-white/85">{metric.label}</p>
              <p className="mt-2 text-xs leading-6 text-white/50">{metric.detail}</p>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="bg-[#0a1c2a] py-20 text-white md:py-28">
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Access</p>
          <h2 className="mt-4 font-serif text-4xl text-white md:text-5xl">Three ways to find the right advisor.</h2>
        </Reveal>

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {pricingTiers.map((tier, index) => (
            <Reveal key={tier.name} delay={index * 100}>
            <article
              key={tier.name}
              className={cn(
                'flex h-full flex-col rounded-[2rem] border p-7 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.7)] transition-[transform,box-shadow,background-color] duration-500 hover:-translate-y-1 hover:shadow-[0_28px_90px_-40px_rgba(0,0,0,0.85)]',
                tier.featured ? 'border-emerald-400 bg-[#10263a]' : 'border-white/10 bg-white/[0.04]'
              )}
            >
              {tier.featured && (
                <Badge className="mb-5 w-fit border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                  Most Popular
                </Badge>
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">{tier.name}</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-serif text-5xl leading-none text-white">{tier.price}</span>
                <span className="pb-1 text-sm text-white/55">{tier.note}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/65">{tier.description}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-white/75">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={tier.href} className="mt-8">
                <Button
                  size="lg"
                  variant={tier.featured ? 'primary' : 'outline'}
                  className={cn(
                    'w-full rounded-2xl justify-center',
                    !tier.featured && 'border-white/15 text-white hover:bg-white/10'
                  )}
                >
                  {tier.ctaLabel}
                </Button>
              </Link>
            </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6 text-center text-sm text-white/40" delay={120}>
          Search any advisor free. Full profile and premium diligence tools unlock when you are ready.
        </Reveal>
      </div>
    </section>
  );
}

function PersonaSection() {
  const [activePersona, setActivePersona] = useState(0);
  const active = personas[activePersona];

  return (
    <section className="bg-[#f6f8f5] py-20 text-slate-900 md:py-28">
      <div className="container-page">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Who it&apos;s for</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
            Built for every investor. <span className="italic text-emerald-700">Calibrated to your situation.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            {personas.map((persona, index) => (
              <button
                key={persona.persona}
                type="button"
                onClick={() => setActivePersona(index)}
                className={cn(
                  'w-full rounded-[1.5rem] border px-5 py-4 text-left transition-all duration-300',
                  index === activePersona
                    ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={cn('text-sm font-semibold', index === activePersona ? 'text-emerald-800' : 'text-slate-900')}>
                      {persona.persona}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{persona.situation}</p>
                  </div>
                  <span className={cn('text-lg', index === activePersona ? 'text-emerald-700' : 'text-slate-300')}>→</span>
                </div>
              </button>
            ))}
          </div>

          <div
            key={active.persona}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.2)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] animate-fade-up md:p-8"
          >
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {active.tag}
            </div>
            <h3 className="mt-5 font-serif text-3xl text-slate-900">{active.blurb}</h3>


            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{active.searchLabel}</span>
              <span className="text-sm text-slate-700">{active.searchQuery}</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {active.searchResultLabel}
              </span>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white transition-transform duration-500 hover:-translate-y-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-2xl text-white">{active.firmName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">{active.firmMeta}</p>
                </div>
                <div className="text-right">
                  <p className={cn('font-serif text-5xl leading-none', scoreToneClass(active.scoreTone))}>{active.score}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/35">Visor Score</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {active.metrics.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-white/[0.04] px-4 py-3 transition-colors duration-300 hover:bg-white/[0.07]">
                    <span className="text-sm text-white/70">{metric.label}</span>
                    <span className={cn('font-mono text-sm', scoreToneClass(metric.tone))}>{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{active.findingLabel}</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{active.finding}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const items = [
    {
      title: 'SEC-grounded data',
      body: 'Core diligence fields are pulled from public regulatory filings rather than advisor marketing copy.',
      href: '/how-it-works',
      label: 'Review methodology',
    },
    {
      title: 'No paid placement',
      body: 'The product is designed so advisors do not buy their way into rankings, ordering, or homepage proof claims.',
      href: '/pricing',
      label: 'See access model',
    },
    {
      title: 'Built for real diligence',
      body: 'No referral arrangements. No advisor partnerships. Revenue comes from subscribers only.',
      href: '/search',
      label: 'Start searching',
    },
  ];

  return (
    <section className="border-y border-emerald-900/10 bg-emerald-50">
      <div className="container-page grid gap-px bg-emerald-900/10 py-0 md:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.title} delay={index * 90}>
          <article className="bg-emerald-50 px-6 py-10 transition-transform duration-500 hover:-translate-y-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-900/15 text-emerald-800">
              <span className="font-serif text-lg">V</span>
            </div>
            <h3 className="mt-5 font-serif text-2xl text-slate-900">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">{item.body}</p>
            <Link href={item.href} className="mt-5 inline-flex text-sm font-semibold text-emerald-700 transition hover:text-emerald-800">
              {item.label}
            </Link>
          </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#0a1c2a] py-24 text-white md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_45%)]" />
      <Reveal className="container-page relative text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Make the decision</p>
        <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl">
          You&apos;re about to hand someone your <span className="italic text-emerald-300">life savings.</span> Know the score first.
        </h2>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="#pricing">
            <Button size="lg" className="rounded-2xl px-8 transition-transform duration-300 hover:-translate-y-0.5">
              Get Full Access
            </Button>
          </Link>
          <Link href="/search">
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl border-white/15 bg-transparent px-8 text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/10"
            >
              Search Advisors Free
            </Button>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

export function HomePageClient() {
  const router = useRouter();
  const listboxId = useId();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      const { data } = await supabase
        .from('firmdata_current')
        .select('crd, primary_business_name, main_office_city, main_office_state')
        .ilike('primary_business_name', `%${searchQuery.trim()}%`)
        .limit(8);

      if (data?.length) {
        const crds = data.map((item) => item.crd);
        const { data: names } = await supabase.from('firm_names').select('crd, display_name').in('crd', crds);
        const nameMap = new Map((names || []).map((item) => [item.crd, item.display_name]));

        setSuggestions(data.map((item) => ({ ...item, display_name: nameMap.get(item.crd) || null })));
      } else {
        setSuggestions([]);
      }

      setShowDropdown(true);
      setSelectedIndex(-1);
      setSuggestionsLoading(false);
    }, 200);

    return () => {
      clearTimeout(timer);
      setSuggestionsLoading(false);
    };
  }, [searchQuery]);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim() || searching) return;

    setSearching(true);
    const query = searchQuery.trim();

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (event.key === 'Enter') {
        handleSearch(event as unknown as FormEvent);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, suggestions.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, -1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedIndex >= 0) {
        router.push(`/firm/${suggestions[selectedIndex].crd}`);
      } else {
        handleSearch(event as unknown as FormEvent);
      }
      return;
    }

    if (event.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const runQuickSearch = (query: string) => {
    setSearchQuery(query);
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-[#0a1c2a] pb-16 pt-14 text-white md:pb-24 md:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_34%),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:auto,72px_72px,72px_72px]" />
        <div className="container-page relative">
          <Reveal className="text-center">
            <p className="inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-300">
              <span className="h-px w-8 bg-emerald-300" />
              Wealth Intelligence · No Paid Placement · Just the Data · Personalized
              <span className="h-px w-8 bg-emerald-300" />
            </p>
          </Reveal>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <Reveal>
            <div>
              <h1 className="max-w-3xl font-serif text-5xl leading-[1.08] tracking-[-0.02em] text-white md:text-[clamp(36px,4.5vw,62px)]">
                Your advisor knows everything about your money.{' '}
                <em className="italic text-emerald-300">Shouldn&apos;t you know everything about them?</em>
              </h1>
              <p className="mt-6 max-w-[480px] text-base font-light leading-7 text-white/50">
                Search, compare, track, and negotiate — across thousands of firms managing trillions in assets.
              </p>

              {/* Hero CTAs */}
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 border border-white/20 px-7 py-3.5 text-sm font-medium text-white/75 transition-all duration-200 hover:border-white/50 hover:text-white"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 14 14" aria-hidden="true"><circle cx="6" cy="6" r="4"/><line x1="9.5" y1="9.5" x2="13" y2="13"/></svg>
                  Search Advisors
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center gap-2 bg-[#1A7A4A] px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#22995E]"
                >
                  Get Access
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 14 14" aria-hidden="true"><line x1="2" y1="7" x2="12" y2="7"/><polyline points="8,3 12,7 8,11"/></svg>
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-2.5 border-t border-white/7 pt-7 text-xs text-white/35">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                No advisor has ever paid to appear here or influence their score.
              </div>
            </div>
            </Reveal>

            <Reveal delay={120}>
              <HeroScoreCard />
            </Reveal>
          </div>
        </div>
      </section>

      <ReviewedFirmsStrip />
      <ProofStrip />
      <StakesCalculator />
      <HowItWorks />
      <MethodologySection />
      <ComparisonSection />
      <PricingSection />
      <PersonaSection />
      <TrustSection />
      <FinalCtaSection />

      <style jsx>{`
        @keyframes homepage-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-homepage-scroll {
          animation: homepage-scroll 32s linear infinite;
        }

        .animate-homepage-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
}
