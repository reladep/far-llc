'use client';

import { useEffect, useRef } from 'react';

const CIRCUMFERENCE = 314; // 2π × 50

interface ScoreRingProps {
  score: number;
}

export default function ScoreRing({ score }: ScoreRingProps) {
  const ringRef = useRef<SVGCircleElement>(null);

  const clamped = Math.min(Math.max(Math.round(score), 0), 100);
  const col = clamped >= 70 ? '#2DBD74' : clamped >= 50 ? '#F59E0B' : '#EF4444';
  const targetOffset = CIRCUMFERENCE * (1 - clamped / 100);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    ring.style.strokeDashoffset = String(CIRCUMFERENCE);
    const t = setTimeout(() => {
      ring.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.25,0.46,0.45,0.94)';
      ring.style.strokeDashoffset = String(targetOffset);
    }, 400);
    return () => clearTimeout(t);
  }, [targetOffset]);

  return (
    <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        <circle
          ref={ringRef}
          cx="60" cy="60" r="50"
          fill="none"
          stroke={col}
          strokeWidth="6"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 40, fontWeight: 700,
          lineHeight: 1, letterSpacing: '-0.03em', color: '#fff',
        }}>
          {clamped}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>/100</div>
      </div>
    </div>
  );
}
