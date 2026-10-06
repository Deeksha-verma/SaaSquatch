import OpenAI from 'openai';
import { config } from '../config.js';
import { normalizeAnalysis } from '../utils/validation.js';

let client = null;

function getClient() {
  if (!config.openai.apiKey) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: config.openai.timeoutMs,
      maxRetries: 2,
    });
  }
  return client;
}

export const isAIEnabled = () => Boolean(config.openai.apiKey);

const SYSTEM_PROMPT = `You are a senior M&A analyst at a private equity firm that acquires SaaS businesses and transforms them with AI.
Assess each company for SaaS acquisition potential and AI-driven value creation.

Respond ONLY with a JSON object of exactly this shape:
{
  "aiReadinessScore": <integer 0-100: how ready and suitable the business is for AI-led transformation>,
  "acquisitionFit": "High" | "Medium" | "Low",
  "growthBottlenecks": [<2-4 concise strings, each under 15 words, naming concrete growth constraints>],
  "aiTransformationAngle": "<exactly one sentence: the strategic thesis for how AI unlocks value post-acquisition>"
}

Scoring guidance:
- High fit: recurring revenue model, 20-500 employees, workflow-heavy product, clear automation upside.
- Medium fit: some SaaS characteristics but meaningful gaps (services-heavy, small scale, or crowded market).
- Low fit: non-software business, very early stage, or limited AI leverage.
Be specific to the company; avoid generic statements. If data is sparse, infer conservatively.`;

function buildUserPrompt(lead) {
  const fields = {
    companyName: lead.companyName,
    website: lead.website,
    industry: lead.industry,
    employeeCount: lead.employeeCount,
    annualRevenue: lead.annualRevenue,
    location: lead.location,
    description: lead.description,
  };
  const known = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
  return `Analyze this company:\n${JSON.stringify(known, null, 2)}`;
}

/**
 * Calls OpenAI to analyze a single lead. Throws on any failure (missing key,
 * network/API error, invalid JSON, schema mismatch) so callers can fall back.
 */
export async function analyzeLeadWithAI(lead) {
  const openai = getClient();
  if (!openai) throw new Error('OPENAI_API_KEY is not configured');

  const completion = await openai.chat.completions.create({
    model: config.openai.model,
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 500,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(lead) },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned an empty response');

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned malformed JSON');
  }

  return normalizeAnalysis(parsed);
}
