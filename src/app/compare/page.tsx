'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
const supabase = createSupabaseBrowserClient();

interface FirmBasic {
  crd: number;
  primary_business_name: string;
}

interface FeeTier {
  min_aum: string | null;
  max_aum: number | null;
  fee_pct: number | null;
}

interface FirmComparison {
  crd: number;
  name: string;
  location: string;
  aum: string;
  aumRaw: number | null;
  employees: string;
  feeMin: string;
  wealthTier: string;
  clientBase: string;
  website: string;
  feeTiers: FeeTier[];
}

const INDUSTRY_MEDIANS = [
  { breakpoint: 500_000, median: 1.00 },
  { breakpoint: 1_000_000, median: 1.00 },
  { breakpoint: 5_000_000, median: 0.70 },
  { breakpoint: 10_000_000, median: 0.55 },
  { breakpoint: 25_000_000, median: 0.50 },
  { breakpoint: 50_000_000, median: 0.50 },
  { breakpoint: 100_000_000, median: 0.50 },
];

function getIndustryMedian(amount: number): number {
  let closest = INDUSTRY_MEDIANS[0];
  for (const bp of INDUSTRY_MEDIANS) {
    if (Math.abs(amount - bp.breakpoint) <= Math.abs(amount - closest.breakpoint)) closest = bp;
  }
  return closest.median;
}

