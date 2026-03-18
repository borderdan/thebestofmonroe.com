Run one or more community data ingestion scripts.

Available scripts (in `scripts/`):
- `ingest-traffic.ts` — NCDOT traffic incidents (Union County)
- `ingest-weather.ts` — NWS weather alerts & forecasts (zone NCC179)
- `ingest-aviation.ts` — FlightAware aviation data
- `ingest-jobs.ts` — Adzuna job listings
- `ingest-monroe-alerts.ts` — CivicPlus community alerts
- `ingest-city-events.ts` — City of Monroe events
- `ingest-pois.ts` — NC OneMap POIs
- `scrape-permits.ts` — Union County building permits
- `scrape-grocery.ts` — Grocery store data

Usage:
- `/ingest traffic` — runs ingest-traffic.ts
- `/ingest all-high` — runs traffic, weather, alerts, aviation (high-frequency set)
- `/ingest all-daily` — runs permits, events, jobs (daily set)
- No argument — list available scripts

Run with: `npx tsx scripts/<script-name>.ts`

Report any errors with the specific API response or scraping failure.
