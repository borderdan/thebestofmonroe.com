import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data, error, count } = await supabase.from('entities').select('*', { count: 'exact' }).limit(5)
  console.log('Error:', error)
  console.log('Count:', count)
  console.log('Data:', data?.length)
}

run()