function calcTieredFee(amount: number, tiers: FeeTier[]): number {
  if (tiers.length === 0) return 0;
  const sorted = [...tiers].filter(t => t.fee_pct != null).sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'));
  let totalFee = 0, remaining = amount;
  for (const tier of sorted) {
    if (remaining <= 0) break;
    const tierMin = parseInt(tier.min_aum || '0');
    const tierMax = tier.max_aum;
    const bracketSize = tierMax ? tierMax - tierMin : remaining;
    const taxable = Math.min(remaining, bracketSize);
    totalFee += taxable * (tier.fee_pct! / 100);
    remaining -= taxable;
  }
  return totalFee;
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

export default function ComparePage() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const [results, setResults] = useState<FirmBasic[]>([]);
  const [selected, setSelected] = useState<FirmBasic[]>([]);
  const [comparisonData, setComparisonData] = useState<FirmComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [initialLoad, setInitialLoad] = useState(true);
  const [feeInput, setFeeInput] = useState('');

  // Handle ?add=CRD parameter from firm profile Compare button
  useEffect(() => {
    if (!initialLoad) return;
    
    const params = new URLSearchParams(window.location.search);
    const addCrds = params.get('add');
    if (addCrds) {
      const crds = addCrds.split(',').map(c => parseInt(c)).filter(c => !isNaN(c));
      if (crds.length > 0) {
        // Fetch firm names and add to selection
        supabase.from('firmdata_current')
          .select('crd, primary_business_name')
          .in('crd', crds)
          .then(({ data }) => {
            if (data && data.length > 0) {
              const firms = data.map(d => ({ crd: d.crd, primary_business_name: d.primary_business_name! }));
              setSelected(firms.slice(0, 4));
            }
          });
        // Clean URL
        router.replace('/compare');
      }
    }
    setInitialLoad(false);
  }, [initialLoad, router]);

  // Search firms
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('firmdata_current')
        .select('crd, primary_business_name')
        .ilike('primary_business_name', `%${query}%`)
        .limit(10);
      setResults((data || []).filter(d => d.primary_business_name).map(d => ({
        crd: d.crd,
        primary_business_name: d.primary_business_name!
      })) as FirmBasic[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch comparison data when selected changes
  const fetchComparison = useCallback(async () => {
    if (selected.length === 0) { setComparisonData([]); return; }
    setLoading(true);
    const data: FirmComparison[] = [];

    for (const firm of selected) {
      const [{ data: current }, { data: fees }, { data: profile }, { data: web }] = await Promise.all([
        supabase.from('firmdata_current').select('aum, employee_total, main_office_city, main_office_state').eq('crd', firm.crd).single(),
        supabase.from('firmdata_feetiers').select('fee_pct, min_aum').eq('crd', firm.crd),
        supabase.from('firmdata_profile_text').select('wealth_tier, client_base').eq('crd', firm.crd).single(),
        supabase.from('firmdata_website').select('website').eq('crd', firm.crd).single(),
      ]);

      const minFee = fees && fees.length > 0
        ? Math.min(...fees.filter((f: { fee_pct: number | null }) => f.fee_pct != null).map((f: { fee_pct: number | null }) => f.fee_pct!))
        : null;

      data.push({
        crd: firm.crd,
        name: firm.primary_business_name,
        location: current ? `${current.main_office_city || ''}, ${current.main_office_state || ''}` : 'N/A',
        aum: formatAUM(current?.aum),
        aumRaw: current?.aum || null,
        employees: current?.employee_total?.toLocaleString() || 'N/A',
        feeMin: minFee != null ? `${minFee}%` : 'N/A',
        wealthTier: profile?.wealth_tier || 'N/A',
        clientBase: profile?.client_base || 'N/A',
        website: web?.website || 'N/A',
        feeTiers: (fees || []) as FeeTier[],
      });
    }
    setComparisonData(data);
    setLoading(false);
  }, [selected]);

  useEffect(() => { fetchComparison(); }, [fetchComparison]);

  const addFirm = (firm: FirmBasic) => {
    if (selected.length >= 4 || selected.some(s => s.crd === firm.crd)) return;
    setSelected([...selected, firm]);
    setQuery('');
    setResults([]);
  };

  const removeFirm = (crd: number) => {
    setSelected(selected.filter(s => s.crd !== crd));
  };

  const rows: { label: string; key: keyof Omit<FirmComparison, 'crd' | 'name'> }[] = [
    { label: 'Location', key: 'location' },
    { label: 'AUM', key: 'aum' },
    { label: 'Employees', key: 'employees' },
    { label: 'Fee Structure', key: 'feeMin' },
    { label: 'Wealth Tier', key: 'wealthTier' },
    { label: 'Client Base', key: 'clientBase' },
    { label: 'Website', key: 'website' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900">Compare Advisors Side-by-Side</h1>
      <p className="mt-1 text-sm text-slate-500">Select up to 4 firms to compare key metrics.</p>

      {/* Search */}
      <div className="relative mt-4 max-w-md">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSelectedIndex(prev => Math.max(prev - 1, -1));
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
              e.preventDefault();
              if (results[selectedIndex] && selected.length < 4) {
                addFirm(results[selectedIndex]);
                setQuery('');
                setResults([]);
                setSelectedIndex(-1);
              }
            }
          }}
          placeholder="Search firms by name..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto">
            {results.map((r, idx) => (
              <button
                key={r.crd}
                onClick={() => addFirm(r)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  idx === selectedIndex ? 'bg-green-100 text-green-800' : 'hover:bg-green-50 text-slate-700'
                }`}
              >
                {r.primary_business_name} <span className="text-slate-400">#{r.crd}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {selected.map(firm => (
          <div key={firm.crd} className="flex items-center gap-2 rounded-lg border border-green-600 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
            {firm.primary_business_name}
            <button onClick={() => removeFirm(firm.crd)} className="text-green-400 hover:text-green-700">×</button>
          </div>
        ))}
        {selected.length < 4 && selected.length > 0 && (
          <span className="text-xs text-slate-400 self-center">Add up to {4 - selected.length} more</span>
        )}
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading comparison...</p>}

      {comparisonData.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="mt-6 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:hidden">
            {comparisonData.map(firm => (
              <Card key={firm.crd} className="min-w-[260px] shrink-0 snap-start">
                <CardContent>
                  <h3 className="font-semibold text-slate-900 text-base mb-3">{firm.name}</h3>
                  <div className="space-y-2">
                    {rows.map(row => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="text-slate-900 font-medium text-right max-w-[60%] truncate">{firm[row.key]}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="mt-8 overflow-x-auto hidden md:block">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="sticky left-0 bg-white p-4 text-left text-xs font-medium text-slate-500 w-40">Metric</th>
                  {comparisonData.map(f => (
                    <th key={f.crd} className="p-4 text-left font-semibold text-slate-900">{f.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-slate-50' : ''}`}>
                    <td className="sticky left-0 bg-inherit p-4 text-xs font-medium text-slate-500">{row.label}</td>
                    {comparisonData.map(f => (
                      <td key={f.crd} className="p-4 text-slate-700">
                        {row.key === 'website' && f.website !== 'N/A' ? (
                          <a href={`https://${f.website}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{f.website}</a>
                        ) : f[row.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Side-by-Side Fee Calculator */}
          <Card className="mt-8">
            <CardContent>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Fee Calculator</h3>
              <p className="text-xs text-slate-500 mb-4">Enter your portfolio value to compare estimated fees across firms</p>
              
              <div className="relative max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter investable assets"
                  value={feeInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, '');
                    if (!digits) { setFeeInput(''); return; }
                    let num = parseInt(digits, 10);
                    if (num > 1_000_000_000) num = 1_000_000_000;
                    setFeeInput(num.toLocaleString('en-US'));
                  }}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-7 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {(() => {
                const amount = parseInt(feeInput.replace(/[^0-9]/g, ''), 10) || 0;
                if (amount <= 0) return null;
                const industryMedian = getIndustryMedian(amount);
                const industryFee = amount * (industryMedian / 100);

                return (
                  <div className="mt-6">
                    {/* Firm fee bars */}
                    <div className="space-y-4">
                      {comparisonData.map((firm) => {
                        const hasTiers = firm.feeTiers.length > 0;
                        const annualFee = hasTiers ? calcTieredFee(amount, firm.feeTiers) : industryFee;
                        const effectiveRate = amount > 0 ? (annualFee / amount) * 100 : 0;
                        const maxRate = Math.max(...comparisonData.map(f => {
                          const fee = f.feeTiers.length > 0 ? calcTieredFee(amount, f.feeTiers) : industryFee;
                          return amount > 0 ? (fee / amount) * 100 : 0;
                        }), industryMedian) * 1.2;

                        const barColor = effectiveRate <= industryMedian - 0.005 ? 'bg-green-500'
                          : effectiveRate >= industryMedian + 0.005 ? 'bg-red-500'
                          : 'bg-yellow-500';

                        return (
                          <div key={firm.crd}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-slate-900 truncate mr-2">{firm.name}</span>
                              <span className="text-slate-700 whitespace-nowrap">
                                {formatCompact(annualFee)}/yr
                                <span className="text-slate-400 ml-1">({effectiveRate.toFixed(2)}%)</span>
                              </span>
                            </div>
                            <div className="h-5 bg-slate-100 rounded-full overflow-hidden relative">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${maxRate > 0 ? (effectiveRate / maxRate) * 100 : 0}%` }}
                              />
                              {/* Industry median marker */}
                              <div
                                className="absolute top-0 h-full w-0.5 bg-slate-400"
                                style={{ left: `${maxRate > 0 ? (industryMedian / maxRate) * 100 : 0}%` }}
                              />
                            </div>
                            {!hasTiers && (
                              <p className="text-[10px] text-slate-400 mt-0.5">* Using industry median (no disclosed fee schedule)</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-0.5 bg-slate-400"></span> Industry Median ({industryMedian.toFixed(2)}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span> Below
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span> Above
                      </span>
                    </div>

                    {/* 10-year projection table */}
                    <div className="mt-6 overflow-x-auto">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">10-Year Fee Impact (7% annual return)</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="py-2 text-left text-xs font-medium text-slate-500">Firm</th>
                            <th className="py-2 text-right text-xs font-medium text-slate-500">Annual Fee</th>
                            <th className="py-2 text-right text-xs font-medium text-slate-500">10-Yr Value</th>
                            <th className="py-2 text-right text-xs font-medium text-slate-500">Total Fees Paid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.map((firm) => {
                            const hasTiers = firm.feeTiers.length > 0;
                            const annualFee = hasTiers ? calcTieredFee(amount, firm.feeTiers) : industryFee;
                            const rate = amount > 0 ? annualFee / amount : 0;
                            let value = amount, totalFees = 0;
                            for (let y = 0; y < 10; y++) {
                              const fee = value * rate;
                              totalFees += fee;
                              value = (value - fee) * 1.07;
                            }
                            return (
                              <tr key={firm.crd} className="border-b border-slate-100">
                                <td className="py-2 font-medium text-slate-700 truncate max-w-[150px]">{firm.name}</td>
                                <td className="py-2 text-right text-slate-600">{formatCompact(annualFee)}</td>
                                <td className="py-2 text-right text-slate-900 font-medium">{formatCompact(value)}</td>
                                <td className="py-2 text-right text-red-600">{formatCompact(totalFees)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
