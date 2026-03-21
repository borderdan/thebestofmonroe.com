import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data, error, count } = await supabase.from('businesses').select('*').eq('is_visible', true).order('created_at', { ascending: false }).limit(5000)
  console.log('Error:', error)
  console.log('Data Length:', data ? data.length : null)
}

run()