Scaffold a new server action following project conventions.

Ask for:
1. **Name** — e.g. `notifications` → creates `src/lib/actions/notifications.ts`
2. **Operations** — list of function names, e.g. `getNotifications`, `markAsRead`, `deleteNotification`
3. **Schema needed?** — if yes, also create `src/lib/schemas/notifications.ts`

Generate using this pattern:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { type ActionResult } from '@/lib/supabase/helpers'
import * as Sentry from '@sentry/nextjs'
// import { schema } from '@/lib/schemas/<name>'

export async function operationName(input: InputType): Promise<ActionResult<ReturnType>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // const validated = schema.parse(input)
    // ... operation logic

    return { success: true, data: result }
  } catch (error) {
    Sentry.captureException(error)
    return { success: false, error: 'Operation failed' }
  }
}
```

For the Zod schema file, follow patterns from existing schemas in `src/lib/schemas/`.
