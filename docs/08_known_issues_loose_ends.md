# 08 — Known Issues & Loose Ends

> A comprehensive audit of incomplete features, tech debt, and areas needing attention.

---

## 🔴 Critical Issues

### 1. ~~E2E Test Instability (POS Checkout)~~ ✅ RESOLVED
**Status**: Fixed — all tests passing as of latest merge (March 2026)  
**Was**: The POS checkout E2E test was flaky due to Zustand hydration timing (cart total showing `$0.00`).  
**Fix**: Added `pos-hydrating` / `pos-ready` test IDs, retry assertions, and improved hydration synchronization.

### 2. Linting Errors (`@typescript-eslint/no-explicit-any`)
**Status**: Mostly resolved — CI lint job now passes  
**Remaining**: A few files still use `eslint-disable` comments for `@typescript-eslint/no-explicit-any` (e.g., locale layout). Some JSONB data handling still uses `as Record<string, ...>` casts.  
**Recommendation**: Gradually replace remaining `any` suppressions with proper TypeScript interfaces for all JSONB data shapes.

### 3. Guest Checkout Module Initialization
**Status**: Working, but fragile  
**Problem**: `guest-checkout.ts` initializes both `supabaseAdmin` and `MercadoPagoConfig` at module scope. If env vars are missing, the import itself crashes the server.  
**Recommendation**: Lazy-initialize inside the function, consistent with other actions.

---

## 🟡 Partially Implemented Features

