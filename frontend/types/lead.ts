export type AcquisitionFit = 'High' | 'Medium' | 'Low';

export type EnrichmentSource = 'openai' | 'fallback';

export interface RawLead {
  id: string;
  companyName: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  annualRevenue?: string;
  location?: string;
  description?: string;
  contactName?: string;
  contactEmail?: string;
}

export interface LeadEnrichment {
  aiReadinessScore: number;
  acquisitionFit: AcquisitionFit;
  growthBottlenecks: string[];
  aiTransformationAngle: string;
  enrichmentSource: EnrichmentSource;
  fallbackReason?: string;
  enrichedAt: string;
}

export type EnrichedLead = RawLead & LeadEnrichment;

/** A lead in the dashboard: raw until enrichment fields arrive. */
export type Lead = RawLead & Partial<LeadEnrichment>;

export interface EnrichmentMeta {
  total: number;
  aiEnriched: number;
  fallback: number;
  aiEnabled: boolean;
  model: string;
  durationMs: number;
}

export interface EnrichLeadsResponse {
  leads: EnrichedLead[];
  meta: EnrichmentMeta;
}

export interface HealthResponse {
  status: 'ok';
  aiEnabled: boolean;
  model: string;
  timestamp: string;
}

export const isEnriched = (lead: Lead): lead is EnrichedLead =>
  typeof lead.aiReadinessScore === 'number' && lead.acquisitionFit !== undefined;
