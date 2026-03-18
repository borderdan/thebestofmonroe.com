## Server Action Rules

- All server actions live in `src/lib/actions/` with `'use server'` directive
- Return type is always `ActionResult<T>` from `src/lib/supabase/helpers`
- Validate all inputs with Zod schemas from `src/lib/schemas/` before any DB call
- Wrap logic in try/catch, call `Sentry.captureException(error)` in catch block
- Return `{ success: false, error: 'user-friendly message' }` on failure
- Revalidate paths/tags with `revalidatePath()` or `revalidateTag()` after mutations
