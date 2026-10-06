import type { Lead } from '@/types/lead';

interface Stat {
  label: string;
  value: string;
  hint?: string;
  accent: string;
}

export default function StatsBar({ leads }: { leads: Lead[] }) {
  const enriched = leads.filter((l) => typeof l.aiReadinessScore === 'number');
  const avg = enriched.length
    ? Math.round(enriched.reduce((sum, l) => sum + (l.aiReadinessScore ?? 0), 0) / enriched.length)
    : null;
  const high = enriched.filter((l) => l.acquisitionFit === 'High').length;
  const live = enriched.filter((l) => l.enrichmentSource === 'openai').length;

  const stats: Stat[] = [
    { label: 'Total Leads', value: String(leads.length), accent: 'from-slate-400 to-slate-600' },
    {
      label: 'Enriched',
      value: `${enriched.length}`,
      hint: enriched.length ? `${live} live AI · ${enriched.length - live} fallback` : 'Not yet run',
      accent: 'from-brand-400 to-brand-600',
    },
    { label: 'Avg. AI Readiness', value: avg === null ? '—' : String(avg), hint: avg === null ? undefined : 'out of 100', accent: 'from-sky-400 to-sky-600' },
    { label: 'High Fit Targets', value: String(high), accent: 'from-emerald-400 to-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="card relative overflow-hidden p-4">
          <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${s.accent}`} />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{s.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{s.value}</p>
          {s.hint && <p className="mt-1 text-xs text-slate-500">{s.hint}</p>}
        </div>
      ))}
    </div>
  );
}
