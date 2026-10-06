import { randomUUID } from 'node:crypto';

const FITS = ['High', 'Medium', 'Low'];
const MAX_TEXT = 2000;

const cleanString = (value, max = 300) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;

/**
 * Validates and normalizes inbound raw leads.
 * Returns sanitized leads plus a list of per-index validation errors.
 */
export function validateRawLeads(payload) {
  const leads = [];
  const errors = [];

  payload.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push({ index, message: 'Lead must be an object.' });
      return;
    }

    const companyName = cleanString(raw.companyName ?? raw.company ?? raw.name, 200);
    if (!companyName) {
      errors.push({ index, message: '"companyName" is required.' });
      return;
    }

    const employeeCount = Number(raw.employeeCount);

    leads.push({
      id: cleanString(raw.id == null ? '' : String(raw.id), 100) ?? randomUUID(),
      companyName,
      website: cleanString(raw.website),
      industry: cleanString(raw.industry, 120),
      employeeCount:
        raw.employeeCount != null && Number.isFinite(employeeCount) && employeeCount >= 0
          ? Math.round(employeeCount)
          : undefined,
      annualRevenue: cleanString(raw.annualRevenue, 60),
      location: cleanString(raw.location, 120),
      description: cleanString(raw.description, MAX_TEXT),
      contactName: cleanString(raw.contactName, 120),
      contactEmail: cleanString(raw.contactEmail, 200),
    });
  });

  return { leads, errors };
}

/**
 * Coerces an untrusted model response into the strict enrichment shape.
 * Throws if the response is unusable so the caller can fall back.
 */
export function normalizeAnalysis(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('AI response is not an object');
  }

  const score = Number(data.aiReadinessScore);
  if (!Number.isFinite(score)) throw new Error('AI response missing numeric aiReadinessScore');

  const fitRaw = String(data.acquisitionFit ?? '').trim().toLowerCase();
  const acquisitionFit = FITS.find((f) => f.toLowerCase() === fitRaw);
  if (!acquisitionFit) throw new Error(`AI response has invalid acquisitionFit: ${data.acquisitionFit}`);

  const growthBottlenecks = (Array.isArray(data.growthBottlenecks) ? data.growthBottlenecks : [])
    .filter((b) => typeof b === 'string' && b.trim())
    .map((b) => b.trim().slice(0, 200))
    .slice(0, 5);
  if (growthBottlenecks.length === 0) throw new Error('AI response missing growthBottlenecks');

  const aiTransformationAngle = cleanString(data.aiTransformationAngle, 400);
  if (!aiTransformationAngle) throw new Error('AI response missing aiTransformationAngle');

  return {
    aiReadinessScore: Math.min(100, Math.max(0, Math.round(score))),
    acquisitionFit,
    growthBottlenecks,
    aiTransformationAngle,
  };
}
