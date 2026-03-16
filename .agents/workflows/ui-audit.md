---
description: Comprehensive UX/UI front-end audit — systematically crawl every page, document every component, and produce a detailed report
---

# UI Audit Workflow

This workflow produces a comprehensive audit of every page, component, and interactive element in the The Best of Monroe application. It outputs a detailed Markdown report documenting what works, what's broken, and what's missing.

## Prerequisites

- The dev server must be running on `http://localhost:3000` (or the URL in `E2E_BASE_URL`)
- E2E credentials must be set in `.env.local`: `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`
- Playwright must be installed: `npx playwright install chromium`

---

## Phase 1 — Automated Route Crawl (Playwright)

Run the automated crawler to generate a baseline inventory of every page and its interactive elements.

// turbo
1. Ensure the dev server is running. If not, start it:
```
npm run dev
```

// turbo
2. Run the UI crawl Playwright test to generate the raw inventory:
```
npx playwright test e2e/ui-crawl.spec.ts --project=chromium --reporter=list
```

3. The crawl script outputs two files:
   - `docs/ui-crawl-results.json` — structured JSON of every page + elements
   - `e2e/screenshots/` — full-page screenshots of every route

4. Review the JSON output. Each page entry contains:
   - `route` — the URL path
   - `status` — HTTP status / load result
   - `screenshot` — path to the captured screenshot
   - `elements.buttons` — all buttons with text, selector, disabled state
   - `elements.links` — all anchor tags with href, text, target
   - `elements.inputs` — all form inputs with type, name, placeholder, required
   - `elements.selects` — all select/dropdown elements
   - `elements.modals` — any dialog/modal elements detected
   - `elements.tabs` — tab components detected
   - `elements.tables` — data tables detected
   - `elements.errors` — any visible error messages on page load

---

## Phase 2 — Interactive Deep-Dive (Antigravity Browser)

Use the built-in Antigravity browser to manually test each page. Work through pages **in the order listed below**, documenting findings in the report.

### 2a. Authentication & Public Pages

For each page, use `browser_subagent` to navigate, interact, and document:

1. **Login** (`/es/login`) — Test login form, validation, error states, forgot password link
2. **Forgot Password** (`/es/forgot-password`) — Test email input, submit, success/error
3. **Reset Password** (`/es/reset-password`) — Test with/without valid token
4. **Verify Email** (`/es/verify-email`) — Test with/without valid token
5. **Pricing** (`/es/pricing`) — Test plan cards, CTA buttons, toggle (monthly/annual if exists)
6. **B2B** (`/es/b2b`) — Test all CTAs and content
7. **Public Directory** (`/es/directory`) — Test listing, search, pagination
8. **Directory Detail** (`/es/directory/[slug]`) — Test with valid/invalid slug
9. **Public Forms** (`/es/forms/[id]`) — Test with valid/invalid form ID

### 2b. Authenticated App Pages (Sidebar Navigation)

Log in first, then systematically visit each sidebar item:

10. **Dashboard** (`/es/app`) — Test widgets, stats, quick actions
11. **POS** (`/es/app/pos`) — Test product grid, search, cart, checkout flow
12. **POS Unlock** (`/es/app/pos/unlock`) — Test PIN entry
13. **Gift Cards** (`/es/app/pos/gift-cards`) — Test create, list, activate
14. **CRM** (`/es/app/crm`) — Test customer list, search, filters
15. **CRM Detail** (`/es/app/crm/[customerId]`) — Test with valid customer
16. **Inventory** (`/es/app/inventory`) — Test product list, add/edit, stock
17. **eForms** (`/es/app/eforms`) — Test form list, status indicators
18. **eForms Create** (`/es/app/eforms/create`) — Test form builder, field types
19. **eForms Edit** (`/es/app/eforms/edit/[id]`) — Test with existing form
20. **Vault** (`/es/app/vault`) — Test document list, upload, download
21. **Directory** (`/es/app/directory`) — Test business listing management
22. **Links** (`/es/app/links`) — Test link list, create, copy, QR
23. **Link Analytics** (`/es/app/links/analytics`) — Test charts, date filters
24. **Keyrings** (`/es/app/keyrings`) — Test key list, create, share
25. **Team / Users** (`/es/app/users`) — Test user list, invite, role change
26. **Audit Logs** (`/es/app/users/audit-logs`) — Test log list, filters
27. **Invoices** (`/es/app/invoices`) — Test invoice list, create, status
28. **Automations** (`/es/app/automations`) — Test automation list, toggles
29. **Theme** (`/es/app/theme`) — Test color picker, preview, save
30. **Settings** (`/es/app/settings`) — Test all settings sections
31. **Billing** (`/es/app/settings/billing`) — Test payment info, history
32. **Subscription** (`/es/app/settings/subscription`) — Test plan display, upgrade
33. **Upgrade** (`/es/app/upgrade`) — Test plan comparison, CTA

