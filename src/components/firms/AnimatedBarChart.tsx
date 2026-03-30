'use client';

import { useEffect, useRef, useState } from 'react';

export interface BarData {
  label: string;
  fraction: number;     // 0..1 relative to max
  topLabel: string;     // value shown above bar
  delta?: string;       // YoY change label e.g. "+14%"
  deltaPositive?: boolean;
  color?: string;
}

interface AnimatedBarChartProps {
  bars: BarData[];
  title: string;
  subtitle?: string;
}

const CSS = `
  .abc-wrap { padding:20px 24px 14px; }
  .abc-title {
    font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.14em;
    text-transform:uppercase; color:var(--ink-3); margin-bottom:16px;
  }
  .abc-title-sub { font-weight:400; text-transform:none; letter-spacing:0; margin-left:6px; }
  .abc-chart { display:flex; align-items:flex-end; gap:0; height:140px; }
  .abc-col {
    flex:1; display:flex; flex-direction:column; align-items:center; height:100%;
    position:relative; cursor:default; padding:0 2px;
  }
  .abc-col:hover .abc-bar-fill { filter:brightness(1.1); }
  .abc-col:hover .abc-top { color:var(--ink); }
  .abc-col:hover .abc-tooltip { opacity:1; pointer-events:auto; transform:translateX(-50%) translateY(0); }
  .abc-top {
    font-family:var(--mono); font-size:10px; color:var(--ink-3);
    margin-bottom:4px; white-space:nowrap; transition:color .15s;
  }
  .abc-track { flex:1; width:100%; display:flex; align-items:flex-end; }
  .abc-bar-fill {
    width:100%; border-radius:1px 1px 0 0; transition:filter .15s;
  }
  .abc-year {
    font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-top:6px;
  }
  .abc-delta {
    font-family:var(--mono); font-size:10px; font-weight:500; margin-top:1px; height:14px;
  }
  .abc-delta-spacer { height:14px; margin-top:1px; }
  .abc-delta.up { color:var(--green); }
  .abc-delta.dn { color:#C53030; }
  .abc-tooltip {
    position:absolute; bottom:100%; left:50%; transform:translateX(-50%) translateY(4px);
    background:var(--ink); color:#fff; padding:6px 10px; border-radius:4px;
    font-family:var(--mono); font-size:10px; white-space:nowrap; z-index:10;
    opacity:0; pointer-events:none; transition:opacity .15s, transform .15s;
    box-shadow:0 2px 8px rgba(0,0,0,.15);
  }
  .abc-tooltip::after {
    content:''; position:absolute; top:100%; left:50%; transform:translateX(-50%);
    border:4px solid transparent; border-top-color:var(--ink);
  }
`;

export default function AnimatedBarChart({ bars, title, subtitle }: AnimatedBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || revealed.current) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting || revealed.current) return;
        revealed.current = true;
        el.querySelectorAll<HTMLElement>('[data-bar-h]').forEach((bar, i) => {
          const h = bar.dataset.barH!;
          bar.style.height = '0%';
          setTimeout(() => {
            bar.style.transition = 'height 0.7s cubic-bezier(0.25,0.46,0.45,0.94)';
            bar.style.height = h;
          }, i * 80 + 60);
        });
        io.disconnect();
      });
    }, { threshold: 0.15 });

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Show delta for all bars except the first (which has no prior year to compare)
  const showDelta = (bar: BarData, index: number) => {
    if (!bar.delta) return false;
    return index > 0;
  };

  return (
    <div ref={containerRef} className="abc-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="abc-title">
        {title}
        {subtitle && <span className="abc-title-sub">{subtitle}</span>}
      </div>

      <div className="abc-chart">
        {bars.map((bar, i) => {
          const barColor = bar.color ?? '#22995E';

          return (
            <div key={i} className="abc-col">
              <div className="abc-tooltip">
                {bar.topLabel} · {bar.label}
                {bar.delta && <> · {bar.delta} YoY</>}
              </div>
              <div className="abc-top">{bar.topLabel}</div>
              <div className="abc-track">
                <div
                  className="abc-bar-fill"
                  data-bar-h={`${Math.max(bar.fraction * 100, 1)}%`}
                  style={{
                    width: '100%',
                    height: '0%',
                    background: barColor,
                  }}
                />
              </div>
              <div className="abc-year">{bar.label}</div>
              {showDelta(bar, i) && bar.delta ? (
                <div className={`abc-delta ${bar.deltaPositive !== false ? 'up' : 'dn'}`}>
                  {bar.delta}
                </div>
              ) : (
                <div className="abc-delta-spacer" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
