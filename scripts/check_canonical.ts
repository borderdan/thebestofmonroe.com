import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkCanonical() {
  const { count } = await supabase.from('canonical_entities').select('*', { count: 'exact', head: true });
  console.log(`canonical_entities count:`, count);
}

checkCanonical()