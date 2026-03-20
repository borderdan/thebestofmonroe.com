import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

/* ── Config ─────────────────────────────────────────────────────────── */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FLIPP_FLYERS_URL = 'https://backflipp.wishabi.com/flipp/flyers?locale=en-us&postal_code=28112&category=Groceries';
const FLIPP_FLYER_ITEMS_URL = (flyerId: number) =>
  `https://backflipp.wishabi.com/flipp/flyers/${flyerId}?locale=en-us&postal_code=28112`;

const USER_AGENT = 'MadeInMonroe-App/1.0 (contact@borderdan.com)';

const TARGET_STORES = ['food lion', 'walmart', 'aldi', 'lidl', 'publix', 'lowes foods'];

const STORE_LOCATIONS: Record<string, string> = {
  'food lion': '3016 W Hwy 74',
  'walmart': '2406 W Roosevelt Blvd',
  'aldi': '2322 W Roosevelt Blvd',
  'lidl': '927 E Roosevelt Blvd',
  'publix': '2143 Younts Rd',
  'lowes foods': '2115 W Roosevelt Blvd',
};

/* ── Types ──────────────────────────────────────────────────────────── */

interface FlippFlyer {
  id: number;
  flyer_run_id: number;
  merchant: string;
  merchant_id: number;
  name: string;
  valid_from: string;
  valid_to: string;
  thumbnail_url: string;
  merchant_logo: string;
}

