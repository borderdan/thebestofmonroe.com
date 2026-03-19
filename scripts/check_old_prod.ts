import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.old.prod' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { count } = await supabase.from('entities').select('*', { count: 'exact', head: true })
  console.log('Old Prod entities count:', count)
}

run()