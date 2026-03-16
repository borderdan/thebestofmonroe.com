import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { upsertCommunityUpdate } from '../src/lib/community/ingestion';

// Monroe, NC bounding box (rough estimate) or filtered by county
const NCDOT_API_URL = 'https://nc.prod.traveliq.co/api/incidents';
const API_KEY = process.env.NCDOT_API_KEY;

async function ingestTraffic() {
  if (!API_KEY) {
    console.warn("NCDOT_API_KEY not found in environment. Skipping traffic ingestion.");
    return;
  }

  console.log("Fetching traffic data from NCDOT...");
  
  try {
    const response = await fetch(`${NCDOT_API_URL}?key=${API_KEY}`, {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter for Union County (County Code 179) or by coordinates if available in payload
    // DriveNC payload typically includes 'countyName' or 'location'
    const unionCountyIncidents = data.filter((inc: any) => 
      inc.countyName === 'Union' || 
      inc.description?.toLowerCase().includes('monroe') || 
      inc.description?.toLowerCase().includes('us-74') ||
      inc.description?.toLowerCase().includes('rocky river rd') ||
      inc.description?.toLowerCase().includes('nc-200') ||
      inc.description?.toLowerCase().includes('union county')
    );

    console.log(`Found ${unionCountyIncidents.length} incidents in Union County/Monroe.`);

    for (const incident of unionCountyIncidents) {
      await upsertCommunityUpdate({
        source_id: incident.id.toString(),
        type: 'traffic',
        title: incident.name || 'Traffic Incident',
        description: incident.description,
        latitude: incident.latitude,
        longitude: incident.longitude,
        event_time: incident.startTime || new Date().toISOString(),
        expires_at: incident.endTime,
        raw_data: incident
      });
    }

    console.log("Traffic ingestion complete.");
  } catch (error) {
    console.error("Traffic ingestion failed:", error);
  }
}

ingestTraffic().catch(console.error);
