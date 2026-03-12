'use client';

import { useEffect, useRef } from 'react';

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

  return (
    <div ref={containerRef} style={{ padding: '28px 32px 20px' }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--ink-2)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        marginBottom: 20,
      }}>
        {title}
        {subtitle && (
          <span style={{
            color: 'var(--ink-3)', fontWeight: 400,
            textTransform: 'none', letterSpacing: 0, marginLeft: 8,
          }}>
            {subtitle}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
        {bars.map((bar, i) => (
          <div key={i} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', height: '100%',
          }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10,
              color: 'var(--ink-3)', marginBottom: 6, whiteSpace: 'nowrap',
            }}>
              {bar.topLabel}
            </div>
            <div style={{
              flex: 1, width: '100%',
              display: 'flex', alignItems: 'flex-end',
              background: 'rgba(0,0,0,0.04)',
            }}>
              <div
                data-bar-h={`${Math.max(bar.fraction * 100, 1)}%`}
                style={{
                  width: '100%',
                  height: '0%',
                  background: bar.color ?? '#22995E',
                  borderRadius: '1px 1px 0 0',
                }}
              />
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10,
              color: 'var(--ink-3)', marginTop: 8,
            }}>
              {bar.label}
            </div>
            {bar.delta && (
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, marginTop: 2,
                color: bar.deltaPositive !== false ? '#1A7A4A' : '#EF4444',
              }}>
                {bar.delta}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
