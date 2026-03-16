# The Best of Monroe — Agent Handoff Guide

> **Project**: The Best of Mexico (TBM) → The Best of Monroe migration
> **Handoff Date**: March 10, 2026
> **Status**: Architecture complete. Phase 1 scaffolding ready to begin.

---

## 1. What This Project Is

You are migrating a **legacy SaaS platform** (`thebestofmexico.org`) from a Vite + React + PHP + MySQL stack to a **modern Next.js 15 + TypeScript + Supabase** stack. The new project lives in `c:\antigravity\The Best of Monroe`.

This is **not a simple port** — it's a full architectural transformation with a polymorphic database, multi-tenant RLS, and an entirely new routing scheme.

---

## 2. Files You MUST Read (In This Order)

| Priority | File | Why |
|---|---|---|
| 🔴 **1st** | [MASTER_GUIDE.md](file:///c:/antigravity/The Best of Monroe/MASTER_GUIDE.md) | **~1,435 lines.** This is the complete system prompt. Contains the full PostgreSQL schema, RLS policies, auth trigger, API replacement map, component migration table, code patterns, and all architecture patch addenda. **Read the entire file.** |
| 🔴 **2nd** | [.env.local](file:///c:/antigravity/The Best of Monroe/.env.local) | Supabase credentials are already populated. MercadoPago, n8n, Formbricks are commented out (not yet configured). |
| 🟡 **3rd** | [schema.sql](file:///c:/antigravity/thebestofmexico.org/schema.sql) | The legacy MySQL schema (87 lines). Useful for understanding what the new schema replaces. |
| 🟡 **4th** | [api.js](file:///c:/antigravity/thebestofmexico.org/src/services/api.js) | Legacy API service layer (610 lines, 25+ endpoints). Every function here maps to a new Server Action or Supabase client call — the mapping table is in MASTER_GUIDE.md §4.2. |
| 🟡 **5th** | [App.jsx](file:///c:/antigravity/thebestofmexico.org/src/App.jsx) | Legacy routing (158 lines, 20+ routes). The route mapping table is in MASTER_GUIDE.md §9. |
| 🟢 **Optional** | [tbm.md](file:///c:/antigravity/thebestofmexico.org/tbm.md) | Original project manifesto with business rules (subscription tiers, TBK/NFC logic, redirect flow). |

---

## 3. Current State of the Project

### What Has Been Done ✅
- Full audit of the legacy codebase (50+ PHP files, 43 JSX files, MySQL schema)
- Complete `MASTER_GUIDE.md` written with:
  - PostgreSQL schema (7 tables + activity_log)
  - RLS policies with super-admin bypass
  - Auth bootstrap trigger (dual-flow: new business + join existing)
  - Storage bucket policies
  - Full API replacement map (legacy PHP → Next.js Server Actions)
  - Full component migration map (legacy JSX → Next.js TSX)
  - Zustand POS cart store with IndexedDB persistence
  - HID scanner hook, QR generator, theme engine migration plan
  - Formbricks React SDK integration pattern
  - n8n webhook signing pattern
  - i18n routing strategy (next-intl, default: es)
  - SEO/Open Graph + JSON-LD pattern
  - Testing infrastructure (Vitest + Playwright with examples)
  - CoDi deferred to Phase 5
- `.env.local` populated with live Supabase credentials
- Four architectural refinements applied per user feedback

### What Has NOT Been Done ❌
- **No code has been written yet.** The `The Best of Monroe` folder only contains `MASTER_GUIDE.md` and `.env.local`.
- Next.js project has not been scaffolded
- No SQL has been executed against Supabase
- No dependencies have been installed
- No components have been built

---

## 4. Immediate Next Steps (Phase 1)

Execute these in order:

### Step 1: Scaffold Next.js

```powershell
cd c:\antigravity\The Best of Monroe
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

> ⚠️ **Workspace restriction**: The user's working directory is `c:\antigravity\The Best of Monroe`. If your workspace is limited to `thebestofmexico.org`, ask the user to either adjust the workspace or run the scaffold command manually. This was a blocker for the previous agent.

### Step 2: Install Core Dependencies

```powershell
npm install @supabase/supabase-js @supabase/ssr zustand idb-keyval next-intl qrcode.react
npx shadcn@latest init
```

### Step 3: Create Supabase Client Utilities

Create `src/lib/supabase/client.ts`, `server.ts`, and `middleware.ts` per the patterns in MASTER_GUIDE.md §3.3.

### Step 4: Execute Database Schema

Run the full SQL from MASTER_GUIDE.md §3.1 in the Supabase SQL Editor (or via CLI). This includes:
- 7 tables: `businesses`, `users`, `modules`, `entities`, `transactions`, `analytics`, `activity_log`
- 2 helper functions: `auth.business_id()`, `auth.is_superadmin()`
- Auth bootstrap trigger: `public.handle_new_user()`
- All RLS policies (with super-admin bypass)
- Storage bucket + policies

### Step 5: Generate TypeScript Types

```powershell
npx supabase gen types typescript --project-id amrqoakoyknuozwlftuf > src/lib/database.types.ts
```

### Step 6: Implement Middleware

Create `src/middleware.ts` combining Supabase auth + next-intl i18n routing per MASTER_GUIDE.md §3.3 + §10.4.

---

## 5. Critical Gotchas & Lessons Learned

### 🔴 The User's Communication Style
- **"Remove the node files"** meant "exclude them from the tree export", NOT "delete them from the project." The user was previously burned when I deleted `node_modules` and `package-lock.json` based on a misunderstanding. **Always confirm destructive actions explicitly.** If the user says "remove X", clarify whether they mean from the filesystem or from a document/export.

### 🔴 Workspace Restrictions
- The user's workspace may be restricted to `c:\antigravity\thebestofmexico.org`. The `The Best of Monroe` folder is at `c:\antigravity\The Best of Monroe`. If you cannot run commands in `The Best of Monroe`, ask the user to adjust workspace validation. This blocked the previous agent from scaffolding.

### 🟡 The Legacy Codebase Is Reference Only
- `c:\antigravity\thebestofmexico.org` is the **legacy project** cloned from Git. Do NOT modify it. It exists purely as a reference for migration. All new code goes in `c:\antigravity\The Best of Monroe`.

### 🟡 Supabase Is Live
- The `.env.local` contains real, live Supabase credentials (project ID: `amrqoakoyknuozwlftuf`). Any SQL you execute in the Supabase dashboard or via CLI will affect a real database. Be careful with destructive operations.

### 🟡 The User Thinks Architecturally
- This user provides detailed, structured feedback. They review plans carefully and respond with formatted tables and technical specifications. Match their level of precision. They appreciate when you identify risks proactively (see MASTER_GUIDE.md §10 — the entire addendum came from my risk analysis).

### 🟢 Phase Execution Order
- The MASTER_GUIDE.md is structured in 4 phases + addendum. Phase 1 (Database & Identity) must be fully complete before Phase 2 (Backend API). Phase 3 (Frontend) depends on Phase 2. Phase 4 (Integrations) is independent but requires Phases 1-2. CoDi is explicitly deferred to Phase 5.

---

## 6. Key Architecture Decisions Already Made

These were discussed and approved by the user — do not revisit:

| Decision | Rationale |
|---|---|
| Polymorphic `entities` table with JSONB | Supports multiple business types without schema migrations |
| `subscription_tier` as typed column on `businesses` (not JSONB) | Enables DB-level enforcement of billing limits |
| `is_superadmin` on `users` (not a separate role table) | Simple platform admin bypass for RLS |
| Zustand with IndexedDB persistence (not localStorage) | Survives mobile browser memory purging + offline resilience |
| `@formbricks/react` SDK (not iframe) | Enables injecting authenticated user context into form sessions |
| n8n webhooks with `x-tbm-signature` header | Prevents unauthorized workflow execution |
| `next-intl` for i18n (not Next.js built-in) | More mature library for App Router; default locale `es` |
| CoDi deferred to Phase 5 | Requires Banco de México certification — regulatory blocker |
| Auth trigger handles dual signup flows | New business creation + join existing business in one trigger |

---

## 7. File Structure Reference

The target file structure is defined in MASTER_GUIDE.md §8 (with i18n update in §10.4). Key highlights:

```
The Best of Monroe/
├── src/
│   ├── app/
│   │   ├── [locale]/(public)/          # Public pages (directory, login, business profiles)
│   │   ├── [locale]/app/               # Protected admin dashboard
│   │   └── api/                        # API routes (NOT localized)
│   ├── components/                     # shadcn/ui + custom components
│   ├── hooks/                          # use-hid-scanner, use-mobile
│   ├── stores/                         # Zustand stores (use-cart-store)
│   ├── lib/
│   │   ├── supabase/                   # client.ts, server.ts, middleware.ts
│   │   ├── database.types.ts           # Auto-generated Supabase types
│   │   ├── activity.ts                 # logActivity server action
│   │   ├── webhooks.ts                 # fireWebhook with signature
│   │   └── utils.ts
│   └── i18n/                           # next-intl config + message files
├── e2e/                                # Playwright tests
├── MASTER_GUIDE.md                     # The complete system prompt
├── .env.local                          # Supabase creds (populated)
└── middleware.ts                       # Supabase auth + i18n routing
```

---

## 8. Legacy Codebase Quick Reference

If you need to examine legacy implementation details, here's a cheat sheet:

| What You Need | Where to Find It |
|---|---|
| Database schema | `c:\antigravity\thebestofmexico.org\schema.sql` |
| All API endpoints | `c:\antigravity\thebestofmexico.org\public\api\*.php` (50+ files) |
| Frontend API service | `c:\antigravity\thebestofmexico.org\src\services\api.js` |
| Auth implementation | `c:\antigravity\thebestofmexico.org\src\context\AuthContext.jsx` |
| All routes | `c:\antigravity\thebestofmexico.org\src\App.jsx` |
| All pages | `c:\antigravity\thebestofmexico.org\src\pages\*.jsx` (20 files) |
| All components | `c:\antigravity\thebestofmexico.org\src\components\*` (17 files) |
| ThemeEditor (complex) | `c:\antigravity\thebestofmexico.org\src\components\ThemeEditor\*.jsx` (5 files) |
| Project config | `c:\antigravity\thebestofmexico.org\package.json` |
| Business rules | `c:\antigravity\thebestofmexico.org\tbm.md` |

---

## 9. Coding Standards (Quick Recap)

- **TypeScript `strict: true`**. No `any`. Use generated Supabase types.
- **No `useEffect` for data fetching.** Use RSC at page level, pass data as props.
- **Mobile-first design.** Touch targets ≥ 44×44px. Mexican SMEs use phones, not desktops.
- **shadcn/ui** for all admin interfaces. **Sonner** for toast notifications.
- **Error boundaries** (`error.tsx`) at every layout level.
- **Server Actions** for all mutations. Route Handlers only for webhooks.

---

## 10. Success Criteria

When Phase 1 is complete, the following should be true:
- [ ] Next.js project scaffolded and running on `localhost:3000`
- [ ] All 7 database tables created in Supabase
- [ ] Auth trigger firing on user signup (verified with a test user)
- [ ] RLS policies enforced (verified by querying as anon vs authenticated)
- [ ] Storage bucket `tenant-assets` created with policies
- [ ] Supabase client utilities working (client, server, middleware)
- [ ] TypeScript types generated from database
- [ ] Middleware redirecting unauthenticated users from `/app/*` to `/login`

Good luck. The MASTER_GUIDE.md is your bible. Read it first, execute in order.
