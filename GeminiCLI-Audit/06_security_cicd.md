# 06 Security & CI/CD Pipeline

## CI/CD Pipeline (`production.yml`)
The workflow enforce 3 jobs on Pull Requests to `main`:
1. **Lint & Typecheck**: Runs `npm run lint` and `tsc --noEmit`.
2. **Unit Tests**: Runs Vitest suite.
3. **E2E Tests**: Runs Playwright suite.

## Testing Coverage & Gaps
* **Vitest (Unit)**: `vitest.config.ts` exists, but the test files (`__tests__`) appear sparse based on directory structures. 
* **Playwright (E2E)**: Extensive setup. However, it relies heavily on authenticated state (`e2e/.auth/user-a.json`) initialized via a `global-setup.ts`. 

## Security Posture
* **Hardcoded Test Credentials Risk**: `playwright.config.ts` refers to `.env.local` for `E2E_USER_EMAIL` and stores the authenticated session in `.auth/user-a.json`. Ensure `.auth` is in `.gitignore` to prevent session token leakage into source control.
* **Env Vars**: No immediately obvious hardcoded secrets in the `src/` code. `NEXT_PUBLIC` variables are used safely for client-side Supabase initialization.
* **Edge Rate Limiting Flaw**: Found in `middleware.ts`. Uses an in-memory `Map` to rate limit API routes. In serverless/edge environments, memory is transient and localized per region/isolate, meaning attackers can bypass rate limits simply by hitting different regions or triggering isolate cold starts.