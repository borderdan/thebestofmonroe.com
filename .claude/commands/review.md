Review the current uncommitted changes for quality and correctness.

1. Run `git diff` to see all changes
2. Check for:
   - Security issues (exposed secrets, missing webhook signature verification, RLS bypasses)
   - Missing Zod validation on new server actions
   - Missing Sentry error tracking in catch blocks
   - Missing i18n — hardcoded user-facing strings not using next-intl
   - Type safety — any `any` types or missing return types
   - Supabase RLS — queries that should use admin client vs regular client
3. Suggest improvements, but keep feedback actionable and concise