interface FlippItem {
  id: number;
  flyer_id: number;
  name: string;
  brand: string;
  price: string;
  discount: number | null;
  valid_from: string;
  valid_to: string;
  cutout_image_url: string;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse a price string into a numeric value.
 * Handles: "$3.99", "3.99", "$12"
 * Skips complex formats: "2/$5", "3 for $10", empty strings
 * Returns null if the price cannot be parsed cleanly.
 */
function parsePrice(raw: string): number | null {
  if (!raw || raw.trim() === '') return null;

  const cleaned = raw.trim();

  // Skip multi-buy formats like "2/$5", "3 for $10"
  if (/\d+\s*\/\s*\$/.test(cleaned)) return null;
  if (/\d+\s+for\s+/i.test(cleaned)) return null;

  // Match simple dollar amounts: "$3.99", "3.99", "$12"
  const match = cleaned.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;

  const value = parseFloat(match[1]);
  // Skip non-grocery items (tires, furniture, appliances, etc.)
  if (isNaN(value) || value <= 0 || value > 50) return null;
  return value;
}

function matchStoreName(merchant: string): string | null {
  const lower = merchant.toLowerCase().trim();
  for (const target of TARGET_STORES) {
    if (lower.includes(target)) return target;
  }
  return null;
}

function canonicalStoreName(key: string): string {
  const names: Record<string, string> = {
    'food lion': 'Food Lion',
    'walmart': 'Walmart',
    'aldi': 'ALDI',
    'lidl': 'Lidl',
    'publix': 'Publix',
    'lowes foods': 'Lowes Foods',
  };
  return names[key] || key;
}

/* ── Main ───────────────────────────────────────────────────────────── */

async function ingestFlippGrocery() {
  console.log('Starting Flipp grocery flyer ingestion for Monroe, NC (28112)...');

  let totalProcessed = 0;
  let totalSkipped = 0;
  let storeCount = 0;
  const errors: string[] = [];

  try {
    // 1. Fetch flyer list
    console.log(`Fetching flyers from ${FLIPP_FLYERS_URL}`);
    const flyersRes = await fetch(FLIPP_FLYERS_URL, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!flyersRes.ok) {
      throw new Error(`Failed to fetch flyers: ${flyersRes.status} ${flyersRes.statusText}`);
    }

    const flyersData = await flyersRes.json();
    const flyers: FlippFlyer[] = flyersData.flyers || [];
    console.log(`Found ${flyers.length} total flyers.`);

    // 2. Filter to target stores
    const targetFlyers = flyers.filter((f) => matchStoreName(f.merchant) !== null);
    console.log(`Matched ${targetFlyers.length} flyers from target stores.`);

    // 3. Process each store's flyer
    for (const flyer of targetFlyers) {
      const storeKey = matchStoreName(flyer.merchant)!;
      const storeName = canonicalStoreName(storeKey);
      const storeLocation = STORE_LOCATIONS[storeKey] || null;

      console.log(`\nProcessing: ${storeName} — "${flyer.name}" (flyer #${flyer.id})`);

      try {
        // Rate limiting
        await sleep(500);

        const itemsRes = await fetch(FLIPP_FLYER_ITEMS_URL(flyer.id), {
          headers: { 'User-Agent': USER_AGENT },
        });

        if (!itemsRes.ok) {
          const msg = `Failed to fetch items for ${storeName} flyer ${flyer.id}: ${itemsRes.status}`;
          console.warn(msg);
          errors.push(msg);
          continue;
        }

        const flyerData = await itemsRes.json();
        const items: FlippItem[] = flyerData.items || [];
        console.log(`  Found ${items.length} items in flyer.`);

        // 4. Filter items with parseable prices
        const rows = [];
        for (const item of items) {
          const price = parsePrice(item.price);
          if (price === null) {
            totalSkipped++;
            continue;
          }

          rows.push({
            store_name: storeName,
            store_location: storeLocation,
            item_name: item.name,
            brand: item.brand || null,
            price,
            is_deal: item.discount !== null && item.discount > 0,
            deal_description: item.discount ? `${item.discount}% off` : null,
            valid_until: flyer.valid_to ? new Date(flyer.valid_to).toISOString() : null,
            image_url: item.cutout_image_url || null,
            flipp_item_id: item.id,
            flipp_flyer_id: flyer.id,
            source: 'flipp',
            discount_pct: item.discount || null,
            scraped_at: new Date().toISOString(),
          });
        }

        if (rows.length === 0) {
          console.log(`  No parseable prices for ${storeName}, skipping.`);
          continue;
        }

        // 5. Upsert in batches of 100
        const BATCH_SIZE = 100;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          const { error } = await supabase
            .from('grocery_prices')
            .upsert(batch, { onConflict: 'store_name,item_name,flipp_item_id' });

          if (error) {
            const msg = `Upsert error for ${storeName} batch ${i / BATCH_SIZE + 1}: ${error.message}`;
            console.error(`  ${msg}`);
            errors.push(msg);
          }
        }

        console.log(`  Upserted ${rows.length} items for ${storeName}.`);
        totalProcessed += rows.length;
        storeCount++;
      } catch (storeError: any) {
        const msg = `Error processing ${storeName}: ${storeError.message}`;
        console.error(`  ${msg}`);
        errors.push(msg);
      }
    }

    // 6. Delete expired Flipp prices
    console.log('\nCleaning up expired Flipp prices...');
    const { error: deleteError, count: deletedCount } = await supabase
      .from('grocery_prices')
      .delete({ count: 'exact' })
      .eq('source', 'flipp')
      .lt('valid_until', new Date().toISOString());

    if (deleteError) {
      console.warn(`Failed to clean expired prices: ${deleteError.message}`);
    } else {
      console.log(`Deleted ${deletedCount ?? 0} expired Flipp price records.`);
    }

    // 7. Log results
    const status = errors.length === 0 ? 'success' : (totalProcessed > 0 ? 'partial' : 'failure');
    const message = `Processed ${totalProcessed} items from ${storeCount} stores. Skipped ${totalSkipped} items (no parseable price). Deleted ${deletedCount ?? 0} expired.${errors.length > 0 ? ` Errors: ${errors.length}` : ''}`;

    console.log(`\n${message}`);

    await supabase.from('ingestion_logs').insert({
      source_name: 'flipp-grocery',
      status,
      message,
      items_processed: totalProcessed,
      error_details: errors.length > 0 ? { errors } : null,
    });

    console.log('Flipp grocery ingestion complete.');
  } catch (error: any) {
    console.error('Flipp grocery ingestion failed:', error.message);

    await supabase.from('ingestion_logs').insert({
      source_name: 'flipp-grocery',
      status: 'failure',
      message: `Fatal error: ${error.message}`,
      items_processed: totalProcessed,
      error_details: { error: error.message, stack: error.stack },
    });
  }
}

ingestFlippGrocery().catch(console.error);
