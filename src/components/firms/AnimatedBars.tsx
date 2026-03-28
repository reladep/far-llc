'use client';

import { useEffect, useRef, useState } from 'react';

interface Bar {
  label: string;
  score: number;
  color: string;
  tip?: string;
}

interface AnimatedBarsProps {
  bars: Bar[];
}

export default function AnimatedBars({ bars }: AnimatedBarsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="vfp-vvs-bars">
      {bars.map((b, i) => (
        <div key={b.label} className="vfp-bar-row">
          <div className="vfp-bar-label">
            {b.label}
            {b.tip && <span className="vfp-info-tip" title={b.tip}>ⓘ</span>}
          </div>
          <div className="vfp-bar-track">
            <div
              className="vfp-bar-fill"
              style={{
                width: visible ? `${b.score <= 10 ? b.score * 10 : b.score}%` : '0%',
                background: b.color,
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </div>
          <div className="vfp-bar-val" style={{ color: b.color }}>
            {Math.round(b.score)}
          </div>
        </div>
      ))}
    </div>
  );
}
