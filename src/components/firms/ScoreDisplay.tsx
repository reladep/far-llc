'use client';

import { getStarRating, getScoreColor } from '@/types';

interface ScoreDisplayProps {
  score: number | null;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showNumeric?: boolean;
}

export default function ScoreDisplay({ score, showBadge = true, size = 'md', showNumeric = false }: ScoreDisplayProps) {
  if (score === null || score === undefined) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <span className="text-slate-400 text-sm">Score N/A</span>
      </div>
    );
  }

  const { stars, display } = getStarRating(score);
  const colorClass = getScoreColor(score);

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div className={`inline-flex flex-col items-center gap-1 rounded-xl border-2 p-3 ${colorClass}`}>
      <div className={sizeClasses[size]}>{display}</div>
      {showNumeric && (
        <span className="text-sm font-medium opacity-75">({score}/100)</span>
      )}
    </div>
  );
}
