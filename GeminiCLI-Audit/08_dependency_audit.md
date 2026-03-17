# 08 Dependency Audit

## Overview
The application uses a modern Next.js 16 setup with React 19, heavily leveraging the shadcn/ui ecosystem for components and Zustand for client state.

## Core Libraries
| Category | Package | Version | Assessment |
|----------|---------|---------|------------|
| Framework | `next` | `16.1.6` | Bleeding edge. Could introduce instability or peer dependency warnings. |
| React | `react`, `react-dom` | `19.2.3` | Modern, paired with Next.js App Router. |
| State | `zustand` | `5.0.11` | Lightweight, optimal choice. |
| Styling | `tailwindcss` | `^4` | Tailwind V4. Uses `tailwind-merge` and `clsx` for dynamic classes. |
| Auth/DB | `@supabase/ssr`, `@supabase/supabase-js` | `0.9.0`, `2.99.0` | Standard Supabase integration. |

## UI & Component Ecosystem
| Package | Version | Assessment / Redundancy |
|---------|---------|-------------------------|
| `@base-ui/react` | `^1.2.0` | **Warning**: Potential overlap with Radix UI (`@radix-ui/react-*`) which is used by shadcn. Redundant headless UI library. |
| `@radix-ui/*` | Various | Base for shadcn components. |
| `shadcn` | `^4.0.3` | CLI utility for components. |
| `framer-motion` | `^12.36.0` | Standard for animations, but heavy. |
| `tw-animate-css`, `tailwindcss-animate` | Various | Potential redundancy. Two animation utility libraries. |

## Form & Validation
| Package | Version | Assessment / Redundancy |
|---------|---------|-------------------------|
| `react-hook-form` | `^7.71.2` | Core form library. |
| `zod` | `^4.3.6` | Schema validation. |
| `@hookform/resolvers` | `^5.2.2` | Zod integration for forms. |
| `@rjsf/core`, `@rjsf/utils`, `@rjsf/validator-ajv8` | `^6.4.1` | **Warning**: React JSON Schema Form is included. This is a very heavy dependency. Likely conflicts conceptually with `react-hook-form` + `zod` unless specifically used for dynamic, data-driven form rendering (like the e-forms module). |

## Integrations & Utilities
| Package | Version | Assessment / Redundancy |
|---------|---------|-------------------------|
| `@google/generative-ai` | `^0.24.1` | Gemini integration. |
| `stripe`, `mercadopago` | Various | Dual payment gateways. |
| `@trigger.dev/sdk` | `^4.4.3` | Background jobs/workflows. |
| `@sentry/nextjs` | `^10.43.0` | Error tracking. |
| `leaflet`, `react-leaflet` | Various | Maps integration. |
| `@dnd-kit/*`, `@xyflow/react` | Various | Drag and drop / node based UI (likely for workflows or blueprints). Both are heavy, but serve slightly different complex UI needs. |

## Peer Dependency Conflicts Risks
- **React 19**: Libraries like `@rjsf/core`, `react-leaflet`, and `@dnd-kit/core` often lag behind major React releases and may throw peer dependency warnings or encounter issues with React 19's new hooks/concurrent rendering behavior.

## Recommendations
1. **Consolidate Headless UI**: Remove `@base-ui/react` if Radix/shadcn covers all needs.
2. **Animation Cleanup**: Choose between `tw-animate-css` and `tailwindcss-animate`.
3. **Form Strategy**: Evaluate if `@rjsf` is strictly necessary. It adds significant bundle size compared to `react-hook-form`.