# AGENTS.md — thebestofmonroe.com

## Overview

Multi-tenant SaaS platform for Monroe, NC businesses. POS, CRM, Inventory, E-Forms, Workflow Builder, Invoicing, Community Hub with data ingestion from 10+ external sources.

## Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict mode)
- **Database**: Supabase (Postgres with RLS, Auth, Edge Functions)
- **Styling**: Tailwind CSS 4 + shadcn/ui + Framer Motion
- **State**: Zustand stores (`use-*-store.ts`)
- **Forms**: React Hook Form + Zod validation
- **i18n**: next-intl (Spanish default, English secondary)
- **Testing**: Vitest (unit) + Playwright (E2E) + Testing Library
- **Payments**: Stripe + MercadoPago
- **AI**: Google Gemini
- **Errors**: Sentry

## Build & Test Commands

```bash
npm install              # Install dependencies
npm run dev              # Dev server (localhost:3000)
npm run build            # Production build — ALWAYS run before submitting PR
npm run lint             # ESLint check
npm run typecheck        # TypeScript strict checking
npm run test             # Vitest unit tests
npm run test:e2e         # Playwright E2E tests
npm run types:generate   # Regenerate Supabase types (after migration changes)
```

## Project Structure

```
src/
  app/[locale]/        — App Router pages (locale-based routing)
  app/api/             — Route handlers & webhooks
  components/          — React components grouped by feature
  lib/actions/         — Server actions ('use server', ActionResult<T>)
  lib/schemas/         — Zod validation schemas
  lib/services/        — External service integrations
  lib/supabase/        — Supabase clients (server, client, admin)
  lib/ai/              — Gemini AI utilities
  hooks/               — React hooks (use-*.ts)
  stores/              — Zustand stores (use-*-store.ts)
supabase/migrations/   — SQL migration files
scripts/               — Data ingestion scripts
messages/              — i18n JSON files (en.json, es.json)
e2e/                   — Playwright E2E tests
```

## Coding Conventions

- **Server actions** return `ActionResult<T>` = `{ success: true, data: T } | { success: false, error: string }`
- **Error handling**: All server actions wrap errors with `Sentry.captureException()`
- **Database access**: `createClient()` for server/client, `getAdminClient()` for admin ops
- **RLS enforced** on all tables — never bypass unless using service role intentionally
- **Zod schemas** validate all inputs before DB operations
- **File naming**: Components = PascalCase, hooks = `use-*.ts`, stores = `use-*-store.ts`
- **Auto-generated types**: `src/lib/database.types.ts` — NEVER edit manually
- **Default locale** is Spanish (es), all user-facing strings go through next-intl
- **Path alias**: `@/` maps to `src/`

## Important Rules

1. Always run `npm run build` to verify your changes compile
2. Run `npm run typecheck` — the project uses TypeScript strict mode
3. Run `npm run lint` to ensure code style compliance
4. Add both `es.json` and `en.json` translations for any new user-facing text
5. When modifying database schema, create a new migration in `supabase/migrations/`
6. After schema changes, run `npm run types:generate` to update TypeScript types
7. Never commit `.env.local` — it contains secrets
8. Test your changes with `npm run test` before submitting
