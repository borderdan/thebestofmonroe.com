# The Best of Monroe Project Summary & Architecture State

## 1. Project Context & Objectives
**Origin:** `thebestofmexico.org` (Monolithic PHP 8, Vite React SPA, MySQL)
**Target:** "The Best of Monroe" - A modern, multi-tenant SaaS operating system for Mexican SMEs (Small and Medium Enterprises). 
**Goal:** Provide localized digital tools (QR Menus, Cloud POS, CRM, E-forms, SAT Invoicing) via a single unified codebase.
**Engineering Philosophy:** The stack and architecture were explicitly chosen to **maximize AI-agent coding efficiency** by relying on heavily documented, standard paradigms and avoiding niche frameworks.

## 2. Core Technology Stack
* **Framework:** Next.js 15/16 (App Router) strictly utilizing React Server Components (RSC) and Server Actions.
* **Database & Auth:** Supabase (PostgreSQL 15, `@supabase/ssr`, Storage).
* **UI/UX:** Tailwind CSS v4 + `shadcn/ui` (mobile-first, touch-optimized).
* **State Management:** `Zustand` with `persist` middleware backed by `idb-keyval` (IndexedDB) for offline resilience.
* **Hosting/CI/CD:** Vercel (Edge network, Serverless functions) + GitHub Actions.

## 3. Phase-by-Phase Completion Status (Phases 1-9 ✅)

### Phase 1 & 2: Database, Identity, & Routing 
* **Polymorphic Database:** Translated legacy MySQL to a scalable PostgreSQL schema (`businesses`, `users`, `modules`, `transactions`, `transaction_items`, `invoices`, `analytics`). Utilizes `JSONB` columns (`entities.data`, `modules.config`) to support disparate business types without schema migrations.
* **Strict Tenant Isolation:** Implemented Row Level Security (RLS) policies tied to the authenticated user's `business_id`. 
* **Atomic Provisioning:** Created the `handle_new_user()` PostgreSQL trigger to automatically bootstrap business profiles on Supabase Auth signup.
* **Middleware & i18n:** Configured Next.js `src/proxy.ts` to handle auth-gating and `next-intl` for Spanish (`es-MX`) / English locale routing.

### Phase 3 & 4: Frontend, Offline POS, & External Hooks
* **Offline-Resilient POS:** Built a touch-optimized POS terminal. The cart state (`use-cart-store.ts`) survives browser refreshes and iOS memory purges via IndexedDB.
* **Hardware Integration:** Engineered a custom `use-barcode-scanner.ts` hook that intercepts rapid HID keystrokes (50ms latency) globally, bypassing the need for standard input fields. Implemented dynamic QR generation via `qrcode.react`.
* **Third-Party APIs:** Integrated self-hosted **Formbricks** for e-forms and **n8n** for visual workflow automations (secured via `x-tbm-signature` webhooks).

### Phase 5: CI/CD & DevOps
* **Database Versioning:** Established Supabase CLI migration pipelines (`supabase/migrations/`) and automatic TypeScript type generation.
* **Quality Gates:** Deployed GitHub Actions (`production.yml`) to enforce Linting, Type Checking, Unit Tests (Vitest), and End-to-End Tests (Playwright) before Vercel deployments.

### Phase 6: Multi-Tenant Business Logic
* **CRUD Interfaces:** Built the Inventory management system handling `entities` of type `menu_item`. 
* **Admin Analytics:** Developed the `Recharts` dashboard pulling historical transaction data.
* **RBAC:** Implemented Team Management mapping users to roles (`admin`, `manager`, `cashier`).
* **Checkout Engine:** Finalized the POS checkout Server Action utilizing PostgreSQL transaction blocks to deduct inventory and record sales atomically.

### Phase 7: PWA & Public Directory
* **Progressive Web App:** Converted the app to an installable PWA for tablets. Created dynamic `manifest.ts` routing for white-labeled tenant apps and `sw.js` with `NetworkFirst`/`StaleWhileRevalidate` caching.
* **Thermal Printing:** Engineered `receipt-template.tsx` with specific `@media print` CSS for 80mm ESC/POS hardware.
* **Public Portal:** Built the SEO-optimized `/[locale]/directory/[slug]` pages exposing public menus via RLS bypass policies.

### Phase 8: Financial Integrations
* **MercadoPago:** Integrated Checkout Pro for online orders and Point API for physical terminals.
* **Zero-Fee Payments:** Implemented Banco de México **CoDi** dynamic QR generation.
* **Webhook Ledger:** Built an idempotent MercadoPago webhook receiver (`route.ts`) that validates HMAC `x-signature` headers and updates `transactions.status` using the Supabase Service Role key (bypassing RLS).
* **Guest Checkout:** Engineered an isolated unauthenticated checkout flow utilizing the Admin client to process public directory orders safely.

### Phase 9: SAT CFDI 4.0 Tax Compliance
* **Credential Security:** Implemented App-level **AES-256-GCM encryption** (`src/lib/security/encryption.ts`) to secure sensitive tenant PAC API keys and `csd_password` strings at rest in the database.
* **Facturama Integration:** Built the PAC API wrapper mapping database transactions to the strict CFDI 4.0 JSON payload, calculating 16% IVA.
* **Strict Validation:** Enforced Zod schemas for RFC and Postal Code regex validation.
* **Serverless Resilience:** Decoupled the synchronous PAC API calls. Submissions instantly return a `processing` status to the UI, while the 2-5 second Facturama API request is processed asynchronously via `@vercel/functions` and `waitUntil()` to prevent timeouts.

---

## 4. Current Position & Next Steps

The platform's core infrastructure, tenant isolation, physical retail capabilities, and Mexican financial/tax compliance layers are **100% complete and tested**. 

**The immediate next objective is Phase 10: Platform Monetization & Tenant Subscriptions.**
Now that the product is fully functional for the subscribing SMEs, the focus shifts to building the infrastructure that generates revenue for the platform owner. 

**Upcoming Phase 10 Requirements:**
1. **Recurring Billing Engine:** Integrate Stripe or MercadoPago Subscriptions to charge businesses.
2. **Feature Gating:** Enforce module-based access control based on the active subscription tier (e.g., locking the CFDI Phase 9 module behind a "Pro" or "Empresarial" tier).
3. **Super-Admin Dashboard:** Build the highest-level platform interface for managing tenants, viewing global MRR, and overriding configurations.