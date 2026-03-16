import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { upsertCommunityUpdate } from '../src/lib/community/ingestion';

const AEROAPI_URL = 'https://aeroapi.flightaware.com/aeroapi/airports/KEQY/flights';
const API_KEY = process.env.FLIGHTAWARE_API_KEY;

async function ingestAviation() {
  if (!API_KEY) {
    console.warn("FLIGHTAWARE_API_KEY not found in environment. Skipping aviation ingestion.");
    return;
  }

  console.log("Fetching aviation data for KEQY (Monroe Executive)...");
  
  try {
    const response = await fetch(AEROAPI_URL, {
      headers: {
        'x-apikey': API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`AeroAPI Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Process Arrivals
    const arrivals = data.arrivals || [];
    for (const flight of arrivals) {
      await upsertCommunityUpdate({
        source_id: `flight-arr-${flight.fa_flight_id}`,
        type: 'aviation',
        title: `Arrival: ${flight.ident}`,
        description: `From: ${flight.origin?.city || 'Unknown'} | Status: ${flight.status} | ETA: ${flight.estimated_on ? new Date(flight.estimated_on).toLocaleTimeString() : 'N/A'}`,
        event_time: flight.estimated_on || new Date().toISOString(),
        expires_at: flight.actual_on || new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
        raw_data: flight
      });
    }

    // Process Departures
    const departures = data.departures || [];
    for (const flight of departures) {
      await upsertCommunityUpdate({
        source_id: `flight-dep-${flight.fa_flight_id}`,
        type: 'aviation',
        title: `Departure: ${flight.ident}`,
        description: `To: ${flight.destination?.city || 'Unknown'} | Status: ${flight.status} | ETD: ${flight.estimated_off ? new Date(flight.estimated_off).toLocaleTimeString() : 'N/A'}`,
        event_time: flight.estimated_off || new Date().toISOString(),
        expires_at: flight.actual_off || new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
        raw_data: flight
      });
    }

    console.log(`Aviation ingestion complete. Processed ${arrivals.length} arrivals and ${departures.length} departures.`);
  } catch (error) {
    console.error("Aviation ingestion failed:", error);
  }
}

ingestAviation().catch(console.error);
