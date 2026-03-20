## Data Pipeline Rules

### Overview
This project ingests data from 14+ external sources into Supabase. Every pipeline is tracked in the Data Pipeline admin page (`src/components/admin/data-pipeline-client.tsx`). This file is the single source of truth for all ingestion infrastructure.

### When Adding a New Data Source — MANDATORY Checklist

1. **Create the ingestion script** in `scripts/` following existing patterns (use `getAdminClient()` for service-role access)
2. **Add an npm script** in `package.json` under the `ingest:*` or `scrape:*` naming convention
3. **Create or reuse a Supabase table** — if new, create a migration in `supabase/migrations/` with RLS enabled
4. **Register in the ALL_PIPELINES array** in `src/components/admin/data-pipeline-client.tsx` — this is REQUIRED, not optional. Include ALL fields:
   - `name` — Human-readable pipeline name
   - `type` — One of: `API`, `SCRAPER`, `BOT`, `RSS`, `PDF_AI`
   - `category` — Uppercase key (e.g., `TRAFFIC`, `WEATHER`). Add new category to `categoryMeta` if needed
   - `target` — Supabase table name the data lands in
   - `script` — npm script name (without `npm run`)
   - `endpoint` — Source URL or description
   - `schedule` — Human-readable schedule (e.g., `Every 10 min`, `Daily 6am UTC`, `Not scheduled`)
   - `cron` — Cron expression or `null` if not scheduled
   - `automation` — Which GitHub Actions workflow file runs it, or `None — manual only`
   - `defaultStatus` — One of: `OPERATIONAL`, `ERROR`, `MAINTENANCE`, `NOT_SCHEDULED`, `BROKEN`
   - `envVars` — Array of required environment variable names (e.g., `['NCDOT_API_KEY']`)
   - `runsOn` — Where it executes: `'GitHub Actions'` or `'Local / Manual'`
   - `runsOnDetail` — Full detail: runner type, Node version, workflow file, timeout
   - `dataRetrieved` — Describe the exact fields/columns pulled from the source
   - `method` — Step-by-step technical method (e.g., `REST API -> JSON -> filter -> upsert`)
   - `description` — Full human-readable description of what this pipeline does
   - `dependents` — Array of `{ page, description, route? }` listing every page/feature that consumes this data
5. **Add to GitHub Actions** if the pipeline should run automatically:
   - High-frequency (every 10 min): Add to `ingest-high-frequency` job in `.github/workflows/community-ingestion.yml`
   - Daily: Add to `ingest-daily` job in `.github/workflows/community-ingestion.yml`
   - Weekly (fast): Add to `ingest-weekly` job in `.github/workflows/community-ingestion.yml`
   - Weekly (slow/AI): Add to `.github/workflows/ingest-community-data.yml` with appropriate timeout
6. **Add required secrets** to GitHub Actions repository settings if the pipeline needs API keys
7. **Register in `data_sources` table** — insert a row so the admin page can track real sync stats
8. **Log ingestion results** — every script must insert into `ingestion_logs` table on success/failure with `items_processed` count

### Pipeline Infrastructure

| Where | What Runs | Config File |
|-------|-----------|-------------|
| GitHub Actions (ubuntu-latest) | All scheduled ingestion scripts | `.github/workflows/community-ingestion.yml`, `.github/workflows/ingest-community-data.yml` |
| Supabase Edge Functions | Webhooks (Stripe, MercadoPago), email dispatch, inventory scanner | `supabase/functions/` |
| Local / Manual | Broken or unscheduled scripts | Run via `npm run ingest:*` locally |

### Script Conventions

- All scripts live in `scripts/` directory
- Use `getAdminClient()` (service role) — ingestion scripts run without user sessions
- Always upsert with a unique constraint to handle re-runs safely (idempotency)
- Log results to `ingestion_logs` table: `{ source_name, status, message, items_processed }`
- Handle errors gracefully — never let one item failure crash the entire batch
- For Playwright-based scrapers: install Chromium in CI via `npx playwright install chromium`
- For AI-powered pipelines: use Gemini 2.5 Flash via `@google/generative-ai` SDK

### Target Tables

| Table | Used By | Category |
|-------|---------|----------|
| `community_feed` | Traffic, Weather, Aviation, Jobs, Alerts, Events, Economy, Permits | Multi-source feed |
| `grocery_prices` | Grocery Price Bot, seed data | Price Intel feature |
| `restaurant_inspections` | NC Health Inspections | Health grades |
| `council_meetings` | Council Meeting Transcripts | Government transparency |
| `city_agendas` | CivicClerk Agendas | Government transparency |
| `property_sales` | Union County Property Sales | Real estate |
| `pois` | NC OneMap POIs | Points of interest |

### Dependent Pages — Keep Updated

When you create a new page that consumes ingested data, you MUST update the `dependents` array for the relevant pipeline in `data-pipeline-client.tsx`. Include:
- `page` — Name of the page or component
- `description` — What it does with the data
- `route` — The URL path (optional but preferred)

### Environment Variables

All ingestion API keys must be:
1. Added to `.env.local` for local development
2. Added to GitHub Actions secrets for CI/CD
3. Listed in the pipeline's `envVars` array in `data-pipeline-client.tsx`
4. NEVER committed to the repository
