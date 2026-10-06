import { config } from '../config.js';
import { analyzeLeadWithAI, isAIEnabled } from './openaiService.js';
import { generateMockAnalysis } from '../utils/mockEnrichment.js';
import { mapWithConcurrency } from '../utils/concurrency.js';

async function enrichOne(lead) {
  try {
    const analysis = await analyzeLeadWithAI(lead);
    return { ...lead, ...analysis, enrichmentSource: 'openai', enrichedAt: new Date().toISOString() };
  } catch (err) {
    const reason = err?.message || 'Unknown AI error';
    if (isAIEnabled()) {
      console.warn(`[enrich] Falling back for "${lead.companyName}": ${reason}`);
    }
    return {
      ...lead,
      ...generateMockAnalysis(lead),
      enrichmentSource: 'fallback',
      fallbackReason: reason,
      enrichedAt: new Date().toISOString(),
    };
  }
}

export async function enrichLeads(leads) {
  const startedAt = Date.now();
  const enriched = await mapWithConcurrency(leads, config.enrichment.concurrency, enrichOne);
  const aiEnriched = enriched.filter((l) => l.enrichmentSource === 'openai').length;

  return {
    leads: enriched,
    meta: {
      total: enriched.length,
      aiEnriched,
      fallback: enriched.length - aiEnriched,
      aiEnabled: isAIEnabled(),
      model: config.openai.model,
      durationMs: Date.now() - startedAt,
    },
  };
}
