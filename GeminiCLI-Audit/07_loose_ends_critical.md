# 07 Tech Debt & Gaps (Updated with UI Audit Findings)

## 🔴 Critical UI & Crash Issues (Discovered in Docs)
* **Server Crashes:**
  * Clicking the "Equipo" sidebar link in `/es/app/pos` causes a complete server crash (`buttonVariants() called from server`).
  * The `/es/app/users` route currently returns a 500 Internal Server Error.
  * Checkout routes (`/es/checkout/success`, `/pending`, `/failure`) return 500 errors if accessed without a valid Stripe `session_id`.
* **Severe Hydration Errors:** Nested `<button>` tags (e.g., in `CreateCustomerSheet` and global layout header/sidebar) are causing React hydration failures across CRM, Inventory, eForms, and Vault pages.
* **Data Binding Bugs:** The Inventory grid shows duplicated text (e.g., "Tacos al PastorTacos al Pastor") and broken price formatting.

## 🟠 Massive Internationalization (i18n) Failures
* Despite being an app for Mexican SMBs, the `/es/` (Spanish) routes are overwhelmingly displaying English content.
* **Pages heavily/entirely untranslated:** Pricing, CRM, Inventory, eForms builder (100% English), Links Analytics, Audit Logs, Settings, Subscription, Theme.
* **Broken Interpolation:** The Upgrade page shows the raw variable `{feature}` instead of the translated string.

## 1. TODOs & FIXMEs
Extracted from the codebase:
* `app/api/webhooks/evaluator/route.ts`:
  * `TODO: Integrate with WhatsApp Business API` (Currently just logs action).
  * `TODO: Invoke Facturama API via existing SAT config` (Currently just returns status 'queued').

## 2. Unsafe Unwraps (`as any`)
* Found in **23 files**. Notable offenders:
  * `app/api/webhooks/stripe/route.ts`: Parsing webhook events.
  * `lib/ai/gemini-client.ts`: Parsing error messages.
  * `components/forms/builder/sortable-field.tsx`: Bypassing strict prop typing.
* **Risk**: High. `as any` entirely circumvents TypeScript's safety, leading to runtime crashes when object shapes change.

## 3. Silent Failures & Empty `catch` Blocks
* `lib/sync/offline-queue.ts`: `catch { return [] }`
* `lib/webhooks.ts`: `catch (error) { console.error(...) }`
* `app/[locale]/layout.tsx`: `catch { messages = {} }`

## 4. Console Leaks
* **11 files** contain `console.log` statements in production code. 
* Notably: `app/[locale]/app/pos/actions.ts` logs checkout payloads, which could leak PII or transaction data into Vercel/Supabase Edge logs.

## 5. False Positives / Hardcoded Bypasses
* Playwright E2E tests bypass standard authentication by injecting `.auth/user-a.json` globally.
* `lib/auth/feature-gate.ts` contains hardcoded test user emails (`usera@test.com`, `userb@test.com`) to bypass feature gating.
* Many Server Actions lack Zod validation as a direct dependency.

## 6. Dependency & Setup Debt
* **Redundant DB Clients:** Both `pg` and `postgres` are installed alongside `@supabase/supabase-js`.
* **Missing Zod Dependency:** Zod is used in server actions but only installed transitively.
* **Peer Dependencies:** CI uses `--legacy-peer-deps` indicating unresolved package conflicts.
* **Hardcoded Emails:** The `lib/services/email.ts` file has a hardcoded `from: 'The Best of Monroe <billing@yourdomain.com>'` address.