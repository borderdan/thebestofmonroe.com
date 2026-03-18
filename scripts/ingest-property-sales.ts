/**
 * Union County NC — Property Sales Ingestion
 *
 * Source: Union County GIS ArcGIS REST API (public)
 * Endpoint: gis.unioncountync.gov — OperationalLayers/MapServer/215 (Parcels)
 *
 * Usage: npm run ingest:property-sales
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const ARCGIS_BASE = 'https://gis.unioncountync.gov/server/rest/services';
const PARCELS_QUERY = `${ARCGIS_BASE}/OperationalLayers/MapServer/215/query`;

// Days back to look for new sales
const DAYS_BACK = 90;
const BATCH_SIZE = 200;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

type SaleFeature = {
  attributes: {
    PID: string;
    PHYSSTRADD: string | null;
    s1_SALESAMT: number | null;
    s1_SALEDATE: number | null; // epoch ms
    s1_grantor: string | null;
    JAN1_NAME1: string | null;
    property_use: string | null;
    SQFT: number | null;
    YEARBLT: number | null;
    FMV_TOTAL: number | null;
  };
};

async function fetchSales(offset = 0): Promise<{ features: SaleFeature[]; exceeded: boolean }> {
  const since = daysAgo(DAYS_BACK);
  const params = new URLSearchParams({
    where: `s1_SALEDATE >= DATE '${since}' AND s1_SALESAMT > 1000`,
    outFields: 'PID,PHYSSTRADD,s1_SALESAMT,s1_SALEDATE,s1_grantor,JAN1_NAME1,property_use,SQFT,YEARBLT,FMV_TOTAL',
    returnGeometry: 'false',
    orderByFields: 's1_SALEDATE DESC',
    resultRecordCount: String(BATCH_SIZE),
    resultOffset: String(offset),
    f: 'json',
  });

  const res = await fetch(`${PARCELS_QUERY}?${params}`);
  if (!res.ok) throw new Error(`GIS API error: ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(`GIS error: ${data.error.message}`);

  return {
    features: (data.features ?? []) as SaleFeature[],
    exceeded: !!data.exceededTransferLimit,
  };
}

async function main() {
  console.log('=== Property Sales Ingestion (Union County GIS) ===\n');
  const supabase = getSupabase();

  let totalFetched = 0;
  let upserted = 0;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching sales batch (offset ${offset})...`);
    const { features, exceeded } = await fetchSales(offset);
    console.log(`  Got ${features.length} records`);
    totalFetched += features.length;

    for (const { attributes: a } of features) {
      if (!a.PID || !a.s1_SALEDATE) continue;

      const saleDate = new Date(a.s1_SALEDATE).toISOString().split('T')[0];

      const { error } = await supabase.from('property_sales').upsert(
        {
          parcel_id: String(a.PID),
          address: a.PHYSSTRADD?.trim() || null,
          sale_date: saleDate,
          sale_price: a.s1_SALESAMT ?? null,
          seller: a.s1_grantor?.trim() || null,
          buyer: a.JAN1_NAME1?.trim() || null,
          property_type: a.property_use?.trim() || null,
          sqft: a.SQFT && a.SQFT > 0 ? a.SQFT : null,
          year_built: a.YEARBLT && a.YEARBLT > 0 ? a.YEARBLT : null,
          raw_data: a,
        },
        { onConflict: 'parcel_id,sale_date' }
      );

      if (error) {
        console.error(`  ✗ ${a.PID}: ${error.message}`);
      } else {
        upserted++;
      }
    }

    if (features.length === 0 || !exceeded) {
      hasMore = false;
    } else {
      offset += features.length;
    }
  }

  console.log(`\n=== Done: fetched ${totalFetched}, upserted ${upserted} property sales ===`);
}

main().catch(console.error);
