import { Router } from 'express';
import { config } from '../config.js';
import { HttpError } from '../middleware/errorHandler.js';
import { validateRawLeads } from '../utils/validation.js';
import { enrichLeads } from '../services/enrichmentService.js';

const router = Router();

/**
 * POST /api/enrich-leads
 * Body: RawLead[]  or  { leads: RawLead[] }
 */
router.post('/enrich-leads', async (req, res, next) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body?.leads;

    if (!Array.isArray(payload)) {
      throw new HttpError(400, 'INVALID_PAYLOAD', 'Expected an array of leads (or an object with a "leads" array).');
    }
    if (payload.length === 0) {
      throw new HttpError(400, 'EMPTY_PAYLOAD', 'At least one lead is required.');
    }
    if (payload.length > config.enrichment.maxLeadsPerRequest) {
      throw new HttpError(
        413,
        'TOO_MANY_LEADS',
        `A maximum of ${config.enrichment.maxLeadsPerRequest} leads can be enriched per request.`
      );
    }

    const { leads, errors } = validateRawLeads(payload);
    if (errors.length > 0) {
      throw new HttpError(422, 'VALIDATION_FAILED', 'One or more leads are invalid.', errors);
    }

    const result = await enrichLeads(leads);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
