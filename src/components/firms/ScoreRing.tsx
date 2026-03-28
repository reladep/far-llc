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
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle
          ref={ringRef}
          cx="60" cy="60" r="50"
          fill="none"
          stroke={col}
          strokeWidth="7"
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
          fontSize: 22, fontWeight: 700,
          lineHeight: 1, letterSpacing: '-0.03em', color: '#fff',
        }}>
          {clamped}
        </div>
      </div>
    </div>
  );
}
