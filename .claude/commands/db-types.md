Regenerate Supabase TypeScript types from the remote schema.

Run: `npx supabase gen types typescript --project-id amrqoakoyknuozwlftuf > src/lib/database.types.ts`

After regeneration, check if any existing code references types that may have changed by running `npm run typecheck`. Report any type errors found.
