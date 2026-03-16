# Implementation Plan: Phase 14 - Sitewide Styling & Theming Migration

This document outlines the strategy for migrating the legacy visual identity from `thebestofmexico.org` into the modern `The Best of Monroe` Tailwind CSS v4 and `shadcn/ui` ecosystem.

## Phase 14 Objectives
Establish a cohesive design system by migrating legacy colors, fonts, and component styles into `The Best of Monroe`. This includes updating `globals.css` with Tailwind v4 `@theme` directives, injecting `next/font`, and tweaking base `shadcn/ui` components to ensure brand continuity.

---

## Evaluation & Feedback on Master Prompt

The master prompt provides a solid architectural overview for migrating styles to Tailwind v4. However, the provided CSS snippet contains some syntax errors/artifacts that need correction before implementation:

**Artifacts to Fix in Prompt CSS:**
1.  **Invalid `@` imports:** The CSS snippet includes weird file path artifacts like `@The Best of Monroe\.next\dev\...` and `@AISG CEO Dashboard\...` which are likely copy-paste errors from a terminal or IDE. These must be replaced with the standard Tailwind v4 `@theme` and `@utility` syntax.
2.  **`oklch` Color Conversions:** The prompt correctly identifies the need to use `oklch` for `shadcn/ui` variables to support opacity modifiers, but we need to ensure the legacy hex codes are actually extracted and converted accurately.

---

## Execution Plan

### Step 1: Token Extraction & Conversion (Analysis)
Before writing CSS, we must extract the exact brand values from the legacy codebase.

1.  **Analyze Legacy CSS:** Inspect `C:\antigravity\thebestofmexico.org\tailwind.config.js` and `src/index.css` to find the primary brand hex codes and custom fonts.
2.  **Convert to OKLCH:** Convert these hex codes to `oklch` format. This is required because modern `shadcn/ui` variables use `oklch(l c h)` format to allow Tailwind to inject opacity via the `/` syntax (e.g., `bg-primary/50`).

### Step 2: Global CSS Configuration (Tailwind v4)
Update `globals.css` to use the new Tailwind v4 syntax, defining theme variables and `shadcn/ui` overrides.

1.  **Update `src/app/globals.css`:**
    ```css
    @import "tailwindcss";
    @plugin "tailwindcss-animate";
    @custom-variant dark (&:is(.dark *));

    @theme {
      /* Typography Variables (Mapped from next/font) */
      --font-sans: var(--font-inter);
      --font-heading: var(--font-poppins);
      
      /* Base Radius */
      --radius: 0.5rem;
    }

    :root {
      /* shadcn/ui Base Tokens - Replace with converted OKLCH legacy colors */
      --background: oklch(1 0 0);
      --foreground: oklch(0.129 0.042 264.695);
      
      --card: oklch(1 0 0);
      --card-foreground: oklch(0.129 0.042 264.695);
      
      --popover: oklch(1 0 0);
      --popover-foreground: oklch(0.129 0.042 264.695);
      
      --primary: oklch(0.627 0.265 143.28); /* Example legacy primary */
      --primary-foreground: oklch(0.985 0 0);
      
      --secondary: oklch(0.968 0.007 247.896);
      --secondary-foreground: oklch(0.208 0.042 265.755);
      
      --muted: oklch(0.968 0.007 247.896);
      --muted-foreground: oklch(0.553 0.013 258.079);
      
      --accent: oklch(0.968 0.007 247.896);
      --accent-foreground: oklch(0.208 0.042 265.755);
      
      --destructive: oklch(0.396 0.141 25.723);
      --destructive-foreground: oklch(0.637 0.237 25.331);

      --border: oklch(0.898 0.009 253.254);
      --input: oklch(0.898 0.009 253.254);
      --ring: oklch(0.898 0.009 253.254);
    }

    .dark {
      /* Map dark mode equivalents based on legacy inverted themes */
      --background: oklch(0.129 0.042 264.695);
      --foreground: oklch(0.985 0 0);
      --primary: oklch(0.627 0.265 143.28);
      --primary-foreground: oklch(0.985 0 0);
      /* Add remaining dark mode tokens */
    }

    @utility base {
      * {
        @apply border-border;
      }
      body {
        @apply bg-background text-foreground antialiased;
      }
    }
    ```

### Step 3: Typography Injection (`next/font`)
Implement zero-layout-shift web fonts in the root layout.

1.  **Update `src/app/[locale]/layout.tsx`:**
    ```typescript
    import { Inter, Poppins } from 'next/font/google';

    const inter = Inter({
      subsets: ['latin'],
      variable: '--font-inter',
      display: 'swap',
    });

    const poppins = Poppins({
      subsets: ['latin'],
      weight: ['400', '600', '700'],
      variable: '--font-poppins',
      display: 'swap',
    });

    export default function RootLayout({ children, params }: { children: React.ReactNode, params: { locale: string } }) {
      return (
        <html lang={params.locale} className={`${inter.variable} ${poppins.variable}`}>
          <body className="font-sans">
             {/* Application Wrapper */}
            {children}
          </body>
        </html>
      );
    }
    ```

### Step 4: Component Overrides
Review legacy components and adjust `shadcn/ui` defaults if necessary.

1.  **`src/components/ui/button.tsx`:** Modify the `cva` definitions if legacy buttons used specific shadow or border treatments not covered by the base `primary` tokens.
2.  **`src/components/ui/card.tsx`:** Adjust padding or radius variants if the legacy app used a distinct card style.

### Step 5: Layout Consistency
Ensure structural elements use the new CSS variables.

1.  **Update Layouts:** Review `src/app/[locale]/(public)/layout.tsx` and `src/app/[locale]/app/layout.tsx` to ensure backgrounds and text colors utilize the utility classes mapped to our CSS variables (e.g., `bg-background`, `text-primary`).