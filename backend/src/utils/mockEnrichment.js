/**
 * Deterministic heuristic analysis used when the OpenAI call is unavailable or fails.
 * The same lead always yields the same result, so the UI stays stable across retries.
 */

const HIGH_SIGNAL_INDUSTRIES = ['saas', 'software', 'fintech', 'analytics', 'martech', 'hr tech', 'healthtech', 'devtools', 'data'];
const MEDIUM_SIGNAL_INDUSTRIES = ['e-commerce', 'ecommerce', 'logistics', 'education', 'edtech', 'insurance', 'legal', 'real estate', 'marketing'];

const BOTTLENECK_POOL = [
  'Manual, sales-led onboarding limits expansion velocity',
  'Fragmented customer data across disconnected tools',
  'High support ticket volume handled by human agents',
  'Limited product-led growth motion and self-serve funnel',
  'Pricing not aligned to usage or value delivered',
  'Legacy codebase slowing feature delivery',
  'Churn concentrated in SMB segment with weak retention tooling',
  'Reporting relies on spreadsheets rather than embedded analytics',
  'Lead qualification is manual and inconsistent',
  'Narrow integration ecosystem limits enterprise adoption',
];

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function generateMockAnalysis(lead) {
  const seed = hashString(`${lead.companyName}|${lead.industry ?? ''}`);
  const industry = (lead.industry ?? '').toLowerCase();

  let score = 40;
  if (HIGH_SIGNAL_INDUSTRIES.some((k) => industry.includes(k))) score += 25;
  else if (MEDIUM_SIGNAL_INDUSTRIES.some((k) => industry.includes(k))) score += 12;

  const employees = lead.employeeCount ?? 0;
  if (employees >= 20 && employees <= 500) score += 12; // sweet spot for acquisition + transformation
  else if (employees > 500) score += 5;

  if (lead.description && lead.description.length > 80) score += 5;
  score += (seed % 17) - 8; // stable jitter in [-8, 8]
  score = Math.min(96, Math.max(12, score));

  const acquisitionFit = score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low';

  // Step 3 is coprime with the pool size (10), so three picks are always distinct.
  const growthBottlenecks = [0, 1, 2].map((i) => BOTTLENECK_POOL[(seed + i * 3) % BOTTLENECK_POOL.length]);

  const sector = lead.industry || 'its market';
  return {
    aiReadinessScore: score,
    acquisitionFit,
    growthBottlenecks,
    aiTransformationAngle: `Embedding AI copilots into the core workflows of ${lead.companyName} could automate manual operations and unlock margin expansion in ${sector}.`,
  };
}