### 4. CoDi Payment Integration
**Files**: [codi/generate/route.ts](file:///c:/antigravity/The Best of Monroe/src/app/api/codi/generate/route.ts)  
**Status**: Generates CoDi-formatted payload and deep link, but not connected to actual Banco de México infrastructure. Effectively a placeholder.  
**Gap**: Need to register as a CoDi participant and implement real bank API calls.

### 5. Gift Card System
**Files**: `app/pos/gift-cards/page.tsx`, migration Phase 28  
**Status**: Database schema fully defined (`gift_cards`, `gift_card_transactions`), but the UI and redemption flow may not be complete.

### 6. Visual Theme Builder
**Status**: Not ported from legacy  
**Legacy**: Had a full drag-and-drop canvas (`ThemeEditorCanvas.jsx`, `ThemeEditorSidebarLeft.jsx`, etc.)  
**Current**: Only basic theme/branding settings page. The legacy visual builder has NOT been migrated.

### 7. Map View / Directory Map
**Status**: Leaflet dependency is installed, but full map integration for the directory is partially done.  
**Gap**: The legacy `MapView.jsx` and `RankedTower.jsx` components have not been fully ported.

### 8. WhatsApp Integration
**Files**: [whatsapp.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/whatsapp.ts)  
**Status**: Server action exists but UI integration is partial. No real WhatsApp Business API integration.

### 9. Multi-Currency Support
**Files**: [currency.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/currency.ts), Phase 31 migration  
**Status**: Database table `exchange_rates` exists. Actions exist. UI may not surface currency switching.

### 10. Inventory Intelligence / Automations
**Status**: DB schemas exist (Phase 25, 35) for auto-reorder triggers and inventory forecasting.  
**Gap**: The actual automation logic (checking stock, triggering n8n, sending notifications) may not be fully wired.

### 11. AI CRM Features
**Status**: Phase 22 migration creates schema. No actual AI model integration exists.

### 12. Automated Reports
**Status**: Phase 23 migration creates `report_schedules` and `generated_reports` tables.  
**Gap**: The actual report generation pipeline (cron job / edge function) may not be implemented.

---

## 🟠 Technical Debt

### 13. Redundant Database Clients
**Issue**: Both `pg` and `postgres` packages are in `package.json`, plus `@supabase/supabase-js`. The project primarily uses the Supabase SDK.  
**Recommendation**: Remove `pg` and `postgres` unless there's a specific use case requiring raw SQL.

### 14. Zod Not Listed as Direct Dependency
**Issue**: Zod is used extensively in all server actions but only available transitively via `@hookform/resolvers`.  
**Recommendation**: Add `zod` as a direct dependency.

### 15. Hardcoded E2E Bypass in Feature Gate
**File**: [feature-gate.ts](file:///c:/antigravity/The Best of Monroe/src/lib/auth/feature-gate.ts)  
**Issue**: Lines 28-29 hardcode test user emails (`usera@test.com`, `userb@test.com`) to bypass feature gating. This should use an environment variable or test flag.

### 16. Console.log Statements in Production Code
**Files**: `automations.ts` (lines 40, 59-60), various action files  
**Issue**: Debug `console.log` and `console.error` statements left in server actions.  
**Recommendation**: Replace with structured logging or remove.

### 17. Inconsistent Error Handling Patterns
**Issue**: Some actions return `{success, error}` objects. Others throw errors. `guest-checkout.ts` returns `{error}` without a `success` field. The `processTransaction` returns `ActionResult<{transactionId}>` while `submitInvoiceRequest` returns `{success, invoice_id}` or `{error}`.  
**Recommendation**: Standardize all actions on the `ActionResult<T>` pattern.

### 18. Missing `npm install --legacy-peer-deps`
**Issue**: CI uses `--legacy-peer-deps` in all install steps. This suggests there are peer dependency conflicts.  
**Recommendation**: Resolve peer dependency issues to remove this flag.

### 19. Unused/Orphaned Files
**Potential orphans in root directory**:
- `current-lint.txt`, `formatted-errors.txt`, `lint-results.json`, `lint-results.txt`, `lint_errors.txt`, `lint_output.txt`, `tsc-output.txt`, `typecheck.log`, `log.txt`, `pos_log.txt`
- `print-errors.js`, `lint-check.js`
- `e_forms_analysis.md`, `gemini_shared_conversation.md`

These are debug/CI artifacts that should be `.gitignored`.

### 20. Email From Address Hardcoded
**File**: [email.ts](file:///c:/antigravity/The Best of Monroe/src/lib/services/email.ts)  
**Issue**: `from: 'The Best of Monroe <billing@yourdomain.com>'` is hardcoded with a placeholder domain.

---

## ⚪ Missing Features (Not Started)

| Feature | Priority | Notes |
|---|---|---|
| OAuth (Google, Apple SSO) | Medium | Only email/password auth exists |
| Password reset flow | **High** | No forgot-password UI or flow |
| Email verification enforcement | Medium | Supabase supports it, not enforced |
| CFDI cancellation | Medium | Can stamp but can't cancel |
| Multi-item invoices | Low | Currently summarizes as 1 line |
| Thermal receipt printing | Low | Uses `window.print()` only |
| Real NFC reader integration | Low | HID scanner is a keyboard emulator |
| Customer import/export (CRM) | Low | No CSV import/export |
| Link analytics dashboard | Medium | Schema exists, UI missing |
| Real-time collaborative editing | Low | Supabase Realtime not utilized |
| Rate limiting on public APIs | **High** | No rate limiting on `/api/*` |
| CORS configuration | Medium | Using Next.js defaults |
| Structured logging | Medium | Using console.log/error |
| Error monitoring (Sentry, etc.) | **High** | No error tracking service |
| Database backups strategy | Medium | Relying on Supabase managed backups |

---

## Legacy Migration Status

| Legacy Component | Migration Status |
|---|---|
| Auth (PHP sessions → Supabase) | ✅ Complete |
| Users/Businesses CRUD | ✅ Complete |
| Links management | ✅ Complete |
| Directory | ✅ Complete |
| POS (new feature) | ✅ Complete |
| CRM (new feature) | ✅ Complete |
| E-Forms | ✅ Rebuilt natively (was Formbricks, now JSON Schema) |
| Theme editor (visual builder) | ❌ Not ported |
| Map view + ranked tower | 🟡 Partially ported |
| API layer (50+ PHP → Server Actions) | ✅ Complete |
| Admin panel | ✅ Complete |
