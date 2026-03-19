import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data, error, count } = await supabase.from('restaurant_inspections').select('*', { count: 'exact' }).limit(5)
  console.log('restaurant_inspections Error:', error)
  console.log('restaurant_inspections Count:', count)
  console.log('restaurant_inspections Data:', data)
}

run()