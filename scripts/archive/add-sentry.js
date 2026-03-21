const fs = require('fs');
const path = require('path');

const files = [
  'crm.ts',
  'pin-auth.ts',
  'inventory-bulk.ts',
  'whatsapp.ts'
];
const dir = path.join(__dirname, 'src', 'lib', 'actions');

files.forEach(f => {
  const fp = path.join(dir, f);
  let content = fs.readFileSync(fp, 'utf8');
  if (!content.includes("@sentry/nextjs")) {
    content = content.replace(/['"]use server['"]\r?\n/, "'use server'\n\nimport * as Sentry from '@sentry/nextjs';\n");
    fs.writeFileSync(fp, content, 'utf8');
  }
});
console.log('Added Sentry imports');
