# 06 — Libraries & Dependencies

## Production Dependencies (51 packages)

### Core Framework
| Package | Version | Purpose |
|---|---|---|
| `next` | 16.1.6 | App Router framework |
| `react` / `react-dom` | 19.2.3 | UI library |
| `typescript` | ^5 | Language |

### Supabase
| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | ^2.99.0 | Database client + realtime |
| `@supabase/ssr` | ^0.9.0 | Server-side session management (cookie-based) |

### UI Framework
| Package | Version | Purpose |
|---|---|---|
| `shadcn` | ^4.0.3 | Component generator CLI |
| `@radix-ui/react-label` | ^2.1.8 | Accessible label primitive |
| `@radix-ui/react-slot` | ^1.2.4 | Component composition |
| `@base-ui/react` | ^1.2.0 | Base UI primitives |
| `class-variance-authority` | ^0.7.1 | Variant-based styling (shadcn) |
| `clsx` | ^2.1.1 | Conditional classnames |
| `tailwind-merge` | ^3.5.0 | Merge Tailwind classes |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities |
| `tw-animate-css` | ^1.4.0 | CSS animations |
| `lucide-react` | ^0.577.0 | Icon library (300+ icons) |

### State Management
| Package | Version | Purpose |
|---|---|---|
| `zustand` | ^5.0.11 | Client state (POS cart, guest cart) |
| `idb-keyval` | ^6.2.2 | IndexedDB adapter for Zustand persist |

### Forms & Validation
| Package | Version | Purpose |
|---|---|---|
| `react-hook-form` | ^7.71.2 | Form state management |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for RHF |
| `@rjsf/core` | ^6.4.1 | React JSON Schema Forms (E-Forms builder) |
| `@rjsf/utils` | ^6.4.1 | RJSF utilities |
| `@rjsf/validator-ajv8` | ^6.4.1 | AJV JSON Schema validator |
| `zod` | (via @hookform/resolvers) | Schema validation (in server actions) |

### Data & Tables
| Package | Version | Purpose |
|---|---|---|
| `@tanstack/react-table` | ^8.21.3 | Headless data table |
| `papaparse` | ^5.5.3 | CSV parsing for bulk import |
| `date-fns` | ^4.1.0 | Date formatting |

### Payments
| Package | Version | Purpose |
|---|---|---|
| `stripe` | ^20.4.1 | Subscription billing (server-side) |
| `mercadopago` | ^2.12.0 | MercadoPago SDK (guest checkout) |

### Maps & Location
| Package | Version | Purpose |
|---|---|---|
| `leaflet` | ^1.9.4 | Map rendering |
| `react-leaflet` | ^5.0.0 | React wrapper for Leaflet |

### Charts & Visualization
| Package | Version | Purpose |
|---|---|---|
| `recharts` | ^3.8.0 | Dashboard charts (revenue, heatmap, category) |
| `colorjs.io` | ^0.6.1 | Color manipulation (theming) |

### QR & Barcodes
| Package | Version | Purpose |
|---|---|---|
| `qrcode.react` | ^4.2.0 | QR code generation (CoDi, portal links) |
| `jsbarcode` | ^3.12.3 | Barcode generation |
| `react-zxing` | ^1.1.3 | Camera barcode scanning |

### Notifications & Toast
| Package | Version | Purpose |
|---|---|---|
| `sonner` | ^2.0.7 | Toast notifications |

### Internationalization
| Package | Version | Purpose |
|---|---|---|
| `next-intl` | ^4.8.3 | i18n routing + translations |

### Theming
| Package | Version | Purpose |
|---|---|---|
| `next-themes` | ^0.4.6 | Dark/light/system theme |

### PWA
| Package | Version | Purpose |
|---|---|---|
| `@serwist/next` | ^9.5.6 | Next.js service worker integration |
| `serwist` | ^9.5.6 | Service worker runtime |

### Email
| Package | Version | Purpose |
|---|---|---|
| `resend` | ^6.9.3 | Transactional email delivery |
| `@react-email/components` | ^1.0.9 | React email templates |

### Drag & Drop
| Package | Version | Purpose |
|---|---|---|
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop framework |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable lists (link reordering) |
| `@dnd-kit/modifiers` | ^9.0.0 | Drag modifiers |
| `@dnd-kit/utilities` | ^3.2.2 | DnD utilities |

### Auth & Security
| Package | Version | Purpose |
|---|---|---|
| `bcryptjs` | ^3.0.3 | POS PIN hashing |
| `uuid` | ^13.0.0 | UUID generation |

### Infrastructure
| Package | Version | Purpose |
|---|---|---|
| `@vercel/functions` | ^3.4.3 | `waitUntil` for background processing |
| `pg` / `postgres` | ^8.20 / ^3.4.8 | PostgreSQL clients (available but Supabase SDK preferred) |

---

## Dev Dependencies (14 packages)

| Package | Version | Purpose |
|---|---|---|
| `@playwright/test` | ^1.52.0 | E2E testing framework |
| `@testing-library/react` | ^16.3.2 | Unit test utilities |
| `vitest` | ^4.0.18 | Unit test runner |
| `jsdom` | ^28.1.0 | DOM simulation for tests |
| `fake-indexeddb` | ^6.2.5 | IndexedDB mock for unit tests |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.1.6 | Next.js ESLint rules |
| `tailwindcss` | ^4 | CSS framework |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin |
| `babel-plugin-react-compiler` | 1.0.0 | React Compiler transform |
| `@vitejs/plugin-react` | ^5.1.4 | Vite React plugin (for Vitest) |
| `@types/*` | Various | TypeScript type definitions |

---

## Dependency Health Notes

> [!WARNING]
> - `pg` and `postgres` are both included — this is redundant. The project primarily uses `@supabase/supabase-js`. Consider removing direct PG clients unless needed for specific use cases.
> - `@rjsf/*` is a heavy dependency (JSON Schema forms). If E-Forms usage is low, consider a lighter alternative.
> - `colorjs.io` is only used for theming color manipulation — evaluate if still needed.

> [!TIP]
> - `zod` is imported transitively via `@hookform/resolvers` — it's not listed as a direct dependency but is used extensively in server actions. Consider adding it explicitly to `package.json`.
