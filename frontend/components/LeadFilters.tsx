import type { AcquisitionFit } from '@/types/lead';

export type FitFilter = 'All' | AcquisitionFit;
export type SortOrder = 'desc' | 'asc';

const FIT_OPTIONS: FitFilter[] = ['All', 'High', 'Medium', 'Low'];

interface LeadFiltersProps {
  fit: FitFilter;
  onFitChange: (fit: FitFilter) => void;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  search: string;
  onSearchChange: (search: string) => void;
  counts: Record<FitFilter, number>;
}

export default function LeadFilters({
  fit,
  onFitChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  counts,
}: LeadFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-surface-border bg-surface-raised p-1" role="tablist">
        {FIT_OPTIONS.map((option) => {
          const active = option === fit;
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onFitChange(option)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {option === 'All' ? 'All' : `${option} Fit`}
              <span className={`ml-1.5 text-xs ${active ? 'text-brand-100' : 'text-slate-500'}`}>{counts[option]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search company or industry…"
          className="input sm:w-64"
          aria-label="Search leads"
        />
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <span className="whitespace-nowrap">Sort by score</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOrder)}
            className="input"
            aria-label="Sort by AI readiness score"
          >
            <option value="desc">Highest first</option>
            <option value="asc">Lowest first</option>
          </select>
        </label>
      </div>
    </div>
  );
}
