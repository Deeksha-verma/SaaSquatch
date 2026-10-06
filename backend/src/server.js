import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[api] SaaSquatch API listening on http://localhost:${config.port}`);
  console.log(
    config.openai.apiKey
      ? `[api] OpenAI enrichment enabled (model: ${config.openai.model})`
      : '[api] OPENAI_API_KEY not set - serving fallback analyses'
  );
});

function shutdown(signal) {
  console.log(`[api] ${signal} received, shutting down gracefully...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('[api] Unhandled promise rejection:', reason);
});