### 2c. Admin Pages (Super-Admin Only)

34. **Admin Panel** (`/es/admin`) — Test dashboard, metrics
35. **Tenant Management** (`/es/admin/tenants`) — Test tenant list, search

### 2d. External-Facing Pages

36. **Checkout Success** (`/es/checkout/success`) — Test with valid session
37. **Checkout Pending** (`/es/checkout/pending`) — Test display
38. **Checkout Failure** (`/es/checkout/failure`) — Test display
39. **Claim** (`/es/claim`) — Test claim flow
40. **Invoice View** (`/es/invoice/[tx_id]`) — Test with valid/invalid ID
41. **Portal Login** (`/es/portal/login`) — Test customer portal auth
42. **Portal Dashboard** (`/es/portal/page`) — Test customer self-service
43. **Receipt View** (`/es/receipt/[token]`) — Test with valid/invalid token

### Per-Page Checklist

For **every page** visited, document the following in the report:

- [ ] **Page loads** — Does it render without errors? Check console for JS errors
- [ ] **Layout** — Sidebar visible (if authenticated)? Header renders? Responsive?
- [ ] **Buttons** — List every button. Does each one do something? Any broken/stub buttons?
- [ ] **Links** — List every link. Do they navigate correctly? Any dead links?
- [ ] **Forms** — List every form field. Validation works? Submit works?
- [ ] **Tables** — Data loads? Pagination works? Empty states handled?
- [ ] **Modals/Dialogs** — Open/close correctly? Content renders?
- [ ] **Dropdowns/Selects** — Options load? Selection works?
- [ ] **Tabs** — All tabs render content? Switching works?
- [ ] **Loading states** — Spinners/skeletons show during data fetch?
- [ ] **Empty states** — Appropriate message when no data?
- [ ] **Error states** — Graceful error handling for bad data/network?
- [ ] **Translations** — All text translated? Any raw i18n keys showing?
- [ ] **Accessibility** — Interactive elements focusable? Labels present?

---

## Phase 3 — Report Generation

After completing Phase 1 and Phase 2, compile findings into the final report.

1. Create or update `docs/ui-audit-report.md` using the template at `docs/ui-audit-report-template.md`

2. The report MUST contain these sections:
   - **Executive Summary** — Total pages audited, pass/fail/partial counts
   - **Route Inventory** — Complete table of all routes with status
   - **Page-by-Page Findings** — For each page: screenshot, component inventory, issues found
   - **Issues Summary** — Categorized list: Critical / Broken / Missing / Cosmetic
   - **Recommendations** — Priority-ordered list of fixes

3. For each issue found, document:
   - **Page** — Which route
   - **Component** — Which element (button, link, form, etc.)
   - **Severity** — Critical (crashes/blocks user), Broken (doesn't work), Missing (stub/placeholder), Cosmetic (visual only)
   - **Description** — What's wrong
   - **Expected** — What should happen
   - **Screenshot** — If applicable

4. Save the completed report to `docs/ui-audit-report.md`

---

## Phase 4 — Issue Triage

1. From the report, create a prioritized issue list:
   - **P0 Critical** — App crashes, data loss, auth bypass
   - **P1 Broken** — Feature doesn't work, dead buttons, broken forms
   - **P2 Missing** — Stub pages, placeholder content, unimplemented features
   - **P3 Cosmetic** — Visual glitches, alignment, spacing, i18n keys showing

2. Optionally create GitHub issues for each finding using the `create_issue` MCP tool

---

## Notes

- **Locale:** Default to `/es/` (Spanish) for routes. The app supports `[locale]` routing
- **Auth:** Use credentials from `.env.local` (`E2E_USER_EMAIL` / `E2E_USER_PASSWORD`)
- **Screenshots:** Save all screenshots to `e2e/screenshots/` with descriptive names
- **Timing:** A full audit typically takes 30-60 minutes depending on app complexity
- **Re-running:** This workflow is idempotent — run it anytime to get a fresh audit
