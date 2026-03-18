Set up git pre-commit hooks for this project.

Run these commands to install husky and lint-staged:

```bash
npm install --save-dev husky lint-staged
npx husky init
```

Then write `.husky/pre-commit`:
```bash
npx lint-staged
```

And add to `package.json`:
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

After setup, confirm it works by staging a file and running `git commit --dry-run`.
