/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'lib', 'actions');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let dirty = false;

  // Add Sentry import
  if (!content.includes("@sentry/nextjs")) {
    content = content.replace(/('use server'.*\n)/, "$1\nimport * as Sentry from '@sentry/nextjs';\n");
    dirty = true;
  }

  // Ensure type ActionResult is imported
  if (!content.includes('ActionResult')) {
    if (content.match(/import\s+{.*}\s+from\s+['"]@\/lib\/supabase\/helpers['"]/)) {
      content = content.replace(/(import\s+{)(.*?)(}\s+from\s+['"]@\/lib\/supabase\/helpers['"])/, (match, p1, p2, p3) => {
        return p1 + p2 + ', type ActionResult ' + p3;
      });
    } else {
      content = content.replace(/('use server'.*\n)/, "$1\nimport { type ActionResult } from '@/lib/supabase/helpers';\n");
    }
    dirty = true;
  }

  // Standardize return { error: ... } to { success: false, error: ... }
  if (content.includes('return { error:')) {
    content = content.replace(/return\s+{\s*error:\s*/g, 'return { success: false, error: ');
    dirty = true;
  }

  // Refactor catch blocks
  const catchRegex = /catch\s*\((.*?)\)\s*{/g;
  content = content.replace(catchRegex, (match, errName) => {
    return `catch (${errName}) {\n    Sentry.captureException(${errName});`;
  });
  
  // Note: some files might have multiple catch blocks. We replaced globally.
  if (content !== fs.readFileSync(filePath, 'utf8')) dirty = true;

  if (dirty) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored ${file}`);
  }
});
console.log('Done refactoring');
