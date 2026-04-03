'use client';

import { useMemo, useState } from 'react';
import { projectGrowthSeries, formatCompact } from '@/lib/fee-utils';

interface CompoundingImpactProps {
  aum: number;
  feePercent: number;
  bracket: { p25: number; median: number };
  isOverpaying: boolean;
  isSignificantlyOver: boolean;
}

const CSS = `
  .ci-wrap { margin-top: 28px; }
  .ci-header { font-size: 10px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: #5A7568; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .ci-header::after { content: ''; flex: 1; height: 1px; background: #CAD8D0; }

  .ci-controls { display: flex; gap: 32px; margin-bottom: 24px; }
  .ci-slider-group { flex: 1; }
  .ci-slider-top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
  .ci-slider-label { font-size: 9px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #5A7568; }
  .ci-slider-val { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 600; color: #0C1810; }
  .ci-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: #CAD8D0; outline: none; cursor: pointer; accent-color: #2DBD74; }
  .ci-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #2DBD74; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.15); cursor: pointer; transition: transform .15s; }
  .ci-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
  .ci-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #2DBD74; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.15); cursor: pointer; }

  .ci-table { width: 100%; border: 1px solid #CAD8D0; border-collapse: collapse; }
  .ci-table th { font-size: 9px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #5A7568; padding: 10px 14px; text-align: left; border-bottom: 1px solid #CAD8D0; background: #F6F8F7; }
  .ci-table th:not(:first-child) { text-align: center; }
  .ci-table td { padding: 12px 14px; border-bottom: 1px solid #E8EDEA; font-size: 12px; color: #0C1810; }
  .ci-table td:not(:first-child) { text-align: center; font-family: 'DM Mono', monospace; font-size: 11px; }
  .ci-table tr:last-child td { border-bottom: none; }
  .ci-table .ci-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }
  .ci-table .ci-delta { font-family: 'DM Mono', monospace; font-size: 10px; display: block; margin-top: 2px; }
  .ci-table .ci-delta.pos { color: #1A7A4A; }
  .ci-table .ci-delta.neg { color: #EF4444; }
  .ci-table .ci-delta.even { color: #5A7568; }

  @media (max-width: 640px) {
    .ci-controls { flex-direction: column; gap: 18px; }
  }
  @media (max-width: 480px) {
    .ci-table th { padding: 8px 10px; font-size: 8px; letter-spacing: .1em; }
    .ci-table td { padding: 10px; font-size: 11px; }
    .ci-table td:not(:first-child) { font-size: 10px; }
  }
`;

export default function CompoundingImpact({
  aum, feePercent, bracket, isOverpaying, isSignificantlyOver,
}: CompoundingImpactProps) {
  const [years, setYears] = useState(20);
  const [returnPct, setReturnPct] = useState(7);

  const returnRate = returnPct / 100;

  const p25Final = useMemo(
    () => projectGrowthSeries(aum, bracket.p25 / 100, years, returnRate).at(-1)!,
    [aum, bracket.p25, years, returnRate],
  );
  const medianFinal = useMemo(
    () => projectGrowthSeries(aum, bracket.median / 100, years, returnRate).at(-1)!,
    [aum, bracket.median, years, returnRate],
  );
  const yourFinal = useMemo(
    () => projectGrowthSeries(aum, feePercent / 100, years, returnRate).at(-1)!,
    [aum, feePercent, years, returnRate],
  );

  const yourColor = isSignificantlyOver ? '#EF4444' : isOverpaying ? '#F59E0B' : '#1A7A4A';

  const rows = [
    { label: '25th Percentile Fee', rate: bracket.p25, color: '#1A7A4A', final: p25Final },
    { label: 'Peer Median', rate: bracket.median, color: '#5A7568', final: medianFinal },
    { label: 'Your Fee', rate: feePercent, color: yourColor, final: yourFinal },
  ];

  return (
    <div className="ci-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ci-header">Portfolio compounding impact</div>

      <div className="ci-controls">
        <div className="ci-slider-group">
          <div className="ci-slider-top">
            <div className="ci-slider-label">Time horizon</div>
            <div className="ci-slider-val">{years} years</div>
          </div>
          <input
            type="range"
            className="ci-slider"
            min={5}
            max={30}
            step={1}
            value={years}
            onChange={e => setYears(Number(e.target.value))}
          />
        </div>
        <div className="ci-slider-group">
          <div className="ci-slider-top">
            <div className="ci-slider-label">Gross return</div>
            <div className="ci-slider-val">{returnPct}%</div>
          </div>
          <input
            type="range"
            className="ci-slider"
            min={5}
            max={15}
            step={1}
            value={returnPct}
            onChange={e => setReturnPct(Number(e.target.value))}
          />
        </div>
      </div>

      <table className="ci-table">
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Rate</th>
            <th>Portfolio value</th>
            <th>Fees paid</th>
            <th>vs. You</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const delta = r.final.value - yourFinal.value;
            const isYou = i === rows.length - 1;
            return (
              <tr key={i}>
                <td>
                  <span className="ci-dot" style={{ background: r.color }} />
                  {r.label}
                </td>
                <td>{r.rate.toFixed(2)}%</td>
                <td>{formatCompact(r.final.value)}</td>
                <td>{formatCompact(r.final.totalFees)}</td>
                <td>
                  {isYou ? (
                    <span className="ci-delta even">—</span>
                  ) : delta > 0 ? (
                    <span className="ci-delta pos">+{formatCompact(delta)}</span>
                  ) : delta < 0 ? (
                    <span className="ci-delta neg">-{formatCompact(Math.abs(delta))}</span>
                  ) : (
                    <span className="ci-delta even">$0</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
