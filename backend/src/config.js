import 'dotenv/config';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = Object.freeze({
  port: toInt(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  openai: {
    apiKey: process.env.OPENAI_API_KEY?.trim() || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timeoutMs: toInt(process.env.OPENAI_TIMEOUT_MS, 30_000),
  },
  enrichment: {
    maxLeadsPerRequest: toInt(process.env.MAX_LEADS_PER_REQUEST, 50),
    concurrency: toInt(process.env.ENRICHMENT_CONCURRENCY, 5),
  },
  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: toInt(process.env.RATE_LIMIT_MAX, 30),
  },
});
