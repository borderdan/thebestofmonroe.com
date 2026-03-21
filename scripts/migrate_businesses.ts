import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.old.prod' })

const oldSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

config({ path: '.env.local', override: true })

const newSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrateData() {
  console.log('Fetching businesses from old prod...');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allBusinesses: any[] = [];
  for (let i = 0; i < 2; i++) {
    const { data: businesses, error: fetchError } = await oldSupabase
      .from('businesses')
      .select('*')
      .range(i * 1000, (i + 1) * 1000 - 1);
    if (fetchError) {
      console.error('Error fetching:', fetchError);
      return;
    }
    if (businesses) allBusinesses = allBusinesses.concat(businesses);
  }

  console.log(`Found ${allBusinesses.length} businesses. Inserting into new database...`);
  
  // Insert in batches
  const batchSize = 100;
  for (let i = 0; i < allBusinesses.length; i += batchSize) {
    const batch = allBusinesses.slice(i, i + batchSize).map(({ description, google_place_id, rating, review_count, ...rest }) => {
      // Ignore unused variables for TS correctness during destructuring
      void description; void google_place_id; void rating; void review_count;
      return rest;
    });
    const { error: insertError } = await newSupabase
      .from('businesses')
      .upsert(batch, { onConflict: 'id' });
    
    if (insertError) {
      console.error(`Error inserting batch ${i}:`, insertError);
    } else {
      console.log(`Inserted batch ${i} to ${i + batch.length}`);
    }
  }
  
  console.log('Migration complete!');
}

migrateData()