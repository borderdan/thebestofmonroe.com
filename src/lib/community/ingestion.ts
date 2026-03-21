import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import * as crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient<Database> | null = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Ensure dotenv is loaded.');
  }

  supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  return supabaseClient;
}

export type CommunityUpdateInput = {
  source_id: string;
  type: 'traffic' | 'weather' | 'permit' | 'event' | 'aviation' | 'job' | 'alert' | 'maker';
  title: string;
  description?: string;
  severity?: 'low' | 'med' | 'high' | 'critical';
  latitude?: number;
  longitude?: number;
  location_name?: string;
  event_time: string;
  expires_at?: string;
  raw_data: unknown;
};

export function generateHash(data: unknown): string {
    const str = JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex');
}

export async function upsertCommunityUpdate(input: CommunityUpdateInput) {
  const supabase = getSupabase();
  const { latitude, longitude, ...data } = input;
  
  // Construct GeoJSON Point if coordinates are provided
  const geometry = latitude && longitude 
    ? `POINT(${longitude} ${latitude})` 
    : null;

  const payload_hash = generateHash(data.raw_data);

  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('community_feed' as any)
    .upsert({
      ...data,
      geometry: geometry,
      payload_hash,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'source_id, type' 
    });

  if (error) {
    console.error(`Error upserting community feed [${input.type}:${input.source_id}]:`, error.message);
    throw error;
  }
}

export async function logIngestion(source: string, status: 'success' | 'failure' | 'partial', message?: string, itemsProcessed: number = 0, errorDetails?: unknown) {
    const supabase = getSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('ingestion_logs' as any).insert({
        source_name: source,
        status,
        message,
        items_processed: itemsProcessed,
        error_details: errorDetails
    });
}

export async function cleanupStaleUpdates() {
  const supabase = getSupabase();
  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('community_feed' as any)
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Error cleaning up stale updates:', error.message);
    throw error;
  }
}

export type PoiInput = {
  name: string;
  category: string;
  address?: string;
  latitude: number;
  longitude: number;
  metadata?: Record<string, unknown>;
};

export async function upsertPoi(input: PoiInput) {
  const supabase = getSupabase();
  const { latitude, longitude, ...data } = input;
  
  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('pois' as any)
    .upsert({
      ...data,
      geometry: `POINT(${longitude} ${latitude})`,
    }, {
      onConflict: 'name, category' 
    });

  if (error) {
    console.error(`Error upserting POI [${input.category}:${input.name}]:`, error.message);
    throw error;
  }
}
export type GroceryPriceInput = {
    store_name: string;
    store_location: string;
    item_name: string;
    category?: string;
    price: number;
    unit?: string;
    is_deal?: boolean;
    deal_description?: string;
    valid_until?: string;
};

export async function upsertGroceryPrice(input: GroceryPriceInput) {
    const supabase = getSupabase();
    
    // Check for existing price to avoid duplicate records if scraped multiple times in a short window
    // although the UNIQUE constraint in DB handles it, we can be more explicit here if needed.
    
    const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('grocery_prices' as any)
        .upsert({
            ...input,
            scraped_at: new Date().toISOString()
        }, {
            onConflict: 'store_name, store_location, item_name, scraped_at'
        });

    if (error) {
        console.error(`Error upserting grocery price [${input.store_name}:${input.item_name}]:`, error.message);
        throw error;
    }
}
