import type { Lead } from '@/types/lead';
import FitBadge from './FitBadge';
import ScoreMeter from './ScoreMeter';

interface LeadCardProps {
  lead: Lead;
  loading?: boolean;
}

function hostname(url?: string) {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function LeadCard({ lead, loading = false }: LeadCardProps) {
  const enriched = typeof lead.aiReadinessScore === 'number';
  const host = hostname(lead.website);

  return (
    <article className="card flex flex-col gap-5 p-5 transition hover:border-slate-600">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">{lead.companyName}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-400">
            {[lead.industry, lead.location].filter(Boolean).join(' · ') || 'No details'}
          </p>
        </div>
        <FitBadge fit={lead.acquisitionFit} />
      </header>

      <dl className="grid grid-cols-3 gap-3 rounded-xl bg-surface/60 p-3 text-xs">
        <div>
          <dt className="text-slate-500">Employees</dt>
          <dd className="mt-0.5 font-medium text-slate-200">{lead.employeeCount?.toLocaleString() ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Revenue</dt>
          <dd className="mt-0.5 truncate font-medium text-slate-200">{lead.annualRevenue ?? '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Website</dt>
          <dd className="mt-0.5 truncate font-medium">
            {host ? (
              <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                {host}
              </a>
            ) : (
              <span className="text-slate-200">—</span>
            )}
          </dd>
        </div>
      </dl>

      <ScoreMeter score={lead.aiReadinessScore} loading={loading} />

      {loading ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
        </div>
      ) : enriched ? (
        <>
          <section>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Growth Bottlenecks</h4>
            <ul className="space-y-1.5">
              {lead.growthBottlenecks?.map((b) => (
                <li key={b} className="flex gap-2 text-sm text-slate-300">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-slate-500" />
                  {b}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-3">
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-brand-400">AI Transformation Angle</h4>
            <p className="text-sm leading-relaxed text-slate-200">{lead.aiTransformationAngle}</p>
          </section>
        </>
      ) : (
        <p className="text-sm text-slate-500">{lead.description ?? 'Run AI enrichment to analyze this company.'}</p>
      )}

      <footer className="mt-auto flex items-center justify-between border-t border-surface-border pt-3 text-xs text-slate-500">
        <span className="truncate">
          {lead.contactName ? `${lead.contactName}${lead.contactEmail ? ` · ${lead.contactEmail}` : ''}` : 'No contact'}
        </span>
        {lead.enrichmentSource && (
          <span
            title={lead.fallbackReason}
            className={`ml-2 flex-none rounded-md px-1.5 py-0.5 font-medium ${
              lead.enrichmentSource === 'openai' ? 'bg-brand-500/10 text-brand-400' : 'bg-slate-700/50 text-slate-400'
            }`}
          >
            {lead.enrichmentSource === 'openai' ? 'Live AI' : 'Fallback'}
          </span>
        )}
      </footer>
    </article>
  );
}
