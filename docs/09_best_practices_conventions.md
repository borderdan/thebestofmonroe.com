# 09 — Best Practices & Conventions

## Code Organization Patterns

### Server Actions Pattern
All server actions follow a consistent structure:

```typescript
'use server'

import { getSessionWithProfile, type ActionResult } from '@/lib/supabase/helpers'
import { mySchema } from '@/lib/schemas/my-module'

export async function myAction(values: unknown): Promise<ActionResult<MyReturnType>> {
  try {
    // 1. Auth + RBAC
    const { supabase, user, profile } = await getSessionWithProfile()
    
    // 2. Validate input with Zod
    const validated = mySchema.parse(values)
    
    // 3. Database operation
    const { data, error } = await supabase
      .from('my_table')
      .insert({ business_id: profile.business_id, ...validated })
      .select()
      .single()
    
    if (error) return { success: false, error: error.message }
    
    // 4. Revalidate cache
    revalidatePath('/[locale]/app/my-module', 'page')
    
    // 5. Return typed result
    return { success: true, data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to perform action'
    return { success: false, error: message }
  }
}
```

> [!IMPORTANT]
> **Never trust client-side data.** Always:
> - Validate with Zod on the server
> - Calculate totals server-side (see POS checkout)
> - Scope queries by `business_id` from the authenticated session

### File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Pages | `page.tsx` (Next.js App Router) | `app/[locale]/app/pos/page.tsx` |
| Layouts | `layout.tsx` | `app/[locale]/app/layout.tsx` |
| Server Actions | `kebab-case.ts` | `lib/actions/guest-checkout.ts` |
| Components | `kebab-case.tsx` | `components/qr-generator.tsx` |
| Hooks | `use-kebab-case.ts` | `hooks/use-hid-scanner.ts` |
| Stores | `use-kebab-case.ts` | `stores/use-cart-store.ts` |
| Schemas | `kebab-case.ts` | `lib/schemas/cfdi.ts` |
| UI primitives | `kebab-case.tsx` (shadcn) | `components/ui/button.tsx` |

### Directory Structure Rules

```
src/
├── app/           → Routes only (page.tsx, layout.tsx, route.ts)
├── components/    → Reusable React components
│   ├── ui/        → shadcn/ui primitives (auto-generated)
│   ├── pos/       → POS-specific components
│   ├── dashboard/ → Dashboard-specific components
│   └── ...        → Feature-scoped component folders
├── hooks/         → Custom React hooks
├── stores/        → Zustand stores
├── lib/
│   ├── actions/   → ALL server actions
│   ├── auth/      → RBAC + feature gating
│   ├── schemas/   → Zod validation schemas
│   ├── security/  → Encryption + permissions
│   ├── services/  → External API integrations
│   ├── supabase/  → Supabase client factories
│   └── types/     → Shared TypeScript types
├── emails/        → React Email templates
└── i18n/          → Internationalization config
```

---

## Security Practices

### Auth & Authorization Layers

```
Layer 1: Middleware       → Rejects unauthenticated users from /app/*
Layer 2: Feature Gate     → Checks module config in `modules.config` JSONB
Layer 3: RBAC             → Verifies role (owner/manager/staff)
Layer 4: Permissions      → Checks granular permissions (can_refund, can_manage_inventory, etc.)
Layer 5: RLS              → PostgreSQL row-level security (database-level enforcement)
```

### When to Use Each Auth Check

| Use Case | Function | Import |
|---|---|---|
| Any authenticated page/action | `getSessionWithProfile()` | `@/lib/supabase/helpers` |
| Owner-only actions | `requireRole('owner')` | `@/lib/auth/rbac` |
| Feature-gated pages | `requireFeature('pos', locale)` | `@/lib/auth/feature-gate` |
| Permission-gated actions | `requirePermission('can_manage_inventory')` | `@/lib/security/permissions` |

### Encryption

- **Algorithm**: AES-256-GCM with random IV
- **Key**: 32-byte hex key stored in `SAT_ENCRYPTION_KEY` env var
- **Used for**: Facturama API credentials, CSD passwords
- **Format**: `{iv}:{authTag}:{ciphertext}` (hex-encoded)

### Supabase Client Patterns

| Client | File | Use Case |
|---|---|---|
| `createClient()` (server) | `lib/supabase/server.ts` | RSC data fetching, server actions (uses user's JWT) |
| `createClient()` (client) | `lib/supabase/client.ts` | Client-side operations (sign out, real-time) |
| Admin client | Inline in actions | Bypass RLS (guest checkout, admin operations) |

> [!CAUTION]
> The admin client (service role key) should NEVER be exposed to the client. Only use it in server actions or API routes.

---

## Data Patterns

### Polymorphic Entities Table
The `entities` table stores multiple data types using a `type` discriminator and JSONB `data` column:

| Entity Type | Data Shape | Module |
|---|---|---|
| `profile_link` | `{label, url, link_type, is_active, order_index}` | Smart Links |
| `form_field` | `{field_name, field_type, required}` | E-Forms |

> [!NOTE]
> Product/menu items were **moved out** of `entities` into a dedicated `products` table in Phase 21 for better query performance and schema enforcement.

### Server-Side Totals
**Never** accept totals, subtotals, or tax amounts from the client. Always recalculate on the server:

```typescript
// ✅ Correct — server calculates
const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
const total = Math.round((subtotal * 1.16) * 100) / 100

// ❌ Wrong — trusting client total
const { total } = clientPayload // NEVER
```

### Activity Logging
Use `logActivity()` for audit trail entries:

```typescript
import { logActivity } from '@/lib/activity'
await logActivity('inventory_create', { name: validated.name })
```

---

## i18n Guidelines

### Adding a New Translation Key

1. Add to **both** `messages/en.json` and `messages/es.json`
2. Use dot-notation namespaces: `"nav.dashboard"`, `"pos.checkout"`
3. Access in components: `const t = useTranslations('pos')`
4. Current namespaces: `common`, `auth`, `nav`, `pos`, `inventory`, `team`, `dashboard`, `settings`, `directory`, `checkout`, `Upgrade`, `Admin`, `Vault`, `links`, `automations`

### Adding a New Locale

1. Update `src/i18n/config.ts` to add the locale
2. Create `messages/{locale}.json` with all keys
3. The middleware and routing will handle automatically

---

## Contributing Guidelines

### Before Committing

```bash
npm run lint           # Must pass
npm run typecheck      # Must pass
npm run test           # Unit tests must pass
npm run test:e2e       # E2E tests must pass (requires running server)
```

### Pull Request Requirements
All 3 CI jobs must pass:
1. ✅ Lint & Type Check
2. ✅ Unit Tests (Vitest)
3. ✅ E2E Tests (Playwright)

### Adding a New Module

1. Create page at `src/app/[locale]/app/{module}/page.tsx`
2. Create server actions at `src/lib/actions/{module}.ts`
3. Create Zod schema at `src/lib/schemas/{module}.ts`
4. Add feature flag to `modules.config` JSONB default
5. Add i18n keys to both `en.json` and `es.json`
6. Add sidebar nav item in `components/sidebar.tsx`
7. Add E2E test at `e2e/{module}.spec.ts`
8. If feature-gated, call `requireFeature('{module}', locale)` in the page

### Adding a New Database Table

1. Create migration: `supabase/migrations/{timestamp}_{description}.sql`
2. Enable RLS: `ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;`
3. Add business-scoped policy: `USING (business_id = auth.business_id() OR auth.is_superadmin())`
4. Regenerate types: `npm run types:generate`
