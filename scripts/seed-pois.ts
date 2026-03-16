import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function extractPlaceId(url: string) {
  if (!url) return null;
  const match = url.match(/query_place_id=([^&]+)/);
  return match ? match[1] : null;
}

function generateSlug(poi: any) {
  const base = `${poi.title} ${poi.city} ${poi.street || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  
  return base.substring(0, 100);
}

async function seed(filename: string) {
  const dataPath = path.join(process.cwd(), filename);
  console.log(`Reading dataset from ${dataPath}...`);
  
  let rawData;
  try {
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    rawData = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Failed to read or parse JSON from ${filename}:`, error);
    return;
  }

  console.log(`Loaded ${rawData.length} POIs from ${filename}. Formatting payload...`);

  const businesses = rawData.map((poi: any) => {
    const gpId = extractPlaceId(poi.url);
    return {
      name: poi.title || 'Unknown Business',
      slug: generateSlug(poi),
      city: poi.city || 'Unknown',
      category: poi.categoryName || (poi.categories && poi.categories[0]) || 'Other',
      rating: poi.totalScore || 0,
      review_count: poi.reviewsCount || 0,
      is_visible: true,
      google_place_id: gpId,
      location: {
        street: poi.street,
        city: poi.city,
        state: poi.state,
        countryCode: poi.countryCode
      },
      contact: {
        phone: poi.phone,
        website: poi.website,
        url: poi.url
      }
    };
  });

  // Batch insert into supabase using upsert
  const BATCH_SIZE = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
    const batch = businesses.slice(i, i + BATCH_SIZE);
    
    console.log(`Upserting batch ${i / BATCH_SIZE + 1} of ${Math.ceil(businesses.length / BATCH_SIZE)}...`);
    
    // UPSERT with onConflict 'google_place_id' if available, otherwise 'slug'
    // However, onConflict accepts a column name. We have a unique index on google_place_id and slug.
    // If we want to deduplicate by BOTH, we should probably prefer google_place_id as the stronger key.
    // But since businesses table already has 'slug' as a unique constraint probably, 
    // let's use google_place_id for the merge if available.
    
    const { error } = await supabase
      .from('businesses')
      .upsert(batch, { onConflict: 'slug', ignoreDuplicates: false });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
    }
  }

  console.log(`Seeding complete for ${filename}. Success: ${successCount}, Errors: ${errorCount}`);
}

const filesToProcess = process.argv.slice(2);
if (filesToProcess.length === 0) {
  // Default to the original file if no args
  filesToProcess.push('dataset_crawler-google-places_2026-03-14_23-21-18-149.json');
}

async function runSeeding() {
  for (const file of filesToProcess) {
    await seed(file);
  }
}

runSeeding().catch(console.error);
