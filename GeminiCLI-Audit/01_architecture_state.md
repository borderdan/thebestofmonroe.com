# 01 Core Architecture State

## Overview
The application is built on Next.js 16 App Router using React Server Components (RSC) and Supabase for database, authentication, and backend services. It implements a multi-tenant SaaS architecture.

## External Services & Integrations (Discovered in Docs)
* **Payments:** Stripe (subscriptions) and MercadoPago (guest checkout).
* **Invoicing:** Facturama (CFDI 4.0 / SAT compliance).
* **Email:** Resend with React Email templates.
* **Automations:** n8n.

## Component Boundary Analysis (RSC vs. Client)
The codebase heavily favors React Server Components. Out of the entire application structure, only **25 files** explicitly declare `'use client'`. 
* **Client Heavy Zones:** Features requiring interaction like `pos-terminal.tsx`, `eforms-client.tsx`, `link-manager.tsx`, and workflow editors.
* **Server Components:** Most data fetching and layout layers happen on the server, which is highly optimal for performance.

## Middleware Pipeline Flow
Located at `src/middleware.ts`, the pipeline processes requests in the following order:
1. **i18n Routing:** Passes request to `next-intl` middleware to resolve locales.
2. **Rate Limiting (Edge Flaw):** Implements an in-memory Map for rate limiting (e.g., `/api/codi/generate`). **Critical Flaw:** In-memory state does not persist across Vercel Edge isolates or regions, rendering this effectively useless under load.
3. **Session Revalidation:** Calls Supabase `updateSession` to refresh auth cookies.
4. **Route Protection (`/app/*`):** Redirects unauthenticated users to `/login`.
5. **Email Verification:** Blocks access to `/app/*` if `user.email_confirmed_at` is missing.
6. **POS PIN Verification:** Specific intercept for `/app/pos` ensuring `pos_session_role` cookie is present.

## Multi-Tenancy Enforcement
* Multi-tenancy appears to be offloaded primarily to **Supabase Row Level Security (RLS)** rather than explicitly passing `tenant_id` or `business_id` in application code queries. 
* Every data table uses a `business_id` foreign key. Supabase RLS enforces isolation using a custom helper function `auth.business_id()` which extracts the tenant from the JWT.
* There is also an `auth.is_superadmin()` function that allows bypassing RLS for platform-level administration.
* A `grep` for `tenant_id` and `business_id` across the `src/` directory yielded very few hits outside of type definitions and specific background services (like email/reports). 
* The lack of explicit multi-tenancy context passing in standard Server Actions means the application is entirely dependent on the security of the Supabase `auth.uid()` binding in RLS policies. This is a robust approach if RLS is exhaustive, but dangerous if any table lacks RLS.