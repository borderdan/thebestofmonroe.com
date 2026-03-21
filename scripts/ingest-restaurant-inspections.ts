/**
 * NC Restaurant Health Inspections — Union County, NC
 *
 * Source: NC DHHS CDPEHS public portal
 * Method: Direct HTTP POST to trigger native CSV export (no browser needed)
 * Fallback: POST-based pagination with PageSize=1000
 *
 * Usage: npm run ingest:restaurant-inspections
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const BASE_URL =
  'https://public.cdpehs.com/NCENVPBL/ESTABLISHMENT/ShowESTABLISHMENTTablePage.aspx?ESTTST_CTY=90';

const MAX_PAGES = 10;
const PAGE_SIZE = 1000;
const USER_AGENT = 'TheBestOfMonroe/1.0 (Community Data Platform)';

const ZIP_CITY: Record<string, string> = {
  '28110': 'Monroe', '28112': 'Monroe', '28111': 'Monroe',
  '28079': 'Indian Trail', '28173': 'Waxhaw', '28174': 'Wingate',
  '28104': 'Matthews', '28105': 'Matthews', '28103': 'Marshville',
  '28163': 'Stallings', '28075': 'Harrisburg', '28226': 'Charlotte',
  '28027': 'Concord', '28025': 'Concord', '28078': 'Huntersville',
  '28071': 'Gold Hill', '28088': 'Locust',
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

type InspectionRow = {
  name: string;
  address: string;
  city: string;
  stateId: string;
  estType: string;
  score: number | null;
  grade: string | null;
  dateStr: string;
};

/** Extract ASP.NET hidden form fields from HTML */
function extractFormFields(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const fields: Record<string, string> = {};
  for (const name of ['__VIEWSTATE', '__VIEWSTATEGENERATOR', '__EVENTVALIDATION', '__EVENTTARGET', '__EVENTARGUMENT']) {
    const val = $(`input[name="${name}"]`).val();
    if (val) fields[name] = String(val);
  }
  return fields;
}

/** Parse CSV text into InspectionRow[] */
function parseCSV(csvText: string): InspectionRow[] {
  const rows: InspectionRow[] = [];
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return rows;

  // Parse header
  const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  const idx = (pattern: RegExp) => header.findIndex(h => pattern.test(h));

  const iDate = idx(/inspection.*date|date/);
  const iName = idx(/premise|name/);
  const iAddr = idx(/address/);
  const iId = idx(/state.*id|estab.*id/);
  const iType = idx(/type/);
  const iScore = idx(/score/);
  const iGrade = idx(/grade/);

  for (const line of lines.slice(1)) {
    // Handle CSV fields that may contain commas in quotes
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { cells.push(current.trim()); current = ''; continue; }
      current += char;
    }
    cells.push(current.trim());

    const name = iName >= 0 ? cells[iName] : '';
    if (!name || name.length < 2) continue;

    const address = iAddr >= 0 ? cells[iAddr] ?? '' : '';
    const zipMatch = address.match(/\d{5}/);
    const city = (zipMatch && ZIP_CITY[zipMatch[0]]) || 'Monroe';

    rows.push({
      name,
      address,
      city,
      stateId: iId >= 0 ? cells[iId] ?? '' : '',
      estType: iType >= 0 ? cells[iType] ?? 'Food Service' : 'Food Service',
      score: iScore >= 0 ? (parseFloat(cells[iScore]) || null) : null,
      grade: iGrade >= 0 ? (cells[iGrade]?.match(/^[A-F]$/)?.[0] ?? null) : null,
      dateStr: iDate >= 0 ? cells[iDate] ?? '' : '',
    });
  }
  return rows;
}

