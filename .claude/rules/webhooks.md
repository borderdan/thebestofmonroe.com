## Webhook Rules

- All webhook routes live in `src/app/api/webhooks/`
- Every webhook MUST verify its signature before processing:
  - Stripe: `stripe.webhooks.constructEvent(body, sig, secret)`
  - Generic: compare HMAC-SHA256 against `WEBHOOK_SECRET`
- Return `200 OK` quickly — do heavy processing async or via Trigger.dev
- Log webhook events to `activity_log` table for audit trail
- Never trust webhook payload data without validation — always re-fetch from source API
- Use `getAdminClient()` for webhook handlers (no user session available)
- Handle idempotency — webhooks can be delivered multiple times
