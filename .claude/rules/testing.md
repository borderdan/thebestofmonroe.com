## Testing Rules

### Unit Tests (Vitest)
- Test files: `src/**/__tests__/<source>.test.ts(x)`
- Mock Supabase, Sentry, next/cache — never hit real APIs in unit tests
- Test ActionResult shape: both `{ success: true, data }` and `{ success: false, error }`
- Test Zod schema validation with valid and invalid inputs
- Run with: `npm test` or `npm test -- --run` (CI mode)

### E2E Tests (Playwright)
- Test files: `e2e/*.spec.ts`
- Global auth setup stores session in `e2e/.auth/user-a.json`
- Use `page.getByRole()`, `page.getByText()` — avoid CSS selectors
- Tests must work in both Spanish and English (default locale is Spanish)
- Run with: `npm run test:e2e` or `npx playwright test <file>`
- Screenshots go in `e2e/screenshots/`

### General
- Tests must pass before merging — CI runs lint → typecheck → unit → E2E
- Aim for testing behavior, not implementation details
- New server actions should have at least success/error path tests
