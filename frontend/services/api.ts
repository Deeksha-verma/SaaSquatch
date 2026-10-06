import type { EnrichLeadsResponse, HealthResponse, RawLead } from '@/types/lead';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 120_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  { timeoutMs = DEFAULT_TIMEOUT_MS, signal }: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);
  const onExternalAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
      signal: controller.signal,
    });

    const body = (await res.json().catch(() => null)) as (T & ApiErrorBody) | null;

    if (!res.ok) {
      throw new ApiError(
        body?.error?.message ?? `Request failed with status ${res.status}`,
        res.status,
        body?.error?.code,
        body?.error?.details
      );
    }
    if (body === null) {
      throw new ApiError('Server returned an invalid response', res.status, 'INVALID_RESPONSE');
    }
    return body;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (controller.signal.aborted) {
      const timedOut = (controller.signal.reason as DOMException | undefined)?.name === 'TimeoutError';
      throw new ApiError(timedOut ? 'The request timed out.' : 'The request was cancelled.', 0, timedOut ? 'TIMEOUT' : 'ABORTED');
    }
    throw new ApiError(
      `Unable to reach the API at ${API_BASE_URL}. Is the backend running?`,
      0,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

/** Sends raw leads to the backend for AI enrichment. */
export function enrichLeads(leads: RawLead[], signal?: AbortSignal): Promise<EnrichLeadsResponse> {
  return request<EnrichLeadsResponse>(
    '/api/enrich-leads',
    { method: 'POST', body: JSON.stringify(leads) },
    { signal }
  );
}

/** Checks backend availability and whether live AI is configured. */
export function checkHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health', { method: 'GET' }, { timeoutMs: 5_000, signal });
}
