'use client';

import { FormEvent, ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { cn, formatCurrency } from '@/lib/utils';
import {
  heroBreakdown,
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

  // Wrapper is overflow-visible so floating badges can peek outside the card
  return (
    <div className="relative">
      {/* Floating badge — Conflict Flag, peeks out right */}
      <div
        className={cn(
          'pointer-events-none absolute -right-3 top-10 z-10 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-200 transition-all duration-700',
          phase === 'settled' ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
        )}
      >
        Conflict Flag
      </div>
      {/* Floating badge — Top 8%, peeks out left */}
      <div
        className={cn(
          'pointer-events-none absolute -left-3 bottom-14 z-10 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200 transition-all duration-700',
          phase === 'settled' ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'
        )}
      >
        Top 8%
      </div>

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
    <>
      {/* Keyframes defined here so they're global (not scoped by styled-jsx) */}
      <style>{`
        @keyframes logo-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .logo-marquee-track {
          animation: logo-marquee 32s linear infinite;
        }
        .logo-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <section className="relative overflow-hidden border-y border-white/[0.05] bg-[#0F2538] py-[22px]" aria-label="Firms reviewed">
        {/* Left/right fade gradients */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-[120px] bg-gradient-to-r from-[#0F2538] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-[120px] bg-gradient-to-l from-[#0F2538] to-transparent" />

        <p className="mb-5 text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-white/20">
          Firms We Review
        </p>

        {logos.length > 0 ? (
          <div className="overflow-hidden">
            <div className="logo-marquee-track flex items-center gap-14">
              {logos.map((logo, index) => (
                <Link
                  key={`${logo.crd}-${index}`}
                  href={`/firm/${logo.crd}`}
                  className="flex shrink-0 items-center opacity-40 grayscale transition hover:opacity-80 hover:grayscale-0"
                >
                  <img
                    src={`https://tgbatuqvvltemslwtpia.supabase.co/storage/v1/object/public/firm-logos/${logo.logo_key}`}
                    alt="Reviewed firm logo"
                    className="h-7 max-w-[90px] object-contain brightness-0 invert"
                  />
                </Link>
              ))}
            </div>
          </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3 px-4">
          {(loaded ? reviewedFirmFallback : Array.from({ length: 4 }, (_, index) => `loading-${index}`)).map((item) => (
            <div
              key={item}
              className={cn(
                'border px-4 py-2 text-xs uppercase tracking-[0.18em]',
                loaded
                  ? 'border-white/10 text-white/55'
                  : 'h-9 w-32 animate-pulse border-white/5 bg-white/[0.04] text-transparent'
              )}
            >
              {loaded ? item : ''}
            </div>
          ))}
        </div>
      )}
    </section>
    </>
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

  // Determine display parts: main number/text + optional green suffix em
  let valMain: string;
  let valEm: string | null = null;
  const isText = !metric.countTo; // "Quarterly", "Zero"

  if (metric.countTo && start) {
    const num = Math.round(count);
    if (metric.value === '40K+') {
      valMain = num >= 1000 ? `${Math.round(num / 1000)}` : String(num);
      valEm = num >= 1000 ? 'K+' : null;
    } else if (metric.suffix) {
      valMain = String(num);
      valEm = metric.suffix;
    } else {
      valMain = String(num);
    }
  } else {
    const match = metric.value.match(/^(\d+)(.+)$/);
    if (match) {
      valMain = match[1];
      valEm = match[2];
    } else {
      valMain = metric.value;
    }
  }

  const detail = metric.detail.split('.')[0];

  return (
    <div className="flex flex-1 items-center gap-[14px] border-r border-[rgba(255,255,255,0.06)] px-7 py-[18px]">
      <div>
        <div className={cn('font-serif font-bold text-white', isText ? 'pt-1 text-[20px]' : 'text-[26px]')}>
          {valMain}
          {valEm && <em className="not-italic text-[#2DBD74]">{valEm}</em>}
        </div>
        <div className="mt-1 text-[11px] leading-[1.5] text-white/30">
          {metric.label}<br />{detail}
        </div>
      </div>
    </div>
  );
}

