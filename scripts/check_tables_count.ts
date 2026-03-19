import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkAllTables() {
  const tables = [
    'businesses',
    'community_pois',
    'pois',
    'entities',
    'directory',
    'directory_pois',
    'business_profiles',
    'profiles',
    'community_entities'
  ];

  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`Table '${table}' count: ${count}`);
    } else {
      console.log(`Table '${table}' error: ${error.message}`);
    }
  }
}

checkAllTables()