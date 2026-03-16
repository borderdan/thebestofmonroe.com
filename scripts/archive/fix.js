const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'lib', 'actions');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let dirty = false;

  const fixSyntax = /Sentry\.captureException\(([^:)]+):\s*[^)]+\)/g;
  if(fixSyntax.test(content)) {
    content = content.replace(fixSyntax, 'Sentry.captureException($1)');
    dirty = true;
  }
  
  if (dirty) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Fixed TS syntax inside Sentry statements');
