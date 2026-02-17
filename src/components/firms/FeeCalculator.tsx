'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';

interface FeeTier {
  min_aum: string | null;
  max_aum: number | null;
  fee_pct: number | null;
}

interface FeeCalculatorProps {
  feeTiers: FeeTier[];
  crd: string;
}

function formatDollar(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function calcTieredFee(amount: number, tiers: FeeTier[]): number {
  if (tiers.length === 0) return 0;

  const sorted = [...tiers]
    .filter((t) => t.fee_pct != null)
    .sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'));

  if (sorted.length === 0) return 0;

  // Flat fee: single tier with no max
  if (sorted.length === 1) {
    return (amount * (sorted[0].fee_pct! / 100));
  }

  let totalFee = 0;
  let remaining = amount;

  for (let i = 0; i < sorted.length && remaining > 0; i++) {
    const tierMin = parseInt(sorted[i].min_aum || '0');
    const tierMax = sorted[i].max_aum;
    const pct = sorted[i].fee_pct! / 100;

    const bracketSize = tierMax ? tierMax - tierMin : remaining;
    const taxable = Math.min(remaining, bracketSize);
    totalFee += taxable * pct;
    remaining -= taxable;
  }

  return totalFee;
}

export default function FeeCalculator({ feeTiers, crd }: FeeCalculatorProps) {
  const [rawInput, setRawInput] = useState('');

  const amount = useMemo(() => {
    const num = parseInt(rawInput.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }, [rawInput]);

  const annualFee = useMemo(() => calcTieredFee(amount, feeTiers), [amount, feeTiers]);

  const effectiveRate = amount > 0 ? (annualFee / amount) * 100 : 0;

  // Opportunity cost: fees compounded at 7% annual return
  const opportunityCost = (years: number) => {
    if (annualFee <= 0) return 0;
    let total = 0;
    for (let y = 0; y < years; y++) {
      total = (total + annualFee) * 1.07;
    }
    return total;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    if (!digits) {
      setRawInput('');
      return;
    }
    setRawInput(parseInt(digits, 10).toLocaleString('en-US'));
  };

  const validTiers = feeTiers.filter((t) => t.fee_pct != null);

  if (validTiers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <h3 className="font-semibold text-slate-900 mb-3">Fee Calculator</h3>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter investable assets"
            value={rawInput}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {amount > 0 && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs text-slate-500">Estimated Annual Fee</p>
              <p className="text-lg font-bold text-green-700">{formatDollar(annualFee)}</p>
              <p className="text-xs text-slate-500">{effectiveRate.toFixed(2)}% effective rate</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Opportunity Cost of Fees</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[5, 10, 20].map((y) => (
                  <div key={y} className="rounded-lg bg-slate-50 p-2">
                    <p className="text-xs text-slate-400">{y}yr</p>
                    <p className="text-sm font-semibold text-slate-700">{formatDollar(opportunityCost(y))}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Assumes 7% annual return on fees saved</p>
            </div>

            <Link
              href={`/compare?add=${crd}`}
              className="block w-full text-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Compare This Firm
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
