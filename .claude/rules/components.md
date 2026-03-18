## Component Rules

- Use shadcn/ui as base — import from `@/components/ui/`
- Server Components by default; add `'use client'` only when needed (forms, state, effects)
- Group components by feature: `src/components/<feature>/`
- All user-facing text via `useTranslations()` (client) or `getTranslations()` (server)
- Toast notifications via Sonner: `toast.success()`, `toast.error()`
- Forms: React Hook Form + Zod resolver, never uncontrolled forms
- Responsive: mobile-first Tailwind (`sm:`, `md:`, `lg:`)
- Dark mode: use Tailwind `dark:` variants, theme managed by ThemeProvider
- Loading states: use React Suspense boundaries or conditional rendering
- Error boundaries: wrap feature sections, not individual components
