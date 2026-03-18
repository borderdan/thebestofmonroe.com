## Supabase Rules

- Use `createClient()` from `src/lib/supabase/server.ts` for server-side user-scoped queries (respects RLS)
- Use `createClient()` from `src/lib/supabase/client.ts` for client-side queries
- Use `getAdminClient()` only for operations that require service-role access (webhooks, system tasks, cross-tenant ops)
- All new tables MUST have RLS enabled with policies filtering by `business_id`
- Never manually edit `src/lib/database.types.ts` — regenerate with `npx supabase gen types`
- Migrations go in `supabase/migrations/` with descriptive filenames
- Use `uuid_generate_v4()` for new table PKs, always include `created_at`/`updated_at`
