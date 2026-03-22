import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".vercel/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "*.js",
    // Exclude scripts, test directories and supabase edge functions
    "scripts/**",
    "e2e/**",
    "supabase/**",
  ]),
  // Project-wide rule overrides — downgrade common errors to warnings
  // to prevent blocking CI while the codebase is being cleaned up.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "warn",
      "jsx-a11y/alt-text": "warn",
    },
  },
]);

export default eslintConfig;
