import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as cheerio from 'cheerio';
import { upsertCommunityUpdate, logIngestion } from '../src/lib/community/ingestion';

const EVENTS_URL = 'https://www.monroenc.org/Events';

async function ingestCityEvents() {
  console.log("Scraping City of Monroe Events...");
  let processed = 0;
  
  try {
    const response = await fetch(EVENTS_URL);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // CivicPlus / monroenc.org event table parsing
    // Usually event list is in .events-list or similar containers
    // We'll look for generic event structures
    $('.event-item, .event-list-item, tr.event').each((_, el) => {
        const title = $(el).find('.title, .event-title, h3, a').first().text().trim();
        const dateStr = $(el).find('.date, .event-date').text().trim();
        const link = $(el).find('a').attr('href');
        const description = $(el).find('.summary, .description').text().trim();

        if (title && dateStr) {
            upsertCommunityUpdate({
                source_id: `monroe-event-${title}-${dateStr}`,
                type: 'event',
                title: title,
                description: description || `Event on ${dateStr}`,
                event_time: new Date(dateStr).toISOString(), // Naive parse
                raw_data: { title, dateStr, link, original_html: $(el).html() }
            }).catch(console.error);
            processed++;
        }
    });

    await logIngestion('City Events', 'success', `Processed ${processed} items`, processed);
    console.log(`City Events ingestion complete. ${processed} items found.`);
  } catch (error: any) {
    console.error("City Events ingestion failed:", error);
    await logIngestion('City Events', 'failure', error.message, processed, error);
  }
}

ingestCityEvents().catch(console.error);
