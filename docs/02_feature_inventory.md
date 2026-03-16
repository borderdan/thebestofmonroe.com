# 02 — Feature Inventory

> Every feature in The Best of Monroe, its implementation status, and key source files.

**Legend**: ✅ Implemented | 🟡 Partially Implemented | ❌ Not Implemented | 🔧 Needs Fixes

---

## Core Platform Features

### Authentication & Authorization
| Feature | Status | Key Files |
|---|---|---|
| Email/password login | ✅ | [login/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/(public)/login/page.tsx) |
| Email/password registration | ✅ | [register/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/(public)/register/page.tsx) |
| Supabase Auth session (cookie-based) | ✅ | [middleware.ts](file:///c:/antigravity/The Best of Monroe/src/middleware.ts), [supabase/middleware.ts](file:///c:/antigravity/The Best of Monroe/src/lib/supabase/middleware.ts) |
| Route protection (middleware) | ✅ | [middleware.ts](file:///c:/antigravity/The Best of Monroe/src/middleware.ts) |
| RBAC (owner/manager/staff) | ✅ | [rbac.ts](file:///c:/antigravity/The Best of Monroe/src/lib/auth/rbac.ts) |
| Feature gating (per module) | ✅ | [feature-gate.ts](file:///c:/antigravity/The Best of Monroe/src/lib/auth/feature-gate.ts) |
| Granular permissions (can_refund, etc.) | ✅ | [permissions.ts](file:///c:/antigravity/The Best of Monroe/src/lib/security/permissions.ts) |
| POS PIN session (per-shift lock) | ✅ | [middleware.ts](file:///c:/antigravity/The Best of Monroe/src/middleware.ts), [unlock/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/pos/unlock/page.tsx) |
| Auth webhook (new user trigger) | ✅ | [webhooks/auth/route.ts](file:///c:/antigravity/The Best of Monroe/src/app/api/webhooks/auth/route.ts) |
| OAuth (Google, Apple, etc.) | ❌ | — |
| Password reset flow | ❌ | — |
| Email verification enforcement | ❌ | — |

### Internationalization (i18n)
| Feature | Status | Key Files |
|---|---|---|
| English (`en`) locale | ✅ | [en.json](file:///c:/antigravity/The Best of Monroe/messages/en.json) |
| Spanish (`es`) locale | ✅ | [es.json](file:///c:/antigravity/The Best of Monroe/messages/es.json) |
| URL-based locale routing | ✅ | [middleware.ts](file:///c:/antigravity/The Best of Monroe/src/middleware.ts), [i18n/config.ts](file:///c:/antigravity/The Best of Monroe/src/i18n/config.ts) |
| Server-side locale detection | ✅ | [locale layout](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/layout.tsx) |

---

## Back-Office Modules (14 modules)

### 1. Dashboard
| Feature | Status | Key Files |
|---|---|---|
| KPI cards (revenue, transactions, catalog, low stock) | ✅ | [app/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/page.tsx) |
| Revenue chart (7-day) | ✅ | `components/dashboard/revenue-chart.tsx` |
| Sales heatmap (hour × day) | ✅ | `components/dashboard/sales-heatmap.tsx` |
| Category revenue breakdown | ✅ | `components/dashboard/category-revenue-chart.tsx` |
| Inventory health summary | ✅ | `components/dashboard/notification-center.tsx` |
| Platform notifications | ✅ | [dashboard.ts](file:///c:/antigravity/The Best of Monroe/src/lib/queries/dashboard.ts) |
| Parallel query optimization | ✅ | [dashboard.ts](file:///c:/antigravity/The Best of Monroe/src/lib/queries/dashboard.ts) (10 concurrent queries) |

### 2. Point of Sale (POS)
| Feature | Status | Key Files |
|---|---|---|
| Product grid display | ✅ | [pos/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/pos/page.tsx) |
| Zustand cart (IndexedDB-persisted) | ✅ | [use-cart-store.ts](file:///c:/antigravity/The Best of Monroe/src/stores/use-cart-store.ts) |
| Server-side total calculation | ✅ | [pos.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/pos.ts) |
| Cash checkout | ✅ | [pos.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/pos.ts) |
| Stock deduction via RPC | ✅ | `deduct_product_stock` RPC |
| POS PIN lock/unlock | ✅ | [unlock/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/pos/unlock/page.tsx), [pin-auth.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/pin-auth.ts) |
| Barcode scanner input | ✅ | [use-barcode-scanner.ts](file:///c:/antigravity/The Best of Monroe/src/hooks/use-barcode-scanner.ts) |
| HID scanner (RFID/NFC) | ✅ | [use-hid-scanner.ts](file:///c:/antigravity/The Best of Monroe/src/hooks/use-hid-scanner.ts) |
| Offline queue (IndexedDB) | ✅ | [offline-queue.ts](file:///c:/antigravity/The Best of Monroe/src/lib/sync/offline-queue.ts) |
| Loyalty point earning | ✅ | [pos.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/pos.ts) |
| Loyalty point redemption | ✅ | [pos.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/pos.ts) |
| Gift cards | 🟡 | [gift-cards/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/pos/gift-cards/page.tsx), DB schema exists |
| CoDi QR payments | 🟡 | [codi/generate/route.ts](file:///c:/antigravity/The Best of Monroe/src/app/api/codi/generate/route.ts) — generates payload but no real bank integration |
| Card terminal integration | ❌ | — |
| Receipt printing (thermal) | 🟡 | Uses `window.print()` |

### 3. Inventory Management
| Feature | Status | Key Files |
|---|---|---|
| Product CRUD | ✅ | [inventory.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/inventory.ts) |
| Stock tracking | ✅ | `products.stock_quantity` column |
| Category management | ✅ | [inventory/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/inventory/page.tsx) |
| Barcode/SKU support | ✅ | `products.barcode`, `products.sku` |
| SAT product codes (clave_prod_serv) | ✅ | [inventory.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/inventory.ts) |
| Image upload | ✅ | [storage.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/storage.ts) |
| Bulk import (CSV) | ✅ | [inventory-bulk.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/inventory-bulk.ts) |
| Inventory sync (real-time) | 🟡 | [use-inventory-sync.ts](file:///c:/antigravity/The Best of Monroe/src/hooks/use-inventory-sync.ts) |
| Permission-gated (can_manage_inventory) | ✅ | [permissions.ts](file:///c:/antigravity/The Best of Monroe/src/lib/security/permissions.ts) |
| Activity logging | ✅ | [activity.ts](file:///c:/antigravity/The Best of Monroe/src/lib/activity.ts) |

### 4. CRM (Customer Relationship Management)
| Feature | Status | Key Files |
|---|---|---|
| Customer CRUD | ✅ | [crm.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/crm.ts) |
| Customer status tracking | ✅ | `crm_customers.status` |
| Customer notes | ✅ | [crm.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/crm.ts) (`addCustomerNote`, `deleteCustomerNote`) |
| Customer detail page | ✅ | [crm/[customerId]/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/crm/[customerId]/page.tsx) |
| Loyalty points per customer | ✅ | `crm_customers.loyalty_points` |
| Customer search/filter | 🟡 | Basic implementation |
| Customer import/export | ❌ | — |

### 5. Invoicing (CFDI / SAT Compliance)
| Feature | Status | Key Files |
|---|---|---|
| Guest invoice request form | ✅ | [invoice/[tx_id]/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/invoice/[tx_id]/page.tsx) |
| Facturama API integration | ✅ | [facturama.ts](file:///c:/antigravity/The Best of Monroe/src/lib/services/facturama.ts) |
| Background CFDI stamping | ✅ | [invoices.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/invoices.ts) (uses `waitUntil`) |
| SAT credential encryption (AES-256-GCM) | ✅ | [encryption.ts](file:///c:/antigravity/The Best of Monroe/src/lib/security/encryption.ts) |
| SAT config management | ✅ | [sat-config.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/sat-config.ts) |
| Invoice status tracking | ✅ | `invoices` table (`processing`, `issued`, `failed`) |
| PDF/XML download links | ✅ | Auto-generated from Facturama response |
| CFDI cancellation | ❌ | — |
| Multi-item invoice support | ❌ | Currently summarizes as single line item |

### 6. NFC Keyrings / Smart Tags
| Feature | Status | Key Files |
|---|---|---|
| NFC tag claiming (GUID + PIN) | ✅ | [keyrings.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/keyrings.ts) |
| Tag status management | ✅ | `nfc_tags` table |
| Tag target URL configuration | ✅ | [keyrings.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/keyrings.ts) |
| Public claim page | ✅ | [claim/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/claim/page.tsx) |
| Keyring management UI | ✅ | [keyrings/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/keyrings/page.tsx) |
| NFC reader integration | ❌ | HID scanner exists but no true NFC reader |

### 7. Smart Links
| Feature | Status | Key Files |
|---|---|---|
| Link CRUD (polymorphic entities) | ✅ | [links.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/links.ts) |
| Drag-and-drop reordering | ✅ | [links.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/links.ts) (`reorderLinks`) |
| Multiple link types (social, website, WiFi, map) | ✅ | [links schema](file:///c:/antigravity/The Best of Monroe/src/lib/schemas/links.ts) |
| Link analytics | 🟡 | Schema exists, UI partially done |

### 8. E-Forms
| Feature | Status | Key Files |
|---|---|---|
| JSON Schema form builder | ✅ | [eforms/create/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/eforms/create/page.tsx) |
| Form editing | ✅ | [eforms/edit/[id]/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/eforms/edit/[id]/page.tsx) |
| Public form submission | ✅ | [forms/[id]/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/(public)/forms/[id]/page.tsx) |
| Data Vault (view submissions) | ✅ | [vault/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/vault/page.tsx) |
| Formbricks integration | ❌ | Originally planned, replaced with native JSON Schema forms |

### 9. Automations
| Feature | Status | Key Files |
|---|---|---|
| n8n webhook configuration | ✅ | [automations.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/automations.ts) |
| Trigger types (eform, POS sale, new customer) | ✅ | [automations/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/automations/page.tsx) |
| Automation CRUD | ✅ | [automations.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/automations.ts) |
| Super-admin n8n console | ✅ | UI link in automations page |
| Event-driven triggers (DB-level) | 🟡 | DB functions exist but webhook firing is not fully wired |

### 10. Team Management
| Feature | Status | Key Files |
|---|---|---|
| View team members | ✅ | [team.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/team.ts) |
| Invite via email (admin API) | ✅ | [team.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/team.ts) (`inviteTeamMember`) |
| Role management (owner-only) | ✅ | [team.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/team.ts) (`updateUserRole`) |
| Remove member | ✅ | [team.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/team.ts) (`removeTeamMember`) |
| Granular permission assignment | ✅ | [team.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/team.ts) (`updateUserPermissions`) |
| Audit logs | ✅ | [audit-logs/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/users/audit-logs/page.tsx) |

### 11. Directory
| Feature | Status | Key Files |
|---|---|---|
| Public directory listing | ✅ | [directory/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/directory/page.tsx) |
| Business detail page | ✅ | [directory/[slug]/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/directory/[slug]/page.tsx) |
| Directory management (back-office) | ✅ | [app/directory/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/directory/page.tsx) |
| Map view (Leaflet) | 🟡 | Leaflet dependency present, partial integration |

### 12. Theme Editor
| Feature | Status | Key Files |
|---|---|---|
| Theme/branding page | ✅ | [theme/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/theme/page.tsx) |
| Dark/light mode toggle | ✅ | [theme-toggle.tsx](file:///c:/antigravity/The Best of Monroe/src/components/theme-toggle.tsx), [theme-provider.tsx](file:///c:/antigravity/The Best of Monroe/src/components/theme-provider.tsx) |
| Visual theme builder (drag-and-drop canvas) | ❌ | Legacy had this, not yet ported |

### 13. Settings & Billing
| Feature | Status | Key Files |
|---|---|---|
| Business settings (name, city, branding) | ✅ | [settings/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/settings/page.tsx) |
| Logo/cover upload | ✅ | [storage.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/storage.ts) |
| Subscription billing page | ✅ | [settings/subscription/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/settings/subscription/page.tsx) |
| SAT config (billing tab) | ✅ | [settings/billing/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/app/settings/billing/page.tsx) |
| Stripe checkout | ✅ | [stripe.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/stripe.ts) |
| Stripe customer portal | ✅ | [stripe.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/stripe.ts) (`createCustomerPortal`) |
| Multi-currency support | 🟡 | DB schema exists ([currency.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/currency.ts)), UI partial |

### 14. Super-Admin Panel
| Feature | Status | Key Files |
|---|---|---|
| Platform overview dashboard | ✅ | [admin/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/admin/page.tsx) |
| Tenant management | ✅ | [admin/tenants/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/admin/tenants/page.tsx) |
| Super-admin auth bypass | ✅ | [feature-gate.ts](file:///c:/antigravity/The Best of Monroe/src/lib/auth/feature-gate.ts), RLS policies |

---

## Public-Facing Features

| Feature | Status | Key Files |
|---|---|---|
| Public business portal | ✅ | [portal/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/portal/page.tsx) |
| Guest checkout (MercadoPago) | ✅ | [guest-checkout.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/guest-checkout.ts) |
| Guest cart (Zustand) | ✅ | [use-guest-cart-store.ts](file:///c:/antigravity/The Best of Monroe/src/stores/use-guest-cart-store.ts) |
| Checkout result pages (success/failure/pending) | ✅ | [checkout/](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/checkout/) |
| Public city/slug profile | ✅ | [(public)/[city]/[slug]/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/(public)/[city]/[slug]/page.tsx) |
| B2B page | ✅ | [b2b/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/(public)/b2b/page.tsx) |
| Pricing page | ✅ | [pricing/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/(public)/pricing/page.tsx) |
| Public receipt viewer | ✅ | [receipt/[token]/page.tsx](file:///c:/antigravity/The Best of Monroe/src/app/[locale]/receipt/[token]/page.tsx) |
| vCard download | ✅ | [vcard/[businessId]/route.ts](file:///c:/antigravity/The Best of Monroe/src/app/api/vcard/[businessId]/route.ts) |
| QR code generation | ✅ | [qr-generator.tsx](file:///c:/antigravity/The Best of Monroe/src/components/qr-generator.tsx) |
| WhatsApp integration | 🟡 | [whatsapp.ts](file:///c:/antigravity/The Best of Monroe/src/lib/actions/whatsapp.ts) — action exists, UI partial |

---

## Infrastructure Features

| Feature | Status | Notes |
|---|---|---|
| PWA (Service Worker) | ✅ | Serwist, disabled in dev |
| Offline transaction queue | ✅ | IndexedDB-based |
| React Compiler | ✅ | Enabled in next.config |
| Email service (Resend) | ✅ | With delivery logging |
| Activity logging | ✅ | `activity_log` table |
| Encryption (AES-256-GCM) | ✅ | For SAT credentials |
| Supabase Storage (tenant-assets) | ✅ | Public read, auth upload |
| Health check API | ✅ | `/api/health` |
