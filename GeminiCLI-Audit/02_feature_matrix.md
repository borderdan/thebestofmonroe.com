# 02 Feature Matrix

## Methodology
Codebase logic and route structures were inspected via file reads (`src/app/[locale]/app/*`) and not just inferred from directory names. Findings have been cross-referenced with `docs/02_feature_inventory.md` and `docs/ui-audit-report.md`.

## Feature Completeness Assessment
| Module / Feature | Status | Notes / Citations |
|------------------|--------|-------------------|
| **Auth & Routing** | `Complete` | `src/middleware.ts`, `[locale]/(public)/*`. Includes email verification and POS PIN checks. Missing: OAuth, Password Reset flow. |
| **CRM** | `Complete (w/ UI Bugs)` | `app/crm/page.tsx`. Reads from `crm_customers`. Has upgrade gating. Has critical hydration errors (nested buttons) and massive missing translations. |
| **Directory** | `Complete` | `app/directory/page.tsx`. Reads `entities` table. Wraps in client component. |
| **Vault** | `Complete (w/ UI Bugs)` | `app/vault/page.tsx`. Renders data payloads from `vault_submissions`. Missing search/upload capabilities. |
| **E-Forms** | `Complete (w/ UI Bugs)` | Includes builder and submission handlers. Form builder is 100% English on `/es/` route and has hydration errors. |
| **Automations / Workflows** | `Complete` | Trigger.dev + AI integrations present (`src/lib/actions/automations.ts`, `workflows.ts`). DB-level event-driven triggers exist but webhook firing is partially wired. |
| **POS (Point of Sale)** | `Complete (w/ Crash Bug)` | Includes PIN unlock and terminal UI. **Critical:** Sidebar "Equipo" link crashes the page. CoDi payments generate payload but lack real bank API. Gift Cards are partial (UI not localized). |
| **Inventory** | `Complete (w/ UI Bugs)` | Includes bulk actions and intelligence logic. Data binding bugs cause duplicated text, and mostly untranslated. |
| **Invoices** | `Partial` | Facturama API integration and background CFDI stamping work. CFDI cancellation and multi-item invoices are missing. |
| **Settings / Theme / Users** | `Partial / Buggy` | `/es/app/users` returns 500 error. Theme visual builder from legacy is missing. Massive translation gaps across all settings pages. |
| **Keyrings** | `Complete` | NFC / Smart profile management. Real NFC reader integration is missing (uses HID scanner). |
| **Links** | `Complete` | Analytics and management. Link analytics UI is partial and entirely in English. |
| **Architect** | `Partial` | Blueprints routing exists, but mostly relies on AI generation endpoints. |
| **WhatsApp Integration** | `Partial` | Server action exists but UI integration is partial; no real WA Business API integration yet. |
| **Multi-Currency** | `Partial` | Schema exists (`exchange_rates`), actions exist, UI missing currency switching. |

*Note: Even features marked "Complete" heavily suffer from translation failures and hydration errors in the current build.*