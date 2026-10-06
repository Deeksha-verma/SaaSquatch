interface ScoreMeterProps {
  score?: number;
  loading?: boolean;
}

function tone(score: number) {
  if (score >= 75) return { bar: 'bg-emerald-400', text: 'text-emerald-300' };
  if (score >= 50) return { bar: 'bg-amber-400', text: 'text-amber-300' };
  return { bar: 'bg-rose-400', text: 'text-rose-300' };
}

export default function ScoreMeter({ score, loading = false }: ScoreMeterProps) {
  const hasScore = typeof score === 'number';
  const colors = hasScore ? tone(score) : { bar: 'bg-slate-600', text: 'text-slate-500' };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">AI Readiness</span>
        <span className={`text-lg font-semibold tabular-nums ${colors.text}`}>
          {loading ? '…' : hasScore ? score : '—'}
          {hasScore && !loading && <span className="text-xs text-slate-500">/100</span>}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
        role="meter"
        aria-label="AI readiness score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hasScore ? score : undefined}
      >
        {loading ? (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-500/60" />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
            style={{ width: `${hasScore ? score : 0}%` }}
          />
        )}
      </div>
    </div>
  );
}
