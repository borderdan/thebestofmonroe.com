Help create a new Supabase migration.

1. Ask what the migration should do (new table, alter column, add RLS policy, etc.)
2. Check existing migrations in `supabase/migrations/` for naming convention and latest phase number
3. Generate the SQL migration file following the project's conventions:
   - Enable RLS on new tables
   - Add appropriate RLS policies for multi-tenant isolation (filter by `business_id`)
   - Use `uuid_generate_v4()` for primary keys
   - Add `created_at` and `updated_at` timestamps
4. Save to `supabase/migrations/` with proper naming
5. Remind to run `npx supabase db push` and then `/db-types` to regenerate types
