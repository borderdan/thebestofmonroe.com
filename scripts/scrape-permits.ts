import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { chromium } from '@playwright/test';
import { upsertCommunityUpdate } from '../src/lib/community/ingestion';
import { summarizePermit } from '../src/lib/ai/permit-summarizer';

const EVOLVE_URL = 'https://evolvepublic.unioncountync.gov/permitting/PermitSearch.aspx';
const CITYVIEW_URL = 'https://cvportal.monroenc.org/Portal/Permit/Locator';

async function scrapeUnionCounty(page: any) {
  console.log("Searching Union County Evolve Portal...");
  await page.goto(EVOLVE_URL);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
  });

  await page.fill('input[name*="txtDateFrom"]', dateStr);
  await page.fill('input[name*="txtDateTo"]', dateStr);
  await page.click('input[name*="btnSearch"]');
  await page.waitForLoadState('networkidle');

  const rows = await page.$$('table[id*="gvPermits"] tr:not(:first-child)');
  for (const row of rows) {
    const cells = await row.$$eval('td', (tds: HTMLElement[]) => tds.map((td: HTMLElement) => td.innerText.trim()));
    if (cells.length < 5) continue;

    const [permitNo, type, subtype, status, address] = cells;
    if (!permitNo) continue;

    const summary = await summarizePermit({ permitNo, type, subtype, status, address, jurisdiction: 'Union County' });
    await upsertCommunityUpdate({
      source_id: `uc-permit-${permitNo}`,
      type: 'permit',
      title: `${type}: ${subtype}`,
      description: summary,
      event_time: yesterday.toISOString(),
      expires_at: new Date(yesterday.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      raw_data: { permitNo, type, subtype, status, address, jurisdiction: 'Union County' }
    });
  }
}

async function scrapeMonroeCity(page: any) {
  console.log("Searching Monroe CityView Portal...");
  await page.goto(CITYVIEW_URL);
  
  // Monroe CityView uses an autocomplete search. 
  // For the MVP, we search for recent properties or "Main" to get context,
  // but better logic would be to navigate to a summary results page if available.
  // Since the public locator is property-based, we'll search for common street names
  // to find recent activity as a sample, or target the 'Find Active Permits Near Me' if geolocated.
  
  // For this implementation, we simulate a search for "Main" to find recent permits.
  await page.fill('#searchValue', 'Main');
  await page.waitForSelector('.ui-autocomplete .ui-menu-item', { timeout: 5000 }).catch(() => {});
  await page.keyboard.press('Enter');
  await page.click('#bsearch');
  await page.waitForLoadState('networkidle');

  // Parse the results grid if present
  const rows = await page.$$('table.cv-grid tr:not(:first-child)');
  for (const row of rows) {
    const cells = await row.$$eval('td', tds => tds.map(td => td.innerText.trim()));
    if (cells.length < 4) continue;

    const [appNo, type, workClass, status] = cells;
    if (!appNo) continue;

    const summary = await summarizePermit({ appNo, type, workClass, status, jurisdiction: 'City of Monroe' });
    await upsertCommunityUpdate({
      source_id: `mc-permit-${appNo}`,
      type: 'permit',
      title: `City Permit: ${type}`,
      description: summary,
      event_time: new Date().toISOString(),
      expires_at: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      raw_data: { appNo, type, workClass, status, jurisdiction: 'City of Monroe' }
    });
  }
}

async function scrapePermits() {
  console.log("Starting Unified Permit Scraper with AI Insights...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await scrapeUnionCounty(page);
    await scrapeMonroeCity(page);
    console.log("Permit scraping and AI ingestion complete.");
  } catch (error) {
    console.error("Permit scraping failed:", error);
  } finally {
    await browser.close();
  }
}

scrapePermits().catch(console.error);
