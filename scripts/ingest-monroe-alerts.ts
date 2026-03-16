import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Parser from 'rss-parser';
import { upsertCommunityUpdate, logIngestion } from '../src/lib/community/ingestion';

const MONROE_ALERTS_RSS = 'https://www.monroenc.org/RSSFeed.aspx?ModID=11';
const parser = new Parser();

async function ingestMonroeAlerts() {
  console.log("Fetching Monroe Alert Center RSS...");
  let processed = 0;
  
  try {
    const feed = await parser.parseURL(MONROE_ALERTS_RSS);
    console.log(`Parsed ${feed.items.length} alerts.`);

    for (const item of feed.items) {
      // Determine severity based on keywords
      let severity: 'low' | 'med' | 'high' | 'critical' = 'low';
      const content = (item.contentSnippet || item.content || '').toLowerCase();
      const title = (item.title || '').toLowerCase();

      if (title.includes('emergency') || title.includes('critical') || title.includes('closure')) {
        severity = 'critical';
      } else if (title.includes('alert') || title.includes('warning')) {
        severity = 'high';
      } else if (content.includes('notice')) {
        severity = 'med';
      }

      await upsertCommunityUpdate({
        source_id: item.guid || item.link || item.title!,
        type: 'alert',
        title: item.title || 'Monroe Alert',
        description: item.contentSnippet || item.content,
        severity,
        event_time: item.isoDate || new Date().toISOString(),
        expires_at: new Date(new Date().getTime() + 48 * 60 * 60 * 1000).toISOString(), // 48h default
        raw_data: item
      });
      processed++;
    }

    await logIngestion('Monroe Alerts', 'success', `Processed ${processed} items`, processed);
    console.log("Monroe Alerts ingestion complete.");
  } catch (error: any) {
    console.error("Monroe Alerts ingestion failed:", error);
    await logIngestion('Monroe Alerts', 'failure', error.message, processed, error);
  }
}

ingestMonroeAlerts().catch(console.error);
