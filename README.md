# SaaSquatch Platform

AI-powered lead enrichment for SaaS acquisitions. An npm-workspaces monorepo with:

- **backend/**: Node.js + Express API that enriches leads using OpenAI `gpt-4o-mini` (JSON mode), with deterministic fallback analysis when the AI call fails or no key is configured.
- **frontend/**: Next.js 15 (App Router, TypeScript, Tailwind CSS) dashboard at `/leads`.

## Quick start

```bash
npm install                              # installs both workspaces
cp backend/.env.example backend/.env     # then set OPENAI_API_KEY (optional)
cp frontend/.env.local.example frontend/.env.local
npm run dev                              # API on :4000, dashboard on :3000
```

Open http://localhost:3000/leads and click **Run AI Enrichment**.

Without `OPENAI_API_KEY`, the API still responds: every lead is scored by the built-in heuristic and marked `enrichmentSource: "fallback"`.

## Structure

```
.
├── package.json                 # workspaces + dev/start scripts
├── backend/
│   ├── .env.example
│   └── src/
│       ├── server.js            # entrypoint, graceful shutdown
│       ├── app.js               # express app: helmet, cors, json, rate limit
│       ├── config.js            # env parsing
│       ├── routes/leads.js      # POST /api/enrich-leads
│       ├── services/
│       │   ├── openaiService.js     # OpenAI call + prompt
│       │   └── enrichmentService.js # concurrency + per-lead fallback
│       ├── middleware/          # error handler, request logger
│       └── utils/               # validation, mock analysis, concurrency
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx             # redirects to /leads
    │   └── leads/page.tsx       # dashboard
    ├── components/              # LeadCard, ScoreMeter, FitBadge, LeadFilters, StatsBar
    ├── services/api.ts          # backend client
    ├── types/lead.ts
    └── data/sampleLeads.ts
```

## API

### `GET /api/health`

```json
{ "status": "ok", "aiEnabled": true, "model": "gpt-4o-mini", "timestamp": "..." }
```

### `POST /api/enrich-leads`

Body: an array of leads (or `{ "leads": [...] }`). `companyName` is required; the other fields are optional.

```json
[
  {
    "id": "lead-001",
    "companyName": "Ledgerly",
    "website": "https://ledgerly.example.com",
    "industry": "Fintech SaaS",
    "employeeCount": 85,
    "annualRevenue": "$8M ARR",
    "location": "Austin, TX",
    "description": "Accounts-payable automation for mid-market finance teams."
  }
]
```

Response:

```json
{
  "leads": [
    {
      "id": "lead-001",
      "companyName": "Ledgerly",
      "aiReadinessScore": 82,
      "acquisitionFit": "High",
      "growthBottlenecks": ["...", "..."],
      "aiTransformationAngle": "One-sentence thesis.",
      "enrichmentSource": "openai",
      "enrichedAt": "2026-10-06T12:00:00.000Z"
    }
  ],
  "meta": { "total": 1, "aiEnriched": 1, "fallback": 0, "aiEnabled": true, "model": "gpt-4o-mini", "durationMs": 1840 }
}
```

Errors use the shape `{ "error": { "code", "message", "details?" } }`:

| Status | Code |
| ------ | ---- |
| 400 | `INVALID_PAYLOAD`, `EMPTY_PAYLOAD`, `INVALID_JSON` |
| 413 | `TOO_MANY_LEADS`, `PAYLOAD_TOO_LARGE` |
| 422 | `VALIDATION_FAILED` |
| 429 | `RATE_LIMITED` |

Fallback happens per lead: one failed AI call never fails the whole batch. AI output is validated (score clamped to 0-100, fit checked against the enum, required fields present) before it is accepted.

## Configuration

| Variable | Default | Notes |
| -------- | ------- | ----- |
| `PORT` | `4000` | |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated; `*` allows all |
| `OPENAI_API_KEY` | (empty) | Empty means fallback-only mode |
| `OPENAI_MODEL` | `gpt-4o-mini` | |
| `OPENAI_TIMEOUT_MS` | `30000` | Per request; the SDK retries twice |
| `MAX_LEADS_PER_REQUEST` | `50` | |
| `ENRICHMENT_CONCURRENCY` | `5` | Parallel OpenAI calls |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | `60000` / `30` | Applies to `/api/enrich-leads` |
| `NEXT_PUBLIC_API_URL` (frontend) | `http://localhost:4000` | |

## API walkthrough notebook

[notebooks/saasquatch_api_demo.ipynb](notebooks/saasquatch_api_demo.ipynb) runs through the API end to end: health check, batch enrichment, a ranked results table and chart, fit filtering, live AI vs. fallback, and every error case. It is saved with outputs, so you can read it without running anything.

To re-run it against a running backend:

```bash
python -m venv notebooks/.venv
notebooks/.venv/Scripts/pip install -r notebooks/requirements.txt jupyterlab   # macOS/Linux: notebooks/.venv/bin/pip
notebooks/.venv/Scripts/jupyter lab notebooks/saasquatch_api_demo.ipynb
```

Or open it in VS Code and pick the `.venv` interpreter as the kernel. Set `SAASQUATCH_API_URL` if the API is not on `http://localhost:4000`.

## Production

```bash
npm run build      # builds the Next.js app
npm run start      # runs the API and `next start`
```
