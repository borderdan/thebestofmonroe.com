# 04 Database Schema & RLS Status

## Multi-Tenancy Architecture
* The application enforces multi-tenancy almost exclusively via **Supabase Row Level Security (RLS)**.
* Queries in Server Actions and Page Components (e.g., `app/vault/page.tsx`) routinely query `select('*')` without explicitly appending `.eq('business_id', profile.business_id)`. 
* The system relies heavily on RPC functions: `auth.business_id()` extracts the caller's tenant from their JWT, and `auth.is_superadmin()` handles super-admin bypass. Public visibility is managed via `is_visible = true` on the `businesses` table.

## Schema Drift & Risks
* While `ENABLE ROW LEVEL SECURITY` is present across 23 migration files, the reliance entirely on RLS makes the application highly susceptible to data leaks if *even a single table* is deployed without strict policies. 
* **Recommendation**: Implement a dual-layer check. RLS should be the ultimate gatekeeper, but application code should *also* explicitly filter by `business_id` or `tenant_id` to prevent accidental full-table scans if RLS is ever temporarily disabled or bypassed via service roles.

## Unused/Orphaned Tables & Advanced Schema
* The `entities` table is queried for the `directory` module, but the `crm_customers` table handles CRM. Ensuring the separation of these concerns is vital so public directory data does not bleed into private CRM data.
* `modules` table controls access to features (e.g., CRM gating), but is checked in the UI rather than at the database read level. This means a user could technically bypass the UI check and hit an API to fetch CRM data if RLS doesn't also enforce the `modules` JSON config.
* **Pre-emptive Schemas:** Several tables exist for features not fully implemented in the UI yet: `nfc_tags`, `automation_configs`, `loyalty_configs`, `gift_cards`, `exchange_rates`, `whatsapp_messages`, `report_schedules`, and `generated_reports`. This indicates the DB schema is further along than the application logic.