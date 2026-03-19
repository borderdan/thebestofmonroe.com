import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function countAll() {
  const { count: bizCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
  const { count: insCount } = await supabase.from('restaurant_inspections').select('*', { count: 'exact', head: true });
  console.log('Businesses:', bizCount);
  console.log('Inspections:', insCount);
}

countAll()