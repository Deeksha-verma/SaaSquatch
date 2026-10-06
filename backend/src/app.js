import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import leadsRouter from './routes/leads.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (curl, server-to-server) which send no Origin header.
        if (!origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      aiEnabled: Boolean(config.openai.apiKey),
      model: config.openai.model,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(
    '/api/enrich-leads',
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      limit: config.rateLimit.max,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many enrichment requests. Please retry shortly.' } },
    })
  );
  app.use('/api', leadsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
