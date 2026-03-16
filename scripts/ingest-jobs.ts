import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { upsertCommunityUpdate } from '../src/lib/community/ingestion';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
// Monroe, NC Centroid
const LAT = 34.9854;
const LON = -80.5495;
const RADIUS = 15; // km

async function ingestJobs() {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.warn("ADZUNA credentials not found. Skipping job ingestion.");
    return;
  }

  console.log("Fetching local jobs from Adzuna...");
  
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=20&lat=${LAT}&long=${LON}&distance=${RADIUS}&sort_by=date`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Adzuna Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const jobs = data.results || [];
    console.log(`Found ${jobs.length} jobs near Monroe.`);

    for (const job of jobs) {
      await upsertCommunityUpdate({
        source_id: job.id,
        type: 'job',
        title: job.title,
        description: `${job.company?.display_name || 'Unknown Company'} | ${job.location?.display_name} | ${job.description.substring(0, 150)}...`,
        latitude: job.latitude,
        longitude: job.longitude,
        event_time: job.created || new Date().toISOString(),
        expires_at: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        raw_data: job
      });
    }

    console.log("Job ingestion complete.");
  } catch (error) {
    console.error("Job ingestion failed:", error);
  }
}

ingestJobs().catch(console.error);
