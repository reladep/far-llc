'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
const supabase = createSupabaseBrowserClient();

interface FirmBasic {
  crd: number;
  primary_business_name: string;
}

interface FirmComparison {
  crd: number;
  name: string;
  location: string;
  aum: string;
  employees: string;
  feeMin: string;
  wealthTier: string;
  clientBase: string;
  website: string;
}

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

export default function ComparePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FirmBasic[]>([]);
  const [selected, setSelected] = useState<FirmBasic[]>([]);
  const [comparisonData, setComparisonData] = useState<FirmComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

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
        employees: current?.employee_total?.toLocaleString() || 'N/A',
        feeMin: minFee != null ? `${minFee}%` : 'N/A',
        wealthTier: profile?.wealth_tier || 'N/A',
        clientBase: profile?.client_base || 'N/A',
        website: web?.website || 'N/A',
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
        </>
      )}
    </div>
  );
}
