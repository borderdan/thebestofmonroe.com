/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'docs', 'ui-crawl-results.json');
const reportPath = path.join(__dirname, '..', 'docs', 'ui-audit-report.md');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let out = `# UI Audit Report — The Best of Monroe

> **Date:** ${new Date().toISOString().split('T')[0]}
> **App Version:** N/A
> **Base URL:** http://localhost:3000

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total pages audited | ${data.length} |
| ✅ Pages loaded successfully | ${data.filter(d => d.status === 'loaded').length} |
| ↪️ Pages redirected | ${data.filter(d => d.status === 'redirect').length} |
| ❌ Pages with errors | ${data.filter(d => d.status === 'error').length} |
| ⏱️ Pages timed out | ${data.filter(d => d.status === 'timeout').length} |
| Total buttons found | ${data.reduce((acc, d) => acc + d.metrics.totalButtons, 0)} |
| Total links found | ${data.reduce((acc, d) => acc + d.metrics.totalLinks, 0)} |
| Total form inputs found | ${data.reduce((acc, d) => acc + d.metrics.totalInputs, 0)} |
| Disabled buttons | ${data.reduce((acc, d) => acc + d.metrics.disabledButtons, 0)} |
| Broken images | ${data.reduce((acc, d) => acc + d.metrics.brokenImages, 0)} |
| Console errors detected | ${data.reduce((acc, d) => acc + d.metrics.consoleErrorCount, 0)} |

---

## Route Inventory

| # | Route | Status | Title | Buttons | Links | Inputs | Console Errs |
|---|-------|--------|-------|---------|-------|--------|--------------|
`;

data.forEach((page, i) => {
    out += `| ${i+1} | \`${page.route}\` | ${page.status} | ${page.pageTitle} | ${page.metrics.totalButtons} | ${page.metrics.totalLinks} | ${page.metrics.totalInputs} | ${page.metrics.consoleErrorCount} |\n`;
});

out += `\n---\n\n## Page-by-Page Findings\n\n`;

data.forEach((page, i) => {
    out += `### ${i+1}. \`${page.route}\`\n\n`;
    out += `**Status:** ${page.status}\n\n`;
    out += `**Screenshot:** ![](${page.screenshot.replace('e2e/', '../e2e/')})\n\n`;
    
    out += `**Components Found:**\n`;
    out += `- Buttons: ${page.elements.buttons.length} (${page.elements.buttons.filter(b=>b.disabled).length} disabled)\n`;
    out += `- Links: ${page.elements.links.length}\n`;
    out += `- Inputs: ${page.elements.inputs.length}\n`;
    out += `- Selects: ${page.elements.selects.length}\n`;
    out += `- Modals: ${page.elements.modals.length}\n`;
    out += `- Tabs: ${page.elements.tabs.length}\n`;
    out += `- Tables: ${page.elements.tables.length}\n\n`;

    if (page.metrics.visibleErrorCount > 0) {
        out += `**Visible Errors Detected:**\n`;
        page.elements.errors.forEach(e => out += `- ${e}\n`);
        out += `\n`;
    }

    if (page.metrics.consoleErrorCount > 0) {
        out += `**Console Errors:**\n`;
        page.consoleErrors.forEach(e => out += `- \`${e.slice(0, 100)}...\`\n`);
        out += `\n`;
    }

    out += `**Issues (To be verified manually):**
| Severity | Component | Description | Expected Behavior |
|----------|-----------|-------------|-------------------|
| | | | |

---

`;
});

out += `## Issues Summary

### 🔴 P0 — Critical (App crashes, data loss, auth bypass)
| # | Page | Component | Description |
|---|------|-----------|-------------|
| | | | |

### 🟠 P1 — Broken (Feature doesn't work)
| # | Page | Component | Description |
|---|------|-----------|-------------|
| | | | |

### 🟡 P2 — Missing (Stub/placeholder/unimplemented)
| # | Page | Component | Description |
|---|------|-----------|-------------|
| | | | |

### 🔵 P3 — Cosmetic (Visual glitches, i18n keys)
| # | Page | Component | Description |
|---|------|-----------|-------------|
| | | | |

---

## Recommendations
Priority-ordered list of fixes:
1. **[P0]** Resolve console errors detected by crawler.
2. **[P1]** Complete manual interactive deep dive (Phase 2).
`;

fs.writeFileSync(reportPath, out, 'utf8');
console.log('Successfully generated ' + reportPath);
