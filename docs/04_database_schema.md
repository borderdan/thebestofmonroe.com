# 04 — Database Schema & Supabase

## Overview

- **Provider**: Supabase (hosted PostgreSQL)
- **Project ID**: `amrqoakoyknuozwlftuf`
- **Migrations**: 33 files in [supabase/migrations/](file:///c:/antigravity/The Best of Monroe/supabase/migrations/)
- **Generated Types**: [database.types.ts](file:///c:/antigravity/The Best of Monroe/src/lib/database.types.ts) (45KB)

---

## Core Tables (Baseline)

### `businesses`
Primary tenant table. Every data record belongs to a business.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `slug` | TEXT (UNIQUE) | URL-safe identifier |
| `name` | TEXT | Business display name |
| `city` | TEXT | Operating city |
| `category` | TEXT | Industry category |
| `logo_url` | TEXT | Supabase Storage URL |
| `cover_url` | TEXT | Cover photo URL |
| `is_visible` | BOOLEAN | Directory visibility |
| `subscription_tier` | TEXT | `free`, `basic`, `pro` |
| `rfc` | TEXT | Added in Phase 9 (SAT) |
| `regimen_fiscal` | TEXT | SAT fiscal regime |
| `facturama_api_user` | TEXT | Encrypted Facturama creds |
| `facturama_api_password` | TEXT | Encrypted Facturama creds |
| `csd_password` | TEXT | Encrypted CSD password |
| `stripe_customer_id` | TEXT | Added in Phase 10 |

### `users`
Links Supabase Auth users to a business.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK, FK → auth.users) | Supabase Auth user ID |
| `business_id` | UUID (FK → businesses) | Tenant association |
| `role` | TEXT | `owner`, `manager`, `staff` |
| `is_superadmin` | BOOLEAN | Platform-level admin |
| `full_name` | TEXT | Display name |
| `permissions` | JSONB | Phase 30: granular permissions |
| `pos_pin_hash` | TEXT | Phase 19: POS shift PIN |

### `products`
Unified product catalog (replaced `entities` for POS items in Phase 21).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `business_id` | UUID (FK) | Tenant isolation |
| `name`, `description` | TEXT | Product info |
| `price` | NUMERIC(12,2) | Price |
| `stock_quantity` | INTEGER | Current stock |
| `category` | TEXT | Product category |
| `barcode`, `sku` | TEXT | Identifiers |
| `image_url` | TEXT | Product image |
| `clave_prod_serv` | TEXT | SAT product code |
| `clave_unidad` | TEXT | SAT unit code |
| `is_active` | BOOLEAN | Active flag |

### `transactions`
POS and payment transactions.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `business_id` | UUID (FK) | |
| `user_id` | UUID (FK, nullable) | NULL for guest transactions |
| `customer_id` | UUID (FK, nullable) | CRM customer |
| `total` | NUMERIC(12,2) | |
| `currency` | TEXT | Default `MXN` |
| `status` | TEXT | `pending`, `completed`, `failed`, `refunded` |
| `payment_method` | TEXT | `cash`, `mercadopago`, `codi`, `stripe` |
| `metadata` | JSONB | Items, tax, loyalty info |

### `transaction_items`
Line items per transaction (Phase 8).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `transaction_id` | UUID (FK) | |
| `entity_id` | UUID (FK) | Product reference |
| `quantity` | INTEGER | |
| `price_at_time` | NUMERIC(12,2) | Price snapshot |
| `item_name` | TEXT | Name snapshot |

### `entities`
Polymorphic data store for links, form fields, etc.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `business_id` | UUID (FK) | |
| `type` | TEXT | `profile_link`, `keyring`, `form_field`, etc. |
| `data` | JSONB | Type-specific payload |
| `sort_order` | INT | Ordering |
| `is_active` | BOOLEAN | |

### `modules`
Feature flags per business.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `business_id` | UUID (UNIQUE FK) | One per business |
| `config` | JSONB | `{pos: false, crm: false, eforms: false, ...}` |

---

## Extended Tables (Phase Migrations)

| Table | Phase | Purpose |
|---|---|---|
| `activity_log` | Baseline | Audit trail for all business operations |
| `analytics` | Baseline | Click/view event counting |
| `nfc_tags` | Phase 12 | NFC hardware (guid, claim_pin, status, target_url) |
| `eform_schemas` | Phase 14 | JSON Schema for dynamic forms |
| `eform_submissions` | Phase 14 | Form submission payloads |
| `invoices` | Phase 9 | CFDI invoice tracking (cfdi_status, uuid_sat, xml_url, pdf_url) |
| `email_logs` | Phase 11 | Transactional email delivery tracking |
| `crm_customers` | Phase 16 | CRM: first_name, last_name, email, phone, status, loyalty_points |
| `crm_notes` | Phase 16 | Customer notes with author tracking |
| `automation_configs` | Phase 18 | n8n webhook configurations per trigger_type |
| `platform_notifications` | Phase 20 | System notifications per business |
| `loyalty_configs` | Phase 27 | Points-per-currency, redemption ratios, min points |
| `loyalty_transactions` | Phase 27 | Ledger: earn/redeem with point_change tracking |
| `gift_cards` | Phase 28 | Gift card system with codes, balances, and redemptions |
| `gift_card_transactions` | Phase 28 | Gift card usage tracking |
| `exchange_rates` | Phase 31 | Multi-currency support |
| `whatsapp_messages` | Phase 32 | WhatsApp messaging logs |
| `report_schedules` | Phase 23 | Automated report scheduling |
| `generated_reports` | Phase 23 | Report storage (PDF links) |

---

## Database Views

| View | Purpose |
|---|---|
| `hourly_sales_analytics` | Sales aggregated by hour × day (for heatmap) |
| `category_revenue_analytics` | Revenue grouped by product category |
| `inventory_health_summary` | Low stock, critical restock, avg velocity |

---

## RPC Functions

| Function | Purpose |
|---|---|
| `deduct_product_stock(row_id, quantity_to_deduct)` | Atomic stock decrement with negative-check constraint |
| `auth.business_id()` | Returns caller's business_id from JWT |
| `auth.is_superadmin()` | Returns boolean if caller is super-admin |
| `handle_new_user()` | Auth trigger: auto-creates user profile on sign-up |

---

## RLS Policies (Summary)

All tables have RLS enabled. The general pattern:

1. **Business-scoped**: Users can only access rows where `business_id = auth.business_id()`
2. **Super-admin bypass**: `OR auth.is_superadmin()` on all policies
3. **Public visibility**: `businesses` has a public SELECT policy for `is_visible = true`
4. **Storage**: Public read on `tenant-assets`, auth-required upload

---

## Migration Timeline

| # | File | Phase | Key Changes |
|---|---|---|---|
| 1 | `00000000000000_baseline.sql` | 0 | Core 7 tables, auth trigger, storage |
| 2 | `20260311000000_directory_rls.sql` | — | Directory RLS policies |
| 3 | `20260311100000_phase8_financials.sql` | 8 | Transaction items, financial views |
| 4 | `20260311110000_phase9_sat_cfdi.sql` | 9 | SAT/CFDI fields on businesses, invoices table |
| 5 | `20260311120000_phase10_monetization.sql` | 10 | Stripe fields, subscription management |
| 6 | `20260311130000_phase11_email_logs.sql` | 11 | Email delivery logging |
| 7 | `20260311140000_auth_webhook.sql` | — | Auth webhook handling |
| 8-9 | Phase 12-13 | 12-13 | NFC smart profiles, data vault |
| 10-12 | Phase 13.5-14 | 13-14 | Business profile, eforms, JSON Schema |
| 13 | Analytics engine | 15 | Analytics views |
| 14 | Phase 16 | 16 | Native CRM (customers, notes) |
| 15 | Phase 17 | 17 | POS updates |
| 16 | Phase 18 | 18 | Event-driven automations |
| 17 | Phase 19 | 19 | Enterprise features (POS PIN) |
| 18 | Phase 20 | 20 | Commercial edge (notifications) |
| 19 | Phase 21 | 21 | n8n integration, unified POS/inventory `products` table |
| 20-24 | Phase 22-26 | 22-26 | AI CRM, reports, realtime, inventory intelligence, analytics |
| 25 | Phase 27 | 27 | Loyalty system |
| 26 | Phase 28 | 28 | Gift cards |
| 27-33 | Phase 30-35 | 30-35 | RBAC, multi-currency, WhatsApp, super-admin, inventory automations |

---

## Supabase Storage

| Bucket | Public | Purpose |
|---|---|---|
| `tenant-assets` | Yes (read) | Logos, cover photos, product images |

---

## Environment Variables (Supabase)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Publishable anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Admin key (server-only) |
| `SAT_ENCRYPTION_KEY` | ✅ | 64-char hex key for AES-256-GCM |
