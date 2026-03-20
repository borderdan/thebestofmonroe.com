# CLAUDE.md — thebestofmonroe.com

## Project

Multi-tenant SaaS platform for Monroe, NC businesses. POS, CRM, Inventory, E-Forms, Workflow Builder, Invoicing, Community Hub with data ingestion from 10+ external sources.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Supabase (Postgres + Auth + RLS + Edge Functions)
- Tailwind CSS 4 + shadcn/ui + Framer Motion
- Zustand (state), React Hook Form + Zod (forms/validation)
- Stripe + MercadoPago (payments), Resend (email), Sentry (errors)
- Trigger.dev (task scheduling), Google Gemini (AI), n8n (workflow automation)
- next-intl (i18n: es default, en)

## Key Directories

- `src/app/[locale]/` — Locale-based App Router pages
- `src/app/api/webhooks/` — Stripe, Auth, Evaluator webhooks
- `src/components/` — React components grouped by feature
- `src/lib/actions/` — Server actions (`'use server'`, `ActionResult<T>`)
- `src/lib/schemas/` — Zod validation schemas
- `src/lib/services/` — External service integrations
- `src/lib/supabase/` — Supabase client setup (server, client, admin)
- `src/lib/ai/` — Gemini AI utilities
- `src/stores/` — Zustand stores (`use-*-store.ts`)
- `src/hooks/` — React hooks (`use-*.ts`)
- `supabase/migrations/` — 18 SQL migration files
- `scripts/` — Data ingestion scripts (traffic, weather, aviation, jobs, etc.)
- `messages/` — i18n JSON files (en.json, es.json)
- `e2e/` — Playwright E2E tests

## Conventions

- Server actions return `ActionResult<T>` = `{ success: true, data: T } | { success: false, error: string }`
- All server actions wrap errors with `Sentry.captureException()`
- Supabase access: `createClient()` (server/client), `getAdminClient()` (admin ops)
- RLS enforced on all tables — never bypass unless using service role intentionally
- Zod schemas validate all inputs before DB operations
- Components: PascalCase files, hooks: `use-*.ts`, stores: `use-*-store.ts`
- Auto-generated types: `src/lib/database.types.ts` (do not edit manually)
- Default locale is Spanish (es), all user-facing strings go through next-intl

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm test             # Vitest unit tests
npm run test:e2e     # Playwright E2E
npm run types:generate  # Regenerate Supabase types
```

## Slash Commands

- `/preflight` — Lint + typecheck + unit tests pipeline
- `/review` — Security & quality review of uncommitted changes
- `/db-types` — Regenerate Supabase TypeScript types
- `/migrate` — Guided Supabase migration creation
- `/e2e` — Run Playwright E2E tests with diagnostics
- `/ingest` — Run community data ingestion scripts
- `/scaffold-action` — Scaffold a new server action with conventions
- `/setup-hooks` — Install husky + lint-staged git hooks

## Agents

- `security-reviewer` — Multi-tenant RLS, webhook, auth audit
- `test-writer` — Generates Vitest + testing-library tests
- `i18n-checker` — Finds missing translations and hardcoded strings

## Rules

- Never commit .env files or secrets
- Never edit `database.types.ts` manually — use `/db-types`
- Always use RLS-safe queries; admin client only for service-role operations
- Webhook routes must verify signatures before processing
- All user-facing text through next-intl (Spanish first)
- **When adding a new data source**: follow the mandatory checklist in `.claude/rules/data-pipelines.md` — register in `ALL_PIPELINES`, add to GitHub Actions, log to `ingestion_logs`
- **When adding a page that uses ingested data**: update the `dependents` array in `data-pipeline-client.tsx`
- See `.claude/rules/` for detailed conventions per topic
