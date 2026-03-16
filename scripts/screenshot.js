const { chromium } = require('playwright');
const http = require('http');

async function waitForServer() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      http.get('http://localhost:3000', (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          clearInterval(interval);
          resolve();
        }
      }).on('error', () => {});
    }, 1000);
  });
}

(async () => {
  console.log('Waiting for Next.js to start...');
  await waitForServer();
  console.log('Server is up, launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  
  // Navigate and wait for network idle to ensure everything is rendered
  await page.goto('http://localhost:3000/en');
  await page.waitForTimeout(5000); // Wait for rendering
  
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  console.log('Screenshot saved to screenshot.png');
  await browser.close();
})();