import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { upsertCommunityUpdate } from '../src/lib/community/ingestion';

const NWS_ALERTS_URL = 'https://api.weather.gov/alerts/active?zone=NCC179';
const NWS_FORECAST_URL = 'https://api.weather.gov/gridpoints/GSP/101,60/forecast'; // KEQY / Monroe Precise Grid
const USER_AGENT = 'MadeInMonroe-App/1.0 (contact@borderdan.com)';

async function ingestWeather() {
  console.log("Fetching weather data from NWS...");
  
  try {
    // 1. Fetch Alerts
    const alertsResponse = await fetch(NWS_ALERTS_URL, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (alertsResponse.ok) {
      const alertsData = await alertsResponse.json();
      const features = alertsData.features || [];
      console.log(`Found ${features.length} active weather alerts for Union County.`);

      for (const alert of features) {
        const props = alert.properties;
        await upsertCommunityUpdate({
          source_id: props.id,
          type: 'weather',
          title: props.event,
          description: props.description || props.headline,
          event_time: props.sent,
          expires_at: props.ends || props.expires,
          raw_data: alert
        });
      }
    } else {
        console.warn(`Failed to fetch NWS alerts: ${alertsResponse.status}`);
    }

    // 2. Fetch Forecast (Daily Summary update)
    const forecastResponse = await fetch(NWS_FORECAST_URL, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        const currentPeriod = forecastData.properties.periods[0];
        
        await upsertCommunityUpdate({
            source_id: `forecast-${new Date().toISOString().split('T')[0]}`,
            type: 'weather',
            title: `Today: ${currentPeriod.name}`,
            description: `${currentPeriod.detailedForecast} - Temperature: ${currentPeriod.temperature}°F`,
            event_time: new Date().toISOString(),
            expires_at: new Date(new Date().getTime() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
            raw_data: currentPeriod
        });
    } else {
        console.warn(`Failed to fetch NWS forecast: ${forecastResponse.status}`);
    }

    console.log("Weather ingestion complete.");
  } catch (error) {
    console.error("Weather ingestion failed:", error);
  }
}

ingestWeather().catch(console.error);
