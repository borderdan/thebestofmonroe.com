# The Best of Monroe — Master Migration & Build Guide

> **Origin**: `thebestofmexico.org` (Vite + React 19 + PHP 8 + MySQL)
> **Target**: Next.js 15 (App Router) + TypeScript + Supabase + shadcn/ui + Zustand

---

## Table of Contents

1. [Legacy Audit Summary](#1-legacy-audit-summary)
2. [New Tech Stack](#2-new-tech-stack)
3. [Phase 1: Database & Identity (Supabase)](#3-phase-1-database--identity)
4. [Phase 2: Backend API & Routing (Next.js)](#4-phase-2-backend-api--routing)
5. [Phase 3: Frontend Refactoring & UI](#5-phase-3-frontend-refactoring--ui)
6. [Phase 4: Integration Strategy](#6-phase-4-integration-strategy)
7. [Coding Standards](#7-coding-standards)
8. [File Structure](#8-target-file-structure)
9. [Legacy → New Mapping Tables](#9-legacy--new-mapping-tables)
10. [Architecture Patches Addendum](#10-architecture-patches-addendum)

---

## 1. Legacy Audit Summary

### Schema (`schema.sql` — MySQL 8)

| Table | Columns | Purpose |
|---|---|---|
| `users` | id, email, password_hash, business_name, slogan, category, is_visible, subscription_tier, guid | Business owner accounts |
| `keyrings` | id, guid, batch_id, pin, status, owner_id | NFC hardware devices (TBKs) |
| `links` | id, user_id, type, label, url, is_active, order_index | Social/contact links per business |
| `analytics` | id, entity_type, entity_id, click_count, last_click_at | Click tracking |

### API Layer (`public/api/` — 50+ PHP files)

| Category | Files | Notes |
|---|---|---|
| **Auth** | `login.php`, `register.php`, `check_auth.php`, `logout.php`, `session.php`, `setup_password.php` | Cookie/session-based auth |
| **CRUD** | `users.php`, `links.php`, `keyrings.php`, `themes.php`, `settings.php`, `categories.php`, `subscriptions.php`, `directory.php` | Standard REST-ish endpoints |
| **Payments** | `checkout_mp.php`, `receipt_mp.php` | MercadoPago integration |
| **Forms** | `eforms.php`, `submit_eform.php`, `public_eform.php`, `data_vault.php` | Dynamic form builder/viewer |
| **Admin** | `admin_users.php`, `admin_logs.php` | Super-admin management |
| **Utilities** | `config.php`, `init_db.php`, `interact.php`, `log_event.php`, `mailer.php` | Infra & logging |
| **Debug/Migration** | `debug.php`, `check_db.php`, `migrate_*.php`, `diag.php` | **Deprecated — do not port** |

### Frontend (`src/` — 43 JSX files, Vite + React Router v6)

| Directory | Files | Notes |
|---|---|---|
| `pages/` | 20 pages (Home, Editor, Login, Register, KeyringManager, LinkManager, ThemeEditor, DirectoryManager, UserManager, EFormsManager, etc.) | Full SPA with protected/admin routes |
| `components/` | DashboardLayout, Header, Sidebar, MapView, RankedTower, LocationPicker, LinkManager/*, ThemeEditor/*, ui/* | Mixed responsibility |
| `context/` | `AuthContext.jsx` | `useEffect` + `check_auth.php` polling |
| `services/` | `api.js` (610 lines) | Centralized fetch layer with mock fallbacks |

### Key Dependencies (Carry Forward)

| Package | Purpose | New Equivalent |
|---|---|---|
| `react`, `react-dom` | Core | Next.js built-in |
| `react-router-dom` | Routing | Next.js App Router |
| `tailwindcss` | Styling | Tailwind CSS v4 + shadcn/ui |
| `react-hot-toast` | Notifications | `sonner` (shadcn/ui) |
| `qrcode.react` | QR generation | **Keep** |
| `leaflet` / `react-leaflet` | Maps | **Keep** |
| `zustand` | State (planned) | **Keep** |
| `xlsx` | Excel export | **Keep** |

---

## 2. New Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 15.x |
| **Language** | TypeScript (strict) | 5.x |
| **Database** | Supabase (PostgreSQL 15) | Latest |
| **Auth** | Supabase Auth + `@supabase/ssr` | Latest |
| **ORM/Client** | `@supabase/supabase-js` + generated types | v2 |
| **UI Library** | shadcn/ui + Radix Primitives | Latest |
| **Styling** | Tailwind CSS | v4 |
| **State** | Zustand + `persist` middleware (IndexedDB via `idb-keyval`) | v5 |
| **Toast/Notifications** | Sonner (via shadcn/ui) | Latest |
| **Forms (External)** | Formbricks (self-hosted) | Latest |
| **Automations (External)** | n8n (self-hosted) | Latest |
| **Payments** | MercadoPago SDK + CoDi (Banco de México) | Latest |
| **Maps** | Leaflet + react-leaflet | Latest |
| **QR** | qrcode.react | Latest |

---

## 3. Phase 1: Database & Identity

> **Agent Directive**: Do not write frontend code until the database schema and RLS policies are strictly defined and applied.

### 3.1 Schema Translation (MySQL → PostgreSQL)

Convert the legacy `schema.sql` to a modern polymorphic PostgreSQL schema. The new schema is **intentionally broader** than the legacy one to support multiple business types without future schema migrations.

#### New Tables

```sql
-- ============================================================
-- 1. BUSINESSES (replaces the "user-as-business" pattern)
-- ============================================================
CREATE TABLE businesses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT UNIQUE NOT NULL,        -- URL-safe identifier
  name       TEXT NOT NULL,
  city       TEXT NOT NULL,
  category   TEXT DEFAULT 'Other',
  logo_url   TEXT,
  cover_url  TEXT,
  is_visible BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. USERS (Supabase Auth users linked to a business)
-- ============================================================
CREATE TABLE users (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  full_name      TEXT,
  is_superadmin  BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. MODULES (feature flags per business, JSONB)
-- ============================================================
CREATE TABLE modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  config      JSONB NOT NULL DEFAULT '{
    "pos": false,
    "crm": false,
    "eforms": false,
    "keyrings": true,
    "directory": true,
    "themes": true,
    "automations": false
  }'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ENTITIES (polymorphic data store)
-- ============================================================
CREATE TABLE entities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,  -- 'menu_item', 'link', 'keyring', 'form_field', etc.
  data        JSONB NOT NULL DEFAULT '{}',
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_entities_business_type ON entities(business_id, type);

-- ============================================================
-- 5. TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency      TEXT DEFAULT 'MXN',
  status        TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,  -- 'mercadopago', 'codi', 'cash'
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. ANALYTICS (kept as dedicated table for performance)
-- ============================================================
CREATE TABLE analytics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,  -- 'link', 'keyring', 'profile'
  entity_id   UUID NOT NULL,
  event       TEXT DEFAULT 'click',
  count       INT DEFAULT 0,
  last_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id, event)
);
```

#### Legacy → New Column Mapping

| Legacy (`users`) | New Location | Notes |
|---|---|---|
| `id` (int) | `businesses.id` (UUID) | Auto-generated |
| `email` | Supabase `auth.users.email` | Managed by Supabase Auth |
| `password_hash` | Supabase `auth.users` | **Never stored manually** |
| `business_name` | `businesses.name` | — |
| `slogan` | `entities` (type: `profile`, data.slogan) | Polymorphic |
| `category` | `businesses.category` | — |
| `is_visible` | `businesses.is_visible` | — |
| `subscription_tier` | `businesses.subscription_tier` | Typed column with CHECK constraint |
| `guid` | `businesses.id` (UUID) | Native UUID |

| Legacy (`keyrings`) | New Location | Notes |
|---|---|---|
| All columns | `entities` (type: `keyring`) | `data: { guid, batch_id, pin, status }` |

| Legacy (`links`) | New Location | Notes |
|---|---|---|
| All columns | `entities` (type: `link`) | `data: { label, url, link_type, is_active }` |

| Legacy (`analytics`) | New Location | Notes |
|---|---|---|
| All columns | `analytics` | Schema preserved, upgraded to UUID |

### 3.2 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Helper function: get the business_id from JWT
CREATE OR REPLACE FUNCTION auth.business_id()
RETURNS UUID AS $$
  SELECT business_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is a platform super-admin
CREATE OR REPLACE FUNCTION auth.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_superadmin FROM public.users WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- BUSINESSES: owners see their own business, super-admins see all
CREATE POLICY "Users can view their own business"
  ON businesses FOR SELECT
  USING (id = auth.business_id() OR auth.is_superadmin());

CREATE POLICY "Public businesses are visible"
  ON businesses FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Super-admins can manage all businesses"
  ON businesses FOR ALL
  USING (auth.is_superadmin())
  WITH CHECK (auth.is_superadmin());

-- USERS: users in same business can see each other, super-admins see all
CREATE POLICY "Users can view team members"
  ON users FOR SELECT
  USING (business_id = auth.business_id() OR auth.is_superadmin());

-- ENTITIES: full CRUD scoped to business, super-admins bypass
CREATE POLICY "Business entities access"
  ON entities FOR ALL
  USING (business_id = auth.business_id() OR auth.is_superadmin())
  WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());

-- MODULES: read/write scoped to business, super-admins bypass
CREATE POLICY "Business modules access"
  ON modules FOR ALL
  USING (business_id = auth.business_id() OR auth.is_superadmin())
  WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());

-- TRANSACTIONS: scoped to business, super-admins bypass
CREATE POLICY "Business transactions access"
  ON transactions FOR ALL
  USING (business_id = auth.business_id() OR auth.is_superadmin())
  WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());

-- ANALYTICS: scoped to business, super-admins bypass
CREATE POLICY "Business analytics access"
  ON analytics FOR ALL
  USING (business_id = auth.business_id() OR auth.is_superadmin())
  WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());
```

### 3.3 Auth Migration

| Legacy | New |
|---|---|
| `check_auth.php` (session cookie) | `@supabase/ssr` middleware in `middleware.ts` |
| `AuthContext.jsx` (useEffect polling) | Server-side session via `cookies()` + RSC |
| `login.php` / `register.php` | Supabase Auth (`signInWithPassword`, `signUp`) |
| `logout.php` | Supabase `signOut()` |

#### Middleware Pattern (`middleware.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /app/* routes
  if (request.nextUrl.pathname.startsWith('/app') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/app/:path*', '/api/:path*'],
}
```

---

## 4. Phase 2: Backend API & Routing

> **Agent Directive**: Translate legacy PHP scripts into Next.js Route Handlers and Server Actions.

### 4.1 Multi-Tenant Routing Strategy

```
app/
├── (public)/                          # Public-facing routes
│   ├── page.tsx                       # Root: Global directory & search
│   ├── [city]/
│   │   └── [slug]/
│   │       └── page.tsx               # Public tenant portal (menu, info)
│   │                                  # ?table=[id] triggers QR/hardware routing
│   └── login/page.tsx
│   └── register/page.tsx
│
├── app/                               # Secured back-office (admin)
│   ├── layout.tsx                     # Dashboard shell (sidebar, header)
│   ├── page.tsx                       # Dashboard home
│   ├── pos/page.tsx                   # POS module
│   ├── links/page.tsx                 # Link manager
│   ├── keyrings/page.tsx              # Keyring manager
│   ├── directory/page.tsx             # Directory manager
│   ├── eforms/page.tsx                # E-Forms
│   ├── themes/page.tsx                # Theme editor
│   ├── users/page.tsx                 # User/team manager
│   ├── settings/page.tsx              # Business settings
│   └── subscription/page.tsx          # Billing
│
├── api/
│   ├── webhooks/
│   │   └── mercadopago/route.ts       # MercadoPago webhook (HMAC verified)
│   ├── codi/
│   │   └── generate/route.ts          # CoDi payload generator
│   └── health/route.ts                # Health check
```

### 4.2 Legacy API Replacement Map

| Legacy PHP | New Next.js | Type |
|---|---|---|
| `login.php` | Supabase Auth `signInWithPassword` | Client-side SDK |
| `register.php` | Supabase Auth `signUp` | Client-side SDK |
| `check_auth.php` | `middleware.ts` + `getUser()` | Middleware |
| `logout.php` | Supabase `signOut()` | Client-side SDK |
| `config.php` | `.env.local` | Environment vars |
| `init_db.php` | Supabase migrations | **Deprecated** |
| `session.php` | `@supabase/ssr` cookies | **Deprecated** |
| `users.php` | Server Actions in `app/app/` | Server Action |
| `links.php` | Server Actions + `entities` table | Server Action |
| `keyrings.php` | Server Actions + `entities` table | Server Action |
| `themes.php` | Server Actions + `modules` table | Server Action |
| `settings.php` | Server Actions + `modules` table | Server Action |
| `categories.php` | Server Actions + `businesses` table | Server Action |
| `subscriptions.php` | Server Actions + `modules.config` | Server Action |
| `directory.php` | RSC data fetching + Server Actions | Server Action |
| `eforms.php` | Formbricks API integration | Server Action |
| `checkout_mp.php` | `app/api/webhooks/mercadopago/route.ts` | Route Handler |
| `receipt_mp.php` | `app/api/webhooks/mercadopago/route.ts` | Route Handler |
| `interact.php` / `log_event.php` | Supabase `analytics` insert | Server Action |
| `admin_users.php` | Server Actions in `app/app/users/` | Server Action |
| `admin_logs.php` | Server Actions (query `analytics`) | Server Action |
| `upload.php` | Supabase Storage upload | Server Action |
| `mailer.php` | n8n webhook → email action | n8n workflow |
| `debug*.php`, `migrate*.php`, `diag.php` | — | **Do not port** |

### 4.3 MercadoPago Webhook (`route.ts`)

```typescript
// app/api/webhooks/mercadopago/route.ts
import { createHmac } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-signature') ?? ''

  // HMAC verification
  const expected = createHmac('sha256', process.env.MP_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)
  const supabase = await createClient()

  // Update transaction status
  await supabase
    .from('transactions')
    .update({ status: payload.status === 'approved' ? 'completed' : 'failed' })
    .eq('metadata->>mp_payment_id', payload.data.id)

  return NextResponse.json({ received: true })
}
```

### 4.4 CoDi (Zero-Fee) Payment Route

```typescript
// app/api/codi/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface CodiPayload {
  amount: number
  concept: string
  businessId: string
}

export async function POST(request: NextRequest) {
  const { amount, concept, businessId }: CodiPayload = await request.json()

  // Generate CoDi-compliant payload per Banco de México spec
  const payload = {
    v: 1,
    ic: 0, // intent code: payment request
    dn: concept,
    cr: amount.toFixed(2),
    cc: 'MXN',
    rf: businessId,
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
  const deepLink = `codi://pay?payload=${encodedPayload}`

  return NextResponse.json({ deepLink, payload: encodedPayload })
}
```

---

## 5. Phase 3: Frontend Refactoring & UI

> **Agent Directive**: Migrate Vite JSX to Next.js TSX. Heavily utilize shadcn/ui for rapid administrative interface generation.

### 5.1 Component Migration Map

| Legacy (Vite JSX) | New (Next.js TSX) | Notes |
|---|---|---|
| `src/App.jsx` | `app/layout.tsx` + route structure | App Router replaces React Router |
| `src/main.jsx` | `app/layout.tsx` | Root layout |
| `src/context/AuthContext.jsx` | `lib/supabase/` + middleware | **Deleted** |
| `src/services/api.js` | Server Actions + Supabase client | **Deleted** |
| `src/components/DashboardLayout.jsx` | `app/app/layout.tsx` | Admin shell |
| `src/components/Header.jsx` | `components/header.tsx` | — |
| `src/components/Sidebar.jsx` | `components/sidebar.tsx` | shadcn/ui sidebar |
| `src/components/MapView.jsx` | `components/map-view.tsx` | Keep leaflet |
| `src/components/RankedTower.jsx` | `components/ranked-tower.tsx` | — |
| `src/components/LocationPicker.jsx` | `components/location-picker.tsx` | — |
| `src/components/LinkManager/*` | `components/link-manager/*` | — |
| `src/components/ThemeEditor/*` | `components/theme-editor/*` | Save to `modules` JSONB |
| `src/components/ui/*` | shadcn/ui components | **Replaced** |
| `src/pages/Home.jsx` | `app/(public)/page.tsx` | RSC |
| `src/pages/Login.jsx` | `app/(public)/login/page.tsx` | Supabase Auth |
| `src/pages/Register.jsx` | `app/(public)/register/page.tsx` | Supabase Auth |
| `src/pages/Editor.jsx` | `app/app/editor/page.tsx` | — |
| `src/pages/KeyringManager.jsx` | `app/app/keyrings/page.tsx` | Uses `entities` |
| `src/pages/LinkManager.jsx` | `app/app/links/page.tsx` | Uses `entities` |
| `src/pages/ThemeEditor.jsx` | `app/app/themes/page.tsx` | Saves to `modules` |
| `src/pages/DirectoryManager.jsx` | `app/app/directory/page.tsx` | shadcn/ui DataTable |
| `src/pages/UserManager.jsx` | `app/app/users/page.tsx` | shadcn/ui DataTable |
| `src/pages/EFormsManager.jsx` | `app/app/eforms/page.tsx` | Formbricks embed |
| `src/pages/Settings.jsx` | `app/app/settings/page.tsx` | — |
| `src/pages/Subscription.jsx` | `app/app/subscription/page.tsx` | — |
| `src/pages/SmartCV.jsx` | `app/(public)/[city]/[slug]/page.tsx` | Public profile |
| `src/pages/PublicEForm.jsx` | `app/(public)/forms/[id]/page.tsx` | Public form |
| `src/pages/LandingPage.jsx` | `app/(public)/[city]/[slug]/page.tsx` | Merged with SmartCV |
| `src/pages/DataVaultViewer.jsx` | `app/app/eforms/[id]/vault/page.tsx` | — |

### 5.2 POS Module (Zustand + Persist)

> **Refinement**: The POS cart uses Zustand's `persist` middleware backed by IndexedDB (via `idb-keyval`). This ensures the cart survives accidental page refreshes, mobile browser memory purging, and maintains offline resilience — critical for Mexican SME environments with unreliable connectivity.

#### Cart Store (`stores/use-cart-store.ts`)

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'

interface CartItem {
  entityId: string
  name: string
  price: number
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (entityId: string) => void
  updateQuantity: (entityId: string, quantity: number) => void
  clearCart: () => void
  subtotal: () => number
  tax: () => number
  total: () => number
}

const TAX_RATE = 0.16 // Mexico IVA

// IndexedDB storage adapter for Zustand persist
const indexedDBStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const value = await idbGet(name)
    return value ?? null
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value)
  },
  removeItem: async (name: string) => {
    await idbDel(name)
  },
}))

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.entityId === item.entityId)
        if (existing) {
          return {
            items: state.items.map(i =>
              i.entityId === item.entityId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          }
        }
        return { items: [...state.items, { ...item, quantity: 1 }] }
      }),

      removeItem: (entityId) => set((state) => ({
        items: state.items.filter(i => i.entityId !== entityId),
      })),

      updateQuantity: (entityId, quantity) => set((state) => ({
        items: quantity <= 0
          ? state.items.filter(i => i.entityId !== entityId)
          : state.items.map(i =>
              i.entityId === entityId ? { ...i, quantity } : i
            ),
      })),

      clearCart: () => set({ items: [] }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      tax: () => get().subtotal() * TAX_RATE,
      total: () => get().subtotal() + get().tax(),
    }),
    {
      name: 'tbm-pos-cart',     // IndexedDB key
      storage: indexedDBStorage,  // Persist to IndexedDB, not localStorage
      partialize: (state) => ({ items: state.items }), // Only persist cart items
    }
  )
)
```

#### POS Checkout Flow (Server Action)

```typescript
// app/app/pos/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CheckoutPayload {
  items: { entityId: string; quantity: number; price: number }[]
  paymentMethod: 'cash' | 'mercadopago' | 'codi'
  total: number
}

export async function processCheckout(payload: CheckoutPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  // 1. Write transaction
  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      business_id: profile!.business_id,
      total: payload.total,
      status: payload.paymentMethod === 'cash' ? 'completed' : 'pending',
      payment_method: payload.paymentMethod,
      metadata: { items: payload.items },
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // 2. Deduct inventory from entities
  for (const item of payload.items) {
    const { data: entity } = await supabase
      .from('entities')
      .select('data')
      .eq('id', item.entityId)
      .single()

    if (entity?.data?.stock !== undefined) {
      await supabase
        .from('entities')
        .update({
          data: { ...entity.data, stock: entity.data.stock - item.quantity },
        })
        .eq('id', item.entityId)
    }
  }

  revalidatePath('/app/pos')
  return transaction
}
```

### 5.3 QR & Hardware Interfaces

#### QR Generation

```typescript
// components/qr-generator.tsx
'use client'
import { QRCodeSVG } from 'qrcode.react'

interface QRGeneratorProps {
  city: string
  slug: string
  tableId?: string
}

export function QRGenerator({ city, slug, tableId }: QRGeneratorProps) {
  const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${city}/${slug}`
  const url = tableId ? `${baseUrl}?table=${tableId}` : baseUrl

  return (
    <QRCodeSVG
      value={url}
      size={256}
      level="H"
      includeMargin
      className="rounded-lg shadow-md"
    />
  )
}
```

#### HID Hardware Listener (RFID/Barcode)

```typescript
// hooks/use-hid-scanner.ts
'use client'
import { useEffect, useRef, useCallback } from 'react'

export function useHidScanner(onScan: (code: string) => void) {
  const buffer = useRef('')
  const timeout = useRef<NodeJS.Timeout | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = e.target as HTMLElement
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

    if (e.key === 'Enter' && buffer.current.length > 3) {
      onScan(buffer.current)
      buffer.current = ''
      return
    }

    if (e.key.length === 1) {
      buffer.current += e.key

      // Reset buffer after 100ms of inactivity (HID scanners are fast)
      if (timeout.current) clearTimeout(timeout.current)
      timeout.current = setTimeout(() => { buffer.current = '' }, 100)
    }
  }, [onScan])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
```

### 5.4 Theme Engine Migration

| Legacy | New |
|---|---|
| `ThemeEditorCanvas.jsx` drag-and-drop canvas | Port to TSX, use `@dnd-kit/core` |
| JSON layout saved via `themes.php` → PHP file write | JSON layout saved to `modules` table JSONB in Supabase |
| `ThemeEditorSidebarLeft.jsx` | Port to TSX with shadcn/ui Sheet |
| `ThemeEditorSidebarRight.jsx` | Port to TSX with shadcn/ui Sheet |
| `ThemeEditorToolbar.jsx` | Port to TSX with shadcn/ui Toolbar |

---

## 6. Phase 4: Integration Strategy

> **Agent Directive**: Do not attempt to build a custom visual workflow engine or drag-and-drop form builder from scratch.

### 6.1 E-Forms (Formbricks React SDK)

> **Refinement**: Use `@formbricks/react` instead of `<iframe>` embedding. This enables injecting the authenticated Supabase `user.id` as a hidden attribute into the form session, automatically linking submissions to the correct tenant without manual business ID input.

| Aspect | Implementation |
|---|---|
| **Hosting** | Self-hosted Formbricks instance |
| **Frontend** | `@formbricks/react` SDK embedded in `app/app/eforms/` with authenticated user context |
| **Backend** | Formbricks API writes form schemas; webhook fires on submission |
| **Data Flow** | `Formbricks Submit → Webhook → Next.js Route → Supabase entities (type: 'form_submission')` |

#### Formbricks Integration Pattern

```typescript
// components/formbricks-embed.tsx
'use client'
import { FormbricksProvider } from '@formbricks/react'

interface FormbricksEmbedProps {
  userId: string
  businessId: string
}

export function FormbricksEmbed({ userId, businessId }: FormbricksEmbedProps) {
  return (
    <FormbricksProvider
      environmentId={process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID!}
      apiHost={process.env.NEXT_PUBLIC_FORMBRICKS_API_URL!}
      userId={userId}
      attributes={{
        businessId,          // Auto-links submissions to tenant
        source: 'The Best of Monroe',
      }}
    />
  )
}
```

```typescript
// app/app/eforms/page.tsx (RSC — passes auth context down)
import { createClient } from '@/lib/supabase/server'
import { FormbricksEmbed } from '@/components/formbricks-embed'

export default async function EFormsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <h1>E-Forms</h1>
      <FormbricksEmbed
        userId={user!.id}
        businessId={profile!.business_id}
      />
    </div>
  )
}
```

### 6.2 Automations (n8n)

| Trigger | Webhook Source | n8n Action |
|---|---|---|
| New transaction | Supabase DB webhook or Server Action POST | Send WhatsApp receipt, update inventory, notify supplier |
| Form submission | Formbricks webhook → n8n | Write to Supabase, send confirmation email |
| New user signup | Supabase Auth webhook | Welcome email, create default modules |

#### Webhook Pattern (Signed)

> **Refinement**: All n8n webhook calls include a static `x-tbm-signature` header. The n8n webhook node **must** be configured to reject payloads lacking this header to prevent unauthorized workflow execution.

```typescript
// lib/webhooks.ts
export async function fireWebhook(
  event: string,
  payload: Record<string, unknown>
) {
  await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tbm-signature': process.env.N8N_WEBHOOK_SECRET!, // Static shared secret
    },
    body: JSON.stringify({ event, timestamp: Date.now(), ...payload }),
  }).catch(console.error) // Fire-and-forget, never block the user
}
```

> **n8n Configuration**: In the n8n webhook node, add a header auth check:
> `Header Auth → Name: x-tbm-signature → Value: (matching N8N_WEBHOOK_SECRET)`

---

## 7. Coding Standards

### TypeScript

- **`strict: true`** in `tsconfig.json`. No `any` type usage.
- Generate Supabase types: `npx supabase gen types typescript --project-id <id> > lib/database.types.ts`
- Define interfaces for all API returns using generated types.

> **Refinement**: Automate type generation to prevent type drift during rapid iteration.

```jsonc
// package.json (partial)
{
  "scripts": {
    "postinstall": "npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > lib/database.types.ts",
    "types:generate": "npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > lib/database.types.ts"
  }
}
```

> For CI/CD, add this as a GitHub Action step that runs on any migration file change in `supabase/migrations/`.

### Data Fetching

- ❌ **Never** use `useEffect` for data fetching.
- ✅ Use React Server Components (RSC) at the page level.
- ✅ Pass data down as props to Client Components.

```typescript
// ✅ Correct: RSC data fetching
// app/app/links/page.tsx
import { createClient } from '@/lib/supabase/server'
import { LinksTable } from '@/components/links-table'

export default async function LinksPage() {
  const supabase = await createClient()
  const { data: links } = await supabase
    .from('entities')
    .select('*')
    .eq('type', 'link')
    .order('sort_order')

  return <LinksTable links={links ?? []} />
}
```

### UI/UX

- **Mobile-first design** (Mexican SMEs use iOS/Android predominantly).
- All touch targets ≥ 44×44px.
- shadcn/ui components as the foundation for all admin interfaces.
- Sonner (`toast`) for all mutation feedback.

### Error Handling

- React Error Boundaries at layout level (`error.tsx` files).
- Localized toast notifications for all failed mutations.

```typescript
// app/app/error.tsx
'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded-lg">
        Try again
      </button>
    </div>
  )
}
```

---

## 8. Target File Structure

```
The Best of Monroe/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Global directory
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forms/[id]/page.tsx         # Public e-form
│   │   └── [city]/[slug]/page.tsx      # Public business portal
│   ├── app/                            # Protected admin area
│   │   ├── layout.tsx                  # Dashboard layout (sidebar)
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── pos/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   ├── links/page.tsx
│   │   ├── keyrings/page.tsx
│   │   ├── directory/page.tsx
│   │   ├── eforms/
│   │   │   ├── page.tsx
│   │   │   └── [id]/vault/page.tsx
│   │   ├── themes/page.tsx
│   │   ├── users/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── subscription/page.tsx
│   │   └── error.tsx
│   ├── api/
│   │   ├── webhooks/mercadopago/route.ts
│   │   ├── codi/generate/route.ts
│   │   └── health/route.ts
│   ├── layout.tsx                      # Root layout
│   ├── globals.css
│   └── error.tsx
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── map-view.tsx
│   ├── ranked-tower.tsx
│   ├── qr-generator.tsx
│   ├── links-table.tsx
│   ├── link-manager/
│   ├── theme-editor/
│   └── pos/
│       ├── product-grid.tsx
│       ├── cart-panel.tsx
│       └── checkout-dialog.tsx
├── hooks/
│   ├── use-hid-scanner.ts
│   └── use-mobile.ts
├── stores/
│   └── use-cart-store.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client
│   │   └── middleware.ts               # Middleware client
│   ├── database.types.ts               # Generated Supabase types
│   └── utils.ts
├── middleware.ts
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── package.json
└── .env.local
```

---

## 9. Legacy → New Mapping Tables

### Route Mapping

| Legacy Route | New Route | Access |
|---|---|---|
| `/` | `/` | Public |
| `/login` | `/login` | Public |
| `/register` | `/register` | Public |
| `/profile/:guid` | `/[city]/[slug]` | Public |
| `/f/:guid` | `/forms/[id]` | Public |
| `/p/:pid` | `/[city]/[slug]` | Public |
| `/editor` | `/app/editor` | Protected |
| `/keyrings` | `/app/keyrings` | Protected |
| `/links` | `/app/links` | Protected |
| `/eforms` | `/app/eforms` | Protected |
| `/eforms/:id/vault` | `/app/eforms/[id]/vault` | Protected |
| `/subscription` | `/app/subscription` | Protected |
| `/directory` | `/app/directory` | Protected |
| `/thanks` | `/app/subscription` (success state) | Protected |
| `/themes` | `/app/themes` | Admin |
| `/settings` | `/app/settings` | Admin |
| `/users` | `/app/users` | Admin |
| `/setup` | `/app/settings` | Admin |
| `/setup-password` | Supabase Auth password reset flow | Public |

### Environment Variables (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# MercadoPago
MP_ACCESS_TOKEN=APP_USR-...
MP_WEBHOOK_SECRET=...

# n8n
N8N_WEBHOOK_URL=https://your-n8n.example.com/webhook/...
N8N_WEBHOOK_SECRET=your-shared-secret-here

# Formbricks
NEXT_PUBLIC_FORMBRICKS_API_URL=https://your-formbricks.example.com
NEXT_PUBLIC_FORMBRICKS_ENV_ID=your-environment-id
FORMBRICKS_API_KEY=...

# Supabase Type Gen (used by postinstall)
SUPABASE_PROJECT_ID=your-project-id

# App
NEXT_PUBLIC_APP_URL=https://thebestofmexico.org
```

---

## 10. Architecture Patches Addendum

> **Agent Directive**: Integrate the following database triggers, security policies, and infrastructure requirements into Phase 1 setup. Implement routing, i18n, and testing requirements in Phases 2 and 3. These patches address critical failure points identified during architectural review.

### 10.1 Auth Race Condition — Database Trigger

When a user signs up via Supabase Auth, they exist in `auth.users` but **not yet** in `public.users`. Without a trigger, every RLS policy silently returns zero rows.

> **Important**: The trigger handles two distinct signup flows:
> 1. **New business creation** — creates `businesses`, `modules`, and `users` rows atomically
> 2. **Join existing business** — only creates the `users` row with the provided `business_id`

```sql
-- ============================================================
-- AUTH TRIGGER: Bootstrap user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _business_id UUID;
  _business_name TEXT;
  _business_slug TEXT;
  _business_city TEXT;
BEGIN
  -- Check if joining an existing business or creating a new one
  _business_id := (NEW.raw_user_meta_data->>'business_id')::uuid;

  IF _business_id IS NULL THEN
    -- FLOW 1: New business signup — create the business first
    _business_name := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business');
    _business_city := COALESCE(NEW.raw_user_meta_data->>'city', 'Unknown');
    _business_slug := LOWER(REGEXP_REPLACE(_business_name, '[^a-zA-Z0-9]', '-', 'g'))
                      || '-' || SUBSTR(gen_random_uuid()::text, 1, 8);

    INSERT INTO public.businesses (id, name, slug, city)
    VALUES (gen_random_uuid(), _business_name, _business_slug, _business_city)
    RETURNING id INTO _business_id;

    -- Auto-create default modules for the new business
    INSERT INTO public.modules (business_id) VALUES (_business_id);
  END IF;

  -- FLOW 1 & 2: Create the user profile row
  INSERT INTO public.users (id, business_id, role, full_name)
  VALUES (
    NEW.id,
    _business_id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 10.2 Storage Bucket Policies

Initializes the Supabase Storage bucket for business logos, covers, and product images. Public read, authenticated write scoped to the uploader.

```sql
-- ============================================================
-- STORAGE: Tenant asset bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-assets', 'tenant-assets', true);

-- Anyone can view uploaded assets (logos, product images)
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tenant-assets');

-- Only authenticated users can upload, and they own their uploads
CREATE POLICY "Authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND auth.role() = 'authenticated'
  );

-- Users can only update/delete their own uploads
CREATE POLICY "Owner update/delete"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'tenant-assets' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'tenant-assets' AND owner = auth.uid());

CREATE POLICY "Owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tenant-assets' AND owner = auth.uid());
```

### 10.3 Activity Log Table

Replaces legacy `log_event.php`. Essential for debugging tenant actions and future SOC2 compliance.

```sql
-- ============================================================
-- ACTIVITY LOG (forensic audit trail)
-- ============================================================
CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,  -- 'page_view', 'login', 'entity_update', 'checkout', etc.
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_log_business ON activity_log(business_id, created_at DESC);
CREATE INDEX idx_activity_log_action ON activity_log(action, created_at DESC);

-- RLS: scoped to business, super-admins see all
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business activity log access"
  ON activity_log FOR ALL
  USING (business_id = auth.business_id() OR auth.is_superadmin())
  WITH CHECK (business_id = auth.business_id() OR auth.is_superadmin());
```

#### Server Action Pattern

```typescript
// lib/activity.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function logActivity(action: string, metadata: Record<string, unknown> = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  await supabase.from('activity_log').insert({
    business_id: profile?.business_id,
    user_id: user.id,
    action,
    metadata,
  })
}
```

### 10.4 Internationalization (i18n)

> **Requirement**: Default locale `es-MX` for Mexican SMEs. English (`en`) for tourist-facing public pages.

Use `next-intl` middleware. All routes are prefixed with `[locale]`.

#### Updated Route Structure

```
app/
├── [locale]/
│   ├── (public)/
│   │   ├── page.tsx                    # Global directory
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forms/[id]/page.tsx
│   │   └── [city]/[slug]/page.tsx
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── pos/page.tsx
│   │   └── ...
│   └── layout.tsx                      # Locale-aware root layout
├── api/                                # API routes are NOT localized
│   ├── webhooks/mercadopago/route.ts
│   └── health/route.ts
```

#### Configuration

```typescript
// i18n/config.ts
export const locales = ['es', 'en'] as const
export const defaultLocale = 'es' as const
export type Locale = (typeof locales)[number]
```

```typescript
// middleware.ts (updated to combine Supabase + i18n)
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/config'

const intlMiddleware = createMiddleware({ locales, defaultLocale })

export default async function middleware(request: NextRequest) {
  // 1. Handle i18n routing
  const response = intlMiddleware(request)

  // 2. Handle Supabase auth (on protected routes)
  // ... existing Supabase middleware logic ...

  return response
}
```

### 10.5 Public SEO & Open Graph

Implement `generateMetadata` for public tenant pages to enable rich social sharing and search engine indexing.

```typescript
// app/[locale]/(public)/[city]/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ city: string; slug: string; locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, slug } = await params
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('name, category, logo_url, cover_url')
    .eq('slug', slug)
    .eq('city', city)
    .single()

  if (!business) return { title: 'Not Found' }

  return {
    title: `${business.name} — The Best of ${city}`,
    description: `${business.name} | ${business.category} in ${city}, Mexico`,
    openGraph: {
      title: business.name,
      description: `${business.category} in ${city}`,
      images: [business.cover_url ?? business.logo_url ?? ''].filter(Boolean),
      type: 'website',
    },
  }
}

// JSON-LD Structured Data (schema.org/LocalBusiness)
function BusinessJsonLd({ business, city }: { business: any; city: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    image: business.logo_url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressCountry: 'MX',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

### 10.6 Testing Infrastructure

| Tool | Scope | Target |
|---|---|---|
| **Vitest** | Unit tests | Zustand stores, utility functions, type validation |
| **Playwright** | E2E tests | Auth flow, POS checkout, QR routing, admin CRUD |
| **pgTAP** (optional) | Database tests | RLS policy validation, trigger behavior |

#### Package Installation

```jsonc
// package.json (devDependencies)
{
  "devDependencies": {
    "vitest": "^3.x",
    "@playwright/test": "^1.x",
    "@testing-library/react": "^16.x"
  },
  "scripts": {
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

#### Example: Cart Store Unit Test

```typescript
// stores/__tests__/use-cart-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../use-cart-store'

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('adds an item with quantity 1', () => {
    useCartStore.getState().addItem({ entityId: '1', name: 'Taco', price: 50 })
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(1)
  })

  it('increments quantity on duplicate add', () => {
    useCartStore.getState().addItem({ entityId: '1', name: 'Taco', price: 50 })
    useCartStore.getState().addItem({ entityId: '1', name: 'Taco', price: 50 })
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('calculates tax at 16% IVA', () => {
    useCartStore.getState().addItem({ entityId: '1', name: 'Taco', price: 100 })
    expect(useCartStore.getState().tax()).toBe(16)
    expect(useCartStore.getState().total()).toBe(116)
  })
})
```

#### Example: Playwright Auth E2E

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('redirects unauthenticated users from /app to /login', async ({ page }) => {
  await page.goto('/app')
  await expect(page).toHaveURL(/\/login/)
})

test('login flow completes and shows dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'testpassword')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

### 10.7 Payments — CoDi Deferral

> [!CAUTION]
> **CoDi integration is deferred to Phase 5.** Real CoDi implementation requires certification with Banco de México and a participant banking institution. The existing `app/api/codi/generate/route.ts` is retained as a reference implementation but must **not** be deployed to production without federal banking API compliance.

**MVP Payment Stack:**

| Method | Integration | Status |
|---|---|---|
| **MercadoPago (Online)** | Webhook + Checkout API | ✅ Phase 2 |
| **MercadoPago Point (Terminal)** | Point API for physical card readers | ✅ Phase 2 |
| **Cash** | POS records transaction as `completed` immediately | ✅ Phase 3 |
| **CoDi** | Banco de México deep link | 🔒 Phase 5 (pending certification) |

---

## Summary of All Architecture Patches

| # | Patch | Section | Risk if Omitted |
|---|---|---|---|
| 1 | Auth bootstrap trigger | §10.1 | 🔴 All RLS policies fail for new users |
| 2 | Super-admin RLS bypass | §3.2 (updated inline) | 🔴 Platform owners locked out of tenant management |
| 3 | Storage bucket policies | §10.2 | 🔴 Image uploads silently fail or are world-writable |
| 4 | `subscription_tier` typed column | §3.1 (updated inline) | 🟡 Billing limits unenforceable at DB level |
| 5 | Activity log table | §10.3 | 🟡 No forensic audit trail for debugging |
| 6 | i18n routing (`next-intl`) | §10.4 | 🟡 Spanish-only market served in English |
| 7 | SEO / Open Graph | §10.5 | 🟢 Poor social sharing and search visibility |
| 8 | Testing infrastructure | §10.6 | 🟡 No automated validation of payment/auth flows |
| 9 | CoDi → Phase 5 | §10.7 | 🟢 Regulatory compliance risk |
