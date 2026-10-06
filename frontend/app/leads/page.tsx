'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LeadCard from '@/components/LeadCard';
import LeadFilters, { type FitFilter, type SortOrder } from '@/components/LeadFilters';
import StatsBar from '@/components/StatsBar';
import { sampleLeads } from '@/data/sampleLeads';
import { ApiError, checkHealth, enrichLeads } from '@/services/api';
import type { EnrichmentMeta, Lead, RawLead } from '@/types/lead';

type Status = 'idle' | 'loading' | 'success' | 'error';
type ApiStatus = 'checking' | 'online-ai' | 'online-fallback' | 'offline';

const API_STATUS_LABEL: Record<ApiStatus, { text: string; dot: string }> = {
  checking: { text: 'Checking API…', dot: 'bg-slate-500 animate-pulse' },
  'online-ai': { text: 'API online · Live AI', dot: 'bg-emerald-400' },
  'online-fallback': { text: 'API online · Fallback mode (no OpenAI key)', dot: 'bg-amber-400' },
  offline: { text: 'API offline', dot: 'bg-rose-400' },
};

function toRawLead({ id, companyName, website, industry, employeeCount, annualRevenue, location, description, contactName, contactEmail }: Lead): RawLead {
  return { id, companyName, website, industry, employeeCount, annualRevenue, location, description, contactName, contactEmail };
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(sampleLeads);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<EnrichmentMeta | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');

  const [fit, setFit] = useState<FitFilter>('All');
  const [sort, setSort] = useState<SortOrder>('desc');
  const [search, setSearch] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    checkHealth(controller.signal)
      .then((h) => setApiStatus(h.aiEnabled ? 'online-ai' : 'online-fallback'))
      .catch(() => {
        if (!controller.signal.aborted) setApiStatus('offline');
      });
    return () => {
      controller.abort();
      abortRef.current?.abort();
    };
  }, []);

  const runEnrichment = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);
    try {
      const result = await enrichLeads(leads.map(toRawLead), controller.signal);
      const byId = new Map(result.leads.map((l) => [l.id, l]));
      setLeads((prev) => prev.map((l) => byId.get(l.id) ?? l));
      setMeta(result.meta);
      setStatus('success');
      setApiStatus(result.meta.aiEnabled ? 'online-ai' : 'online-fallback');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ABORTED') return;
      setError(err instanceof Error ? err.message : 'Enrichment failed unexpectedly.');
      setStatus('error');
      if (err instanceof ApiError && err.code === 'NETWORK_ERROR') setApiStatus('offline');
    }
  }, [leads]);

  const resetLeads = () => {
    abortRef.current?.abort();
    setLeads(sampleLeads);
    setMeta(null);
    setStatus('idle');
    setError(null);
  };

  const counts = useMemo(() => {
    const c: Record<FitFilter, number> = { All: leads.length, High: 0, Medium: 0, Low: 0 };
    leads.forEach((l) => {
      if (l.acquisitionFit) c[l.acquisitionFit] += 1;
    });
    return c;
  }, [leads]);

  const visibleLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads
      .filter((l) => fit === 'All' || l.acquisitionFit === fit)
      .filter(
        (l) =>
          !q ||
          l.companyName.toLowerCase().includes(q) ||
          (l.industry ?? '').toLowerCase().includes(q) ||
          (l.location ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const sa = a.aiReadinessScore;
        const sb = b.aiReadinessScore;
        // Un-enriched leads always sink to the bottom.
        if (sa === undefined && sb === undefined) return a.companyName.localeCompare(b.companyName);
        if (sa === undefined) return 1;
        if (sb === undefined) return -1;
        return sort === 'desc' ? sb - sa : sa - sb;
      });
  }, [leads, fit, search, sort]);

  const loading = status === 'loading';
  const apiLabel = API_STATUS_LABEL[apiStatus];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className={`h-2 w-2 rounded-full ${apiLabel.dot}`} />
            {apiLabel.text}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Acquisition Leads</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Score SaaS targets for AI readiness, acquisition fit, and post-acquisition transformation potential.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={resetLeads} className="btn-ghost">
            Reset
          </button>
          <button type="button" onClick={runEnrichment} className="btn-primary" disabled={loading || leads.length === 0}>
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                Enriching {leads.length} leads…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M10 1l2.2 5.3L18 7l-4.4 3.9L15 17l-5-3-5 3 1.4-6.1L2 7l5.8-.7L10 1z" />
                </svg>
                {meta ? 'Re-run AI Enrichment' : 'Run AI Enrichment'}
              </>
            )}
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start justify-between gap-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          <div>
            <p className="font-medium">Enrichment failed</p>
            <p className="mt-0.5 text-rose-300/80">{error}</p>
          </div>
          <button type="button" onClick={runEnrichment} className="flex-none font-medium text-rose-200 underline-offset-2 hover:underline">
            Retry
          </button>
        </div>
      )}

      {meta && status === 'success' && (
        <div className="rounded-xl border border-surface-border bg-surface-raised/60 px-4 py-3 text-sm text-slate-400">
          Enriched <span className="font-medium text-slate-200">{meta.total}</span> leads in{' '}
          <span className="font-medium text-slate-200">{(meta.durationMs / 1000).toFixed(1)}s</span> —{' '}
          {meta.aiEnriched} via <span className="text-brand-400">{meta.model}</span>
          {meta.fallback > 0 && <>, {meta.fallback} via heuristic fallback</>}.
        </div>
      )}

      <StatsBar leads={leads} />

      <LeadFilters
        fit={fit}
        onFitChange={setFit}
        sort={sort}
        onSortChange={setSort}
        search={search}
        onSearchChange={setSearch}
        counts={counts}
      />

      {visibleLeads.length > 0 ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} loading={loading} />
          ))}
        </section>
      ) : (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <p className="text-base font-medium text-slate-200">No leads match these filters</p>
          <p className="mt-1 text-sm text-slate-500">
            {fit !== 'All' && counts.High + counts.Medium + counts.Low === 0
              ? 'Run AI enrichment to assign acquisition fit.'
              : 'Try a different filter or search term.'}
          </p>
        </div>
      )}
    </div>
  );
}
