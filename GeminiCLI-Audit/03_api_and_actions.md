# 03 Routing, API & Server Actions

## API Routes Map
Located in `src/app/api/`:
* `codi/generate/route.ts`: QR Code generation for payments. Rate limited in Edge.
* `vcard/[businessId]/route.ts`: vCard generation for directory profiles. Rate limited.
* `webhooks/auth/route.ts`: Syncs Supabase auth events.
* `webhooks/evaluator/route.ts`: Main ingestion pipeline webhook.
* `webhooks/mercadopago/route.ts`: Payment gateway webhook.
* `webhooks/stripe/route.ts`: Payment gateway webhook.

## Server Actions Analysis
Located in `src/lib/actions/*.ts` (23 files including `crm.ts`, `pos.ts`, `inventory.ts`, `automations.ts`).

### Authentication & Context
* **Strong Pattern**: Almost all Server Actions correctly initialize session context using `const { supabase, profile } = await getSessionWithProfile()`. This ensures server-side verification of the user token.

### Data Validation (Zod)
* **Critical Finding**: **Zod validation is largely missing.**
* Only 3 files (`automations.ts`, `inventory-bulk.ts`, `pos.ts`) explicitly use `z.object` for strict payload validation. 
* Most other Server Actions rely entirely on TypeScript typings, which compile away at runtime, leaving the endpoints vulnerable to payload manipulation.

### Error Handling Consistency
* Inconsistent. Many actions return `{ error: string }` on failure, while others throw raw Errors which might cause 500s on the client without proper `error.tsx` boundary handling.