function ProofStrip() {
  const { ref, inView } = useInView<HTMLElement>(0.2);

  return (
    <section ref={ref} className="border-y border-[rgba(255,255,255,0.06)] bg-[#0a1c2a]">
      <div className="container-page px-0">
        <div className="flex items-stretch border-l border-[rgba(255,255,255,0.06)]">
          {proofMetrics.map((metric, index) => (
            <ProofMetricCard key={metric.label} metric={metric} index={index} start={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function formatCompactMoney(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return formatCurrency(value);
}

const CHART_W = 960, CHART_H = 220, CHART_PL = 64, CHART_PR = 16, CHART_PT = 10, CHART_PB = 28;

function growthSeries(principal: number, years: number, rate: number): number[] {
  return Array.from({ length: years + 1 }, (_, i) => principal * Math.pow(1 + rate, i));
}

function buildChartPaths(gs: number[], as_: number[], rs: number[], years: number, portfolio: number) {
  const cW = CHART_W - CHART_PL - CHART_PR;
  const cH = CHART_H - CHART_PT - CHART_PB;
  const minV = portfolio * 0.95;
  const maxV = Math.max(gs[years], as_[years], rs[years]) * 1.04;
  const xP = (i: number) => CHART_PL + (i / years) * cW;
  const yP = (v: number) => CHART_PT + cH - ((v - minV) / (maxV - minV)) * cH;
  const linePath = (s: number[]) =>
    s.map((v, i) => `${i === 0 ? 'M' : 'L'}${xP(i).toFixed(1)},${yP(v).toFixed(1)}`).join(' ');
  const areaPath = (s: number[]) =>
    `${linePath(s)} L${xP(years).toFixed(1)},${(CHART_PT + cH).toFixed(1)} L${CHART_PL},${(CHART_PT + cH).toFixed(1)} Z`;
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const v = minV + (maxV - minV) * (i / 4);
    return { y: yP(v), label: formatCompactMoney(v) };
  });
  const xStep = Math.max(1, Math.floor(years / 5));
  const xLabels: { x: number; label: string }[] = [];
  for (let i = 0; i <= years; i += xStep) xLabels.push({ x: xP(i), label: `Yr ${i}` });
  return {
    lineG: linePath(gs), lineA: linePath(as_), lineR: linePath(rs),
    areaG: areaPath(gs), areaA: areaPath(as_), areaR: areaPath(rs),
    dotG: { cx: xP(years), cy: yP(gs[years]) },
    dotA: { cx: xP(years), cy: yP(as_[years]) },
    dotR: { cx: xP(years), cy: yP(rs[years]) },
    gridLines, xLabels,
  };
}

function StakesCalculator() {
  const [portfolio, setPortfolio] = useState(500000);
  const [years, setYears] = useState(20);
  const { ref } = useInView<HTMLElement>(0.18);

  const strongOutcome = portfolio * Math.pow(1.072, years);
  const midOutcome = portfolio * Math.pow(1.058, years);
  const weakOutcome = portfolio * Math.pow(1.041, years);
  const spread = strongOutcome - weakOutcome;

  const chartPaths = useMemo(() => {
    const gs = growthSeries(portfolio, years, 0.072);
    const as_ = growthSeries(portfolio, years, 0.058);
    const rs = growthSeries(portfolio, years, 0.041);
    return buildChartPaths(gs, as_, rs, years, portfolio);
  }, [portfolio, years]);

  const outcomes = [
    { label: 'Stronger Outcome', val: strongOutcome, color: '#2DBD74' },
    { label: 'Mid Case', val: midOutcome, color: '#D97706' },
    { label: 'Weaker Outcome', val: weakOutcome, color: '#EF4444' },
  ];

  return (
    <section ref={ref} className="bg-[#F6F8F7] py-20 text-[#0C1810] md:py-28">
      <div className="container-page">

        {/* Top: headline left, callout card right */}
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start lg:gap-20">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5A7568]">
              <span className="inline-block h-px w-5 bg-current" />
              Why This Decision Matters
            </p>
            <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[#0C1810] md:text-[clamp(34px,4vw,54px)]">
              Choose the wrong advisor<br />
              and it <em className="italic text-[#1A7A4A]">compounds</em><br />
              for decades.
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-[#5A7568]">
              Research suggests investor outcomes vary meaningfully based on advice quality, fees, taxes, and behavioral discipline. Over time, even small annual gaps can compound into millions.
            </p>
          </div>

          {/* Callout card — green-pale */}
          <div className="mt-9 border border-[rgba(26,122,74,0.18)] bg-[#E6F4ED] p-6">
            <div className="font-serif text-[52px] font-bold leading-none tracking-[-0.03em] text-[#1A7A4A]">
              {formatCompactMoney(spread)}
            </div>
            <p className="mt-1.5 text-[11px] tracking-[0.04em] text-[#5A7568]">
              Estimated difference · {formatCompactMoney(portfolio)} portfolio · {years} years
            </p>
            <p className="mt-3 border-t border-[#CAD8D0] pt-3 text-xs leading-relaxed text-[#5A7568]">
              Illustrative estimated outcome gap between stronger and weaker advisor-led investor results. Adjust assumptions below.
            </p>
          </div>
        </div>

        {/* Calc box */}
        <div className="mt-16 overflow-hidden border border-[#CAD8D0] bg-white">

          {/* Sliders — side by side */}
          <div className="grid grid-cols-2 border-b border-[#CAD8D0]">
            <div className="border-r border-[#CAD8D0] p-[22px_24px]">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5A7568]">Starting Portfolio</span>
              <div className="mt-2 font-serif text-[28px] font-bold text-[#0C1810]">{formatCurrency(portfolio)}</div>
              <input
                type="range" min={100000} max={5000000} step={50000} value={portfolio}
                onChange={(e) => setPortfolio(Number(e.target.value))}
                className="mt-2.5 w-full accent-[#1A7A4A]"
              />
              <div className="mt-1.5 flex justify-between text-[9px] text-[#5A7568]">
                <span>$100K</span><span>$5M</span>
              </div>
            </div>
            <div className="p-[22px_24px]">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5A7568]">Time Horizon</span>
              <div className="mt-2 font-serif text-[28px] font-bold text-[#0C1810]">{years} years</div>
              <input
                type="range" min={5} max={30} step={1} value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="mt-2.5 w-full accent-[#1A7A4A]"
              />
              <div className="mt-1.5 flex justify-between text-[9px] text-[#5A7568]">
                <span>5 yrs</span><span>30 yrs</span>
              </div>
            </div>
          </div>

          {/* SVG line chart */}
          <div className="h-[260px] px-8 pb-4 pt-7">
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id="stakes-sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2DBD74" stopOpacity="0.12" /><stop offset="100%" stopColor="#2DBD74" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="stakes-ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.08" /><stop offset="100%" stopColor="#D97706" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="stakes-rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.06" /><stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              {chartPaths.gridLines.map(({ y, label }) => (
                <g key={label}>
                  <line x1={CHART_PL} y1={y.toFixed(1)} x2={CHART_W - CHART_PR} y2={y.toFixed(1)} stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
                  <text x={CHART_PL - 6} y={(y + 4).toFixed(1)} textAnchor="end" fontSize="9.5" fill="#5A7568" fontFamily="DM Mono,monospace">{label}</text>
                </g>
              ))}
              {chartPaths.xLabels.map(({ x, label }) => (
                <text key={label} x={x.toFixed(1)} y={CHART_H - 6} textAnchor="middle" fontSize="9.5" fill="#5A7568" fontFamily="DM Mono,monospace">{label}</text>
              ))}
              <path d={chartPaths.areaR} fill="url(#stakes-rg)" />
              <path d={chartPaths.areaA} fill="url(#stakes-ag)" />
              <path d={chartPaths.areaG} fill="url(#stakes-sg)" />
              <path d={chartPaths.lineR} fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="5,3" />
              <path d={chartPaths.lineA} fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="5,3" />
              <path d={chartPaths.lineG} fill="none" stroke="#2DBD74" strokeWidth="2" />
              <circle cx={chartPaths.dotG.cx.toFixed(1)} cy={chartPaths.dotG.cy.toFixed(1)} r="4" fill="#2DBD74" stroke="rgba(246,248,247,0.9)" strokeWidth="2" />
              <circle cx={chartPaths.dotA.cx.toFixed(1)} cy={chartPaths.dotA.cy.toFixed(1)} r="4" fill="#D97706" stroke="rgba(246,248,247,0.9)" strokeWidth="2" />
              <circle cx={chartPaths.dotR.cx.toFixed(1)} cy={chartPaths.dotR.cy.toFixed(1)} r="4" fill="#EF4444" stroke="rgba(246,248,247,0.9)" strokeWidth="2" />
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-5 border-b border-[#CAD8D0] px-8 pb-4">
            {[
              { color: '#2DBD74', label: 'Stronger outcome scenario · ~7.2% net' },
              { color: '#D97706', label: 'Mid outcome scenario · ~5.8% net' },
              { color: '#EF4444', label: 'Weaker outcome scenario · ~4.1% net' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-[#5A7568]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Gap callout bar */}
          <div className="flex items-center justify-between border-b border-[#CAD8D0] bg-[rgba(26,122,74,0.06)] px-6 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5A7568]">
              Outcome gap over {years} years
            </span>
            <span className="font-serif text-[22px] font-bold tracking-[-0.02em] text-[#1A7A4A]">
              {formatCompactMoney(spread)}
            </span>
          </div>

          {/* Helper */}
          <p className="border-b border-[#CAD8D0] px-6 py-2.5 text-[11px] italic text-[#5A7568]">
            Small annual differences become large wealth gaps over long periods.
          </p>

          {/* Outcomes row */}
          <div className="grid grid-cols-3">
            {outcomes.map((o, i) => (
              <div key={o.label} className={cn('px-6 py-[18px] text-center', i < 2 && 'border-r border-[#CAD8D0]')}>
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5A7568]">{o.label}</p>
                <p className="font-serif text-2xl font-bold leading-none" style={{ color: o.color }}>
                  {formatCompactMoney(o.val)}
                </p>
                <p className="mt-0.5 text-[10px] text-[#5A7568]">+{formatCompactMoney(o.val - portfolio)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-3.5 text-[10px] leading-7 text-[#5A7568]">
          * Illustrative model only. Assumptions are informed by industry research on investor behavior, fee drag, tax efficiency, and portfolio discipline. Not a guarantee of performance or investment advice.{' '}
          <span className="opacity-70">Actual results vary based on market conditions, taxes, fees, asset allocation, and investor behavior.</span>
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-t border-white/[0.05] bg-[#0a1c2a] py-[108px] text-white">
      <div className="container-page">
        <Reveal className="mx-auto max-w-[680px] text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30">
            How It Works
          </span>
          <h2 className="mt-5 font-serif text-[clamp(36px,5vw,62px)] font-bold leading-[1.04] tracking-[-0.025em] text-white">
            Institutional-grade diligence — end to end.
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-white/45">
            Search, score, compare, and monitor — everything you need to make the most important financial decision of your life.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-16">
          <div className="grid border border-white/[0.07] md:grid-cols-3">
            {howSteps.map((step, index) => (
              <article
                key={step.title}
                className={cn(
                  'border-b border-white/[0.07] p-[36px_32px]',
                  'md:border-r md:border-white/[0.07]',
                  [2, 5].includes(index) && 'md:border-r-0',
                  [3, 4, 5].includes(index) && 'md:border-b-0',
                  index === 5 && 'border-b-0',
                )}
              >
                <span className="block font-mono text-[11px] font-medium tracking-[0.08em] text-[#2DBD74]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-[18px] font-serif text-[20px] font-bold leading-[1.2] text-white">
                  {step.title}
                </h3>
                <p className="mt-[10px] text-[13px] leading-7 text-white/40">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-10 text-center" delay={150}>
          <Link
            href="#pricing"
            className="border-b border-[rgba(45,189,116,0.3)] pb-0.5 text-[13px] font-semibold text-[#2DBD74] transition hover:border-[#2DBD74]"
          >
            See plans &amp; access tiers →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function MethodologySection() {
  return (
    <section className="bg-[#F6F8F7] py-[108px] text-[#0C1810]">
      <div className="container-page">
        <Reveal>
          <span className="inline-flex items-center gap-[10px] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1A7A4A]">
            <span className="h-px w-6 bg-current" />
            The Intelligence Layer
          </span>
          <h2 className="mt-4 font-serif text-[clamp(34px,4.5vw,58px)] font-bold leading-[1.04] tracking-[-0.025em] text-[#0C1810]">
            The <em className="italic text-[#1A7A4A]">Visor Value Score™</em><br />— our proprietary edge.
          </h2>
        </Reveal>

        <Reveal delay={80} className="mt-16">
          <div className="grid border border-[#CAD8D0] lg:grid-cols-2">
            {/* Left: dark score card */}
            <div className="flex flex-col border-b border-[#CAD8D0] lg:border-b-0 lg:border-r">
              {/* Card header — dark navy */}
              <div className="flex items-start justify-between bg-[#0A1C2A] p-[28px_32px]">
                <div>
                  <p className="font-serif text-[17px] font-bold text-white">Meridian Wealth Advisors</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-white/35">SEC RIA · New York, NY · $2.4B AUM</p>
                </div>
                <div>
                  <p className="font-serif text-[56px] font-bold leading-none tracking-[-0.04em] text-[#2DBD74]">84</p>
                  <p className="mt-0.5 text-right text-[9px] uppercase tracking-[0.12em] text-white/30">/ 100</p>
                </div>
              </div>

              {/* Score bar */}
              <div className="border-b border-[#CAD8D0] bg-white p-[18px_32px]">
                <div className="flex justify-between text-[10px] text-[#5A7568]">
                  <span>Visor Value Score™</span>
                  <span className="font-semibold text-[#1A7A4A]">84 / 100</span>
                </div>
                <div className="mt-[7px] h-[5px] overflow-hidden bg-[#E6F4ED]">
                  <div className="h-full w-[84%] bg-[#1A7A4A]" />
                </div>
                <div className="mt-[6px] flex justify-between text-[10px] text-[#5A7568]">
                  <span>Percentile rank</span>
                  <span className="font-semibold text-[#0C1810]">Top 8% of 40,000+ firms</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex-1 bg-white">
                {[
                  { name: 'Regulatory Compliance', val: 96, color: '#1A7A4A' },
                  { name: 'Fee Transparency', val: 91, color: '#1A7A4A' },
                  { name: 'AUM Growth Trajectory', val: 88, color: '#1A7A4A' },
                  { name: 'Conflict of Interest Exposure', val: 67, color: '#F59E0B' },
                  { name: 'Ownership Stability', val: 82, color: '#1A7A4A' },
                  { name: 'Client Retention Proxy', val: 79, color: '#1A7A4A' },
                ].map((m) => (
                  <div key={m.name} className="flex items-center justify-between border-b border-[#CAD8D0] px-[32px] py-[12px] text-[12.5px] last:border-b-0">
                    <span className="text-[#2E4438]">{m.name}</span>
                    <span className="flex items-center gap-[7px] font-semibold">
                      <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: m.color }} />
                      {m.val}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#CAD8D0] bg-[#E6F4ED] p-[12px_32px] text-[10px] leading-[1.5] text-[#5A7568]">
                Derived exclusively from SEC EDGAR filings · Updated quarterly · Not investment advice
              </div>
            </div>

            {/* Right: intro + pillars */}
            <div className="bg-white p-[40px]">
              <p className="mb-8 max-w-[380px] text-[15px] leading-7 text-[#2E4438]">
                500+ SEC ADV data points. One score, 0–100. Every advisor in the country. Built entirely on public regulatory data — not influenced by the industry we evaluate.
              </p>

              {/* Exclusive badge */}
              <div className="mb-8 flex items-center gap-[10px] border border-[rgba(26,122,74,0.18)] bg-[#E6F4ED] p-[12px_16px] text-[11.5px] font-semibold text-[#1A7A4A]">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 13 13">
                  <polygon points="6.5,1 8,5 12,5.4 9.2,8 10.1,12 6.5,10 2.9,12 3.8,8 1,5.4 5,5" />
                </svg>
                Exclusive to Visor Index — not on BrokerCheck, Morningstar, or anywhere else.
              </div>

              {/* Pillars */}
              <div className="border border-[#CAD8D0]">
                {methodologyPillars.map((pillar) => (
                  <div key={pillar.label} className="flex items-center gap-[14px] border-b border-[#CAD8D0] p-[12px_18px] text-[12.5px] last:border-b-0">
                    <span className={cn('h-[7px] w-[7px] shrink-0 rounded-full', pillar.tone)} />
                    <span className="flex-1 text-[#2E4438]">{pillar.label}</span>
                    <span className="font-mono text-[10px] text-[#5A7568]">{pillar.weight}</span>
                  </div>
                ))}
              </div>

              <Link href="/how-it-works" className="mt-5 inline-block border-b border-[rgba(26,122,74,0.3)] pb-0.5 text-[12px] font-semibold text-[#1A7A4A] transition hover:border-[#1A7A4A]">
                Read the full methodology →
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="border-t border-white/[0.05] bg-[#0a1c2a] py-[108px] text-white">
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30">
            <span className="h-px w-5 bg-current" />
            Access
          </span>
          <h2 className="mt-4 font-serif text-[clamp(30px,4vw,48px)] font-bold leading-[1.04] tracking-[-0.02em] text-white">
            Three ways to find the right advisor.
          </h2>
        </Reveal>

        <Reveal delay={80} className="mt-14">
          <div className="grid gap-px bg-white/[0.06] lg:grid-cols-3">
            {pricingTiers.map((tier, index) => (
              <article
                key={tier.name}
                className={cn(
                  'relative flex flex-col bg-[#0F2538] p-[36px_32px]',
                  tier.featured && 'border-t-2 border-[#2DBD74]',
                  !tier.featured && index === 2 && 'border-t-2 border-white/25 bg-white/[0.04]',
                )}
              >
                {tier.featured && (
                  <div className="absolute -top-px left-8 bg-[#1A7A4A] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">{tier.name}</div>
                <div className="mb-1.5">
                  <span className="font-serif text-[52px] font-bold leading-none tracking-[-0.03em] text-white">
                    <sup className="align-super text-[24px] font-semibold">$</sup>
                    {tier.price.replace('$', '')}
                  </span>
                  <span className="ml-1 text-[13px] text-white/35">{tier.note}</span>
                </div>
                <p className="mb-6 text-[13px] leading-[1.6] text-white/40">{tier.description}</p>

                {index === 2 && (
                  <div className="mb-5 flex items-center gap-[9px] border border-white/[0.1] bg-white/[0.05] p-[10px_14px]">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.08]">
                      <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" viewBox="0 0 13 13">
                        <path d="M2 2.5C2 2 2.5 1.5 3 1.5h1.5l1 2.5L4 5.5s.5 2 2 3.5 3.5 2 3.5 2l1.5-1.5 2.5 1V12c0 .5-.5 1-1 1C5 13 2 7.5 2 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <strong className="block text-[12px] text-white/85">1-on-1 Strategy Call</strong>
                      <span className="text-[12px] text-white/50">60-minute session with our team</span>
                    </div>
                  </div>
                )}

                <ul className="mb-7 flex flex-1 flex-col gap-[9px]">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-[9px] text-[13px] text-white/55">
                      <span className="mt-0.5 shrink-0 font-semibold text-[#2DBD74]">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className={cn(
                    'mt-auto block py-[13px] text-center text-[13px] font-semibold tracking-[0.04em] transition-colors',
                    tier.featured
                      ? 'bg-[#1A7A4A] text-white hover:bg-[#22995E]'
                      : index === 2
                      ? 'border border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.15]'
                      : 'border border-white/[0.15] text-white/60 hover:border-white/40 hover:text-white'
                  )}
                >
                  {tier.ctaLabel}
                </Link>
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-6 text-center text-[12px] text-white/30" delay={120}>
          Search any advisor free — no account required. Full profile unlocks when you&apos;re ready.
        </Reveal>
      </div>
    </section>
  );
}

function PersonaSection() {
  const [activePersona, setActivePersona] = useState(0);
  const active = personas[activePersona];

  const scoreColor = (tone: 'good' | 'warn' | 'risk') => {
    if (tone === 'risk') return '#EF4444';
    if (tone === 'warn') return '#F59E0B';
    return '#2DBD74';
  };

  return (
    <section className="border-t border-[#CAD8D0] bg-[#F6F8F7] py-[108px] text-[#0C1810]">
      <div className="container-page">
        <Reveal>
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5A7568]">
            <span className="h-px w-5 bg-current" />
            Who It&apos;s For
          </span>
          <h2 className="mt-4 font-serif text-[clamp(32px,4vw,52px)] font-bold leading-[1.05] tracking-[-0.02em] text-[#0C1810]">
            Built for every investor.<br />
            <em className="italic text-[#1A7A4A]">Calibrated to your situation.</em>
          </h2>
        </Reveal>

        <Reveal delay={80} className="mt-14">
          <div className="grid items-stretch lg:grid-cols-[340px_1fr]">
            {/* Tabs */}
            <div className="flex flex-col border border-[#CAD8D0] bg-[#E6F4ED] lg:border-r-0">
              {personas.map((persona, index) => (
                <button
                  key={persona.persona}
                  type="button"
                  onClick={() => setActivePersona(index)}
                  className={cn(
                    'relative border-b border-[#CAD8D0] px-[28px] py-[22px] text-left transition-colors last:border-b-0',
                    index === activePersona ? 'bg-white' : 'hover:bg-white/50'
                  )}
                >
                  {/* Left accent bar */}
                  <span
                    className={cn(
                      'absolute inset-y-0 left-0 w-0.5 origin-center bg-[#1A7A4A] transition-transform duration-200',
                      index === activePersona ? 'scale-y-100' : 'scale-y-0'
                    )}
                  />
                  <span className={cn(
                    'block text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors',
                    index === activePersona ? 'text-[#1A7A4A]' : 'text-[#5A7568]'
                  )}>
                    {persona.persona}
                  </span>
                  <span className={cn(
                    'block font-serif text-[16px] font-semibold leading-[1.25] transition-colors',
                    index === activePersona ? 'text-[#0C1810]' : 'text-[#5A7568]'
                  )}>
                    {persona.situation}
                  </span>
                  {index === activePersona && (
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[16px] text-[#1A7A4A]">→</span>
                  )}
                </button>
              ))}
            </div>

            {/* Panel */}
            <div key={active.persona} className="border border-[#CAD8D0] bg-white p-[36px_44px]">
              <div className="mb-5">
                <span className="mb-[14px] inline-flex items-center gap-[7px] text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A7A4A]">
                  <span className="h-px w-4 bg-current" />
                  {active.tag}
                </span>
                <h3 className="font-serif text-[22px] font-semibold leading-[1.3] text-[#0C1810]">{active.blurb}</h3>
              </div>

              {/* Search simulation */}
              <div className="mb-4 flex items-center gap-[10px] border border-[#CAD8D0] bg-[#E6F4ED] p-[9px_16px]">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5A7568]">
                  {active.searchLabel}
                </span>
                <span className="flex-1 text-[13px] italic text-[#2E4438]">{active.searchQuery}</span>
                <span className="shrink-0 bg-[rgba(26,122,74,0.1)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#1A7A4A]">
                  {active.searchResultLabel}
                </span>
              </div>

              {/* Firm card */}
              <div className="border border-[#CAD8D0] bg-[#F6F8F7]">
                <div className="flex items-start justify-between border-b border-[#CAD8D0] p-[14px_18px]">
                  <div>
                    <p className="font-serif text-[15px] font-semibold leading-snug text-[#0C1810]">{active.firmName}</p>
                    <p className="mt-0.5 text-[10px] tracking-[0.04em] text-[#5A7568]">{active.firmMeta}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-[36px] font-bold leading-none tracking-[-0.03em]" style={{ color: scoreColor(active.scoreTone) }}>
                      {active.score}
                    </p>
                    <p className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-[#5A7568]">Visor Score™</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-[14px_18px]">
                  {active.metrics.map((metric) => (
                    <div key={metric.label} className="flex items-center gap-[7px] text-[11px]">
                      <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: scoreColor(metric.tone) }} />
                      <span className="flex-1 text-[#5A7568]">{metric.label}</span>
                      <span className="font-mono text-[10px] font-medium text-[#2E4438]">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finding */}
              <div className={cn(
                'mt-[14px] border-l-2 p-[12px_16px]',
                active.scoreTone === 'risk'
                  ? 'border-[#DC2626] bg-[rgba(220,38,38,0.05)]'
                  : 'border-[#1A7A4A] bg-[#E6F4ED]'
              )}>
                <p className={cn(
                  'mb-[5px] text-[9px] font-bold uppercase tracking-[0.18em]',
                  active.scoreTone === 'risk' ? 'text-[#DC2626]' : 'text-[#1A7A4A]'
                )}>
                  {active.findingLabel}
                </p>
                <p className="text-[12px] leading-[1.6] text-[#5A7568]">{active.finding}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#0a1c2a] pb-0 pt-[120px] text-center text-white">
      {/* Radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(26,122,74,0.15)_0%,transparent_70%)]" />

      <div className="container-page relative z-[2]">
        <Reveal>
          <p className="inline-flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2DBD74]">
            <span className="h-px w-5 bg-[#2DBD74]" />
            Make the Decision
            <span className="h-px w-5 bg-[#2DBD74]" />
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mx-auto mt-6 max-w-3xl font-serif text-[clamp(40px,6vw,76px)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
            You&apos;re about to hand<br />
            someone your <em className="italic text-[#2DBD74]">life savings.</em><br />
            Know the score first.
          </h2>
        </Reveal>

        <Reveal delay={140}>
          <div className="mb-5 mt-10 flex flex-wrap items-center justify-center gap-[14px]">
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 bg-[#1A7A4A] px-9 py-[15px] text-[14px] font-semibold text-white transition-colors hover:bg-[#22995E]"
            >
              Get Full Access
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 14 14">
                <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
              </svg>
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 border border-white/[0.12] px-7 py-[15px] text-[14px] text-white/50 transition-all hover:border-white/30 hover:text-white"
            >
              Search Advisors Free
            </Link>
          </div>
          <p className="text-[11px] text-white/25">
            No account required for basic search. No advisor has paid to appear here.
          </p>
        </Reveal>
      </div>

      {/* Skyline SVG */}
      <div className="relative z-[2] mt-20 w-full">
        <svg viewBox="0 0 1120 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none">
          <path d="M0 160 L0 120 L40 120 L40 80 L60 80 L60 60 L80 60 L80 80 L100 80 L100 40 L120 40 L120 80 L140 80 L140 100 L160 100 L160 70 L180 70 L180 50 L200 50 L200 70 L220 70 L220 90 L240 90 L240 55 L260 55 L260 75 L280 75 L280 45 L300 45 L300 75 L320 75 L320 95 L340 95 L340 65 L360 65 L360 85 L380 85 L380 105 L400 105 L400 70 L420 70 L420 50 L440 50 L440 70 L460 70 L460 90 L480 90 L480 60 L500 60 L500 40 L520 40 L520 60 L540 60 L540 80 L560 80 L560 55 L580 55 L580 75 L600 75 L600 95 L620 95 L620 65 L640 65 L640 45 L660 45 L660 65 L680 65 L680 85 L700 85 L700 105 L720 105 L720 75 L740 75 L740 55 L760 55 L760 75 L780 75 L780 95 L800 95 L800 65 L820 65 L820 85 L840 85 L840 105 L860 105 L860 75 L880 75 L880 55 L900 55 L900 75 L920 75 L920 95 L940 95 L940 65 L960 65 L960 85 L980 85 L980 105 L1000 105 L1000 120 L1020 120 L1020 100 L1040 100 L1040 120 L1060 120 L1060 140 L1080 140 L1080 120 L1120 120 L1120 160 Z" fill="rgba(255,255,255,0.03)" />
          <path d="M0 160 L0 130 L40 130 L40 90 L80 90 L80 70 L120 70 L120 90 L160 90 L160 110 L200 110 L200 80 L240 80 L240 100 L280 100 L280 120 L320 120 L320 100 L360 100 L360 120 L400 120 L400 140 L440 140 L440 110 L480 110 L480 90 L520 90 L520 110 L560 110 L560 130 L600 130 L600 110 L640 110 L640 130 L680 130 L680 150 L720 150 L720 130 L760 130 L760 110 L800 110 L800 130 L840 130 L840 150 L880 150 L880 130 L920 130 L920 110 L960 110 L960 130 L1000 130 L1000 150 L1040 150 L1040 130 L1080 130 L1080 150 L1120 150 L1120 160 Z" fill="rgba(255,255,255,0.02)" />
        </svg>
      </div>
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
      <StakesCalculator />
      <HowItWorks />
      <ProofStrip />
      <MethodologySection />
      <PricingSection />
      <PersonaSection />
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
