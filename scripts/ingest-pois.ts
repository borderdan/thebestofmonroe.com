import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { upsertPoi } from '../src/lib/community/ingestion';

const ONE_MAP_SERVICES = [
  {
    name: 'Fire Stations',
    url: 'https://services1.arcgis.com/Ym990Y66uIsX9pT3/arcgis/rest/services/Fire_Stations/FeatureServer/0/query',
    category: 'emergency'
  },
  {
    name: 'Law Enforcement',
    url: 'https://services1.arcgis.com/Ym990Y66uIsX9pT3/arcgis/rest/services/Local_Law_Enforcement_Locations/FeatureServer/0/query',
    category: 'emergency'
  },
  {
    name: 'Public Libraries',
    url: 'https://services1.arcgis.com/Ym990Y66uIsX9pT3/arcgis/rest/services/Public_Libraries/FeatureServer/0/query',
    category: 'government'
  }
];

async function ingestPois() {
  console.log("Fetching POIs from NC OneMap...");
  
  for (const service of ONE_MAP_SERVICES) {
    try {
      const queryUrl = `${service.url}?where=County='Union'&outFields=*&f=json`;
      const response = await fetch(queryUrl);
      
      if (!response.ok) {
        console.error(`Failed to fetch ${service.name}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const features = data.features || [];
      console.log(`Found ${features.length} ${service.name} in Union County.`);

      for (const feature of features) {
        const attrs = feature.attributes;
        const geom = feature.geometry; // ArcGIS geometry usually has x/y

        await upsertPoi({
          name: attrs.NAME || attrs.STATION_NA || attrs.LIBNAME || 'Unknown',
          category: service.category,
          address: attrs.ADDRESS || attrs.PHYSICAL_A || attrs.STREET_ADD,
          latitude: geom.y,
          longitude: geom.x,
          metadata: attrs
        });
      }
    } catch (error) {
      console.error(`Error processing service ${service.name}:`, error);
    }
  }

  console.log("POI ingestion complete.");
}

ingestPois().catch(console.error);
