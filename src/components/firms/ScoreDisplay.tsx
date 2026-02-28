'use client';

import { getScoreBadge, getScoreColor } from '@/types';

interface ScoreDisplayProps {
  score: number | null;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreDisplay({ score, showBadge = true, size = 'md' }: ScoreDisplayProps) {
  if (score === null || score === undefined) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <span className="text-slate-400 text-sm">Score N/A</span>
      </div>
    );
  }

  const badge = getScoreBadge(score);
  const colorClass = getScoreColor(score);

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  return (
    <div className={`inline-flex flex-col items-center gap-2 rounded-xl border-2 p-4 ${colorClass}`}>
      <div className="flex items-baseline gap-2">
        <span className={`font-bold ${sizeClasses[size]}`}>{score}</span>
        <span className="text-sm font-medium opacity-75">/ 100</span>
      </div>
      {showBadge && (
        <span className="text-sm font-semibold">{badge}</span>
      )}
    </div>
  );
}