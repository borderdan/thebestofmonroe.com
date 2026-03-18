Run the full pre-commit quality check pipeline. Execute these in order and report results:

1. `npm run lint` — ESLint
2. `npm run typecheck` — TypeScript strict check
3. `npm test -- --run` — Vitest unit tests (non-watch mode)

If any step fails, analyze the errors and suggest fixes. Do not proceed to the next step until the current one passes.
