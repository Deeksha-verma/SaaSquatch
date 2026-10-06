import type { AcquisitionFit } from '@/types/lead';

const STYLES: Record<AcquisitionFit, string> = {
  High: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  Medium: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  Low: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
};

const DOTS: Record<AcquisitionFit, string> = {
  High: 'bg-emerald-400',
  Medium: 'bg-amber-400',
  Low: 'bg-rose-400',
};

export default function FitBadge({ fit }: { fit?: AcquisitionFit }) {
  if (!fit) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-400 ring-1 ring-inset ring-slate-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        Not enriched
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STYLES[fit]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[fit]}`} />
      {fit} Fit
    </span>
  );
}
