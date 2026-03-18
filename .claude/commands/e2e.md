Run Playwright E2E tests against the local dev server.

1. Check if the dev server is running on port 3000. If not, warn that it should be started first.
2. Run: `npx playwright test $ARGUMENTS`
   - No arguments = run all tests in `e2e/`
   - Accepts test file names, e.g. `/e2e auth` runs `e2e/auth.spec.ts`
   - Accepts Playwright flags, e.g. `/e2e --headed` for visible browser
3. If tests fail, read the failing test file and the relevant source code to diagnose the issue.
4. Suggest a fix — don't just report the error.