/** Parse HTML table rows into InspectionRow[] */
function parseHTMLTable(html: string): InspectionRow[] {
  const rows: InspectionRow[] = [];
  const $ = cheerio.load(html);

  // CDPEHS uses repeater rows with IDs containing "TableControlRepeater"
  $('tr[id*="TableControlRepeater"]').each((_, tr) => {
    const cells = $(tr).find('td').map((__, td) => $(td).text().trim()).get();
    if (cells.length < 5) return;

    // Column order: Date, Name, Address, StateID, Type, Score, Grade, InspectorID, ViolationDetails
    const dateStr = cells[0] ?? '';
    const name = cells[1] ?? '';
    const address = cells[2] ?? '';
    const stateId = cells[3] ?? '';
    const estType = cells[4] ?? 'Food Service';
    const score = parseFloat(cells[5]) || null;
    const grade = cells[6]?.match(/^[A-F]$/)?.[0] ?? null;

    if (!name || name.length < 2 || !dateStr.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) return;

    const zipMatch = address.match(/\d{5}/);
    const city = (zipMatch && ZIP_CITY[zipMatch[0]]) || 'Monroe';

    rows.push({ name, address, city, stateId, estType, score, grade, dateStr });
  });

  return rows;
}

async function run() {
  console.log('=== Restaurant Inspections Ingestion (Union County, NC) ===');
  console.log('Method: Direct HTTP POST (no browser needed)\n');

  const supabase = getSupabase();
  let processed = 0;
  let allRows: InspectionRow[] = [];

  // ---------------------------------------------------
  // Step 1: Load the page and capture ViewState
  // ---------------------------------------------------
  console.log('1. Loading portal and capturing ViewState...');
  const initRes = await fetch(BASE_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!initRes.ok) throw new Error(`Portal load failed: ${initRes.status}`);
  const initHTML = await initRes.text();
  const fields = extractFormFields(initHTML);

  // Grab cookies for session persistence
  const cookies = initRes.headers.getSetCookie?.()?.join('; ')
    ?? initRes.headers.get('set-cookie') ?? '';
  const cookieHeader = cookies.split(',')
    .map(c => c.split(';')[0].trim())
    .filter(c => c.includes('='))
    .join('; ');

  console.log(`   ViewState captured (${fields.__VIEWSTATE?.length ?? 0} chars)`);
  console.log(`   Session cookies: ${cookieHeader ? 'yes' : 'none'}`);

  const postHeaders: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': USER_AGENT,
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };

  // ---------------------------------------------------
  // Step 2: Click Search to load Union County results
  // ---------------------------------------------------
  console.log('2. Triggering Search (Union County filter)...');
  const searchPayload = new URLSearchParams({
    ...fields,
    __EVENTTARGET: 'ctl00$PageContent$FilterButton$_Button',
    __EVENTARGUMENT: '',
  });

  const searchRes = await fetch(BASE_URL, {
    method: 'POST',
    headers: postHeaders,
    body: searchPayload.toString(),
  });
  const searchHTML = await searchRes.text();
  const searchFields = extractFormFields(searchHTML);
  console.log('   Search triggered successfully');

  // ---------------------------------------------------
  // Step 3: Try CSV export (one-shot, all records)
  // ---------------------------------------------------
  console.log('3. Attempting CSV export (all records at once)...');
  try {
    const csvPayload = new URLSearchParams({
      ...searchFields,
      __EVENTTARGET: '',
      __EVENTARGUMENT: '',
      'ctl00$PageContent$CSVButton1.x': '1',
      'ctl00$PageContent$CSVButton1.y': '1',
    });

    const csvRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: postHeaders,
      body: csvPayload.toString(),
    });

    const contentType = csvRes.headers.get('content-type') ?? '';
    const csvText = await csvRes.text();

    if (contentType.includes('csv') || contentType.includes('octet-stream') || (csvText.includes(',') && !csvText.includes('<html'))) {
      allRows = parseCSV(csvText);
      console.log(`   CSV export succeeded: ${allRows.length} records parsed`);
    } else {
      console.log(`   CSV export returned HTML (content-type: ${contentType}), falling back to pagination`);
    }
  } catch (csvErr) {
    console.log(`   CSV export failed: ${(csvErr as Error).message}, falling back to pagination`);
  }

  // ---------------------------------------------------
  // Step 4: Fallback — set PageSize=1000 and paginate
  // ---------------------------------------------------
  if (allRows.length === 0) {
    console.log(`4. Setting page size to ${PAGE_SIZE}...`);
    const pageSizePayload = new URLSearchParams({
      ...searchFields,
      __EVENTTARGET: 'ctl00$PageContent$Pagination$_PageSizeButton',
      __EVENTARGUMENT: '',
      'ctl00$PageContent$Pagination$_PageSize': String(PAGE_SIZE),
    });

    let pageRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: postHeaders,
      body: pageSizePayload.toString(),
    });
    let pageHTML = await pageRes.text();
    console.log(`   Page size set to ${PAGE_SIZE}`);

    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      console.log(`\n   Scraping page ${pageNum}...`);
      const pageRows = parseHTMLTable(pageHTML);
      console.log(`   Found ${pageRows.length} records on page ${pageNum}`);

      if (pageRows.length === 0) {
        console.log('   No more records, stopping.');
        break;
      }
      allRows.push(...pageRows);

      // Check for next page button
      const pageFields = extractFormFields(pageHTML);
      const $ = cheerio.load(pageHTML);
      const hasNext = $('input[name*="NextPage"]').length > 0 || $('a[id*="NextPage"]').length > 0;

      if (!hasNext || pageNum >= MAX_PAGES) break;

      // Navigate to next page
      const nextPayload = new URLSearchParams({
        ...pageFields,
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        'ctl00$PageContent$Pagination$_NextPage.x': '0',
        'ctl00$PageContent$Pagination$_NextPage.y': '0',
        'ctl00$PageContent$Pagination$_PageSize': String(PAGE_SIZE),
      });

      pageRes = await fetch(BASE_URL, {
        method: 'POST',
        headers: postHeaders,
        body: nextPayload.toString(),
      });
      pageHTML = await pageRes.text();
    }
  }

  console.log(`\n=== Total records parsed: ${allRows.length} ===\n`);

  // ---------------------------------------------------
  // Step 5: Upsert to Supabase
  // ---------------------------------------------------
  console.log('5. Upserting to Supabase...');

  // Dedupe allRows by facility_id+date before upserting (CSV may have duplicates)
  const seen = new Map<string, InspectionRow>();
  for (const r of allRows) {
    const key = `${r.stateId || r.name}|${r.dateStr}`;
    if (!seen.has(key)) seen.set(key, r);
  }
  const dedupedRows = Array.from(seen.values());
  console.log(`   After dedup: ${dedupedRows.length} unique records (from ${allRows.length} raw)`);

  // Batch upserts for performance (50 at a time)
  const BATCH_SIZE = 50;
  for (let i = 0; i < dedupedRows.length; i += BATCH_SIZE) {
    const batch = dedupedRows.slice(i, i + BATCH_SIZE);
    const records = batch.map(r => {
      let inspectionDate = new Date().toISOString().split('T')[0];
      try {
        const d = new Date(r.dateStr);
        if (!isNaN(d.getTime()) && d.getFullYear() > 2000) inspectionDate = d.toISOString().split('T')[0];
      } catch {}

      const facilityId = r.stateId || `${r.name}-${r.address}`.toLowerCase().replace(/\W+/g, '-').slice(0, 80);

      return {
        facility_id: facilityId,
        name: r.name,
        address: r.address || null,
        city: r.city,
        score: r.score,
        grade: r.grade,
        inspection_date: inspectionDate,
        inspection_type: r.estType,
        violations: [],
        raw_data: r,
      };
    });

    const { error, count } = await supabase
      .from('restaurant_inspections')
      .upsert(records, { onConflict: 'facility_id,inspection_date' });

    if (error) {
      console.error(`   Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
    } else {
      processed += batch.length;
      if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= dedupedRows.length) {
        console.log(`   Progress: ${processed}/${dedupedRows.length} records upserted`);
      }
    }
  }

  console.log(`\n=== Done: ${processed}/${dedupedRows.length} records upserted ===`);
}

run().catch(console.error);
