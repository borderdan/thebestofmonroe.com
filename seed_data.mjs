import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  const { data, error } = await supabase.from('grocery_prices').insert([
    {
      store_name: 'Walmart',
      store_location: 'Monroe',
      item_name: 'Milk (Gallon)',
      category: 'Dairy',
      price: 2.99,
      unit: 'gal',
      is_deal: true,
      deal_description: 'Rollback',
      valid_until: '2025-12-31',
      brand: 'Great Value',
      scraped_at: new Date().toISOString()
    },
    {
      store_name: 'Harris Teeter',
      store_location: 'Monroe',
      item_name: 'Milk (Gallon)',
      category: 'Dairy',
      price: 3.49,
      unit: 'gal',
      is_deal: false,
      brand: 'HT Traders',
      scraped_at: new Date().toISOString()
    },
    {
      store_name: 'Food Lion',
      store_location: 'Monroe',
      item_name: 'Milk (Gallon)',
      category: 'Dairy',
      price: 3.19,
      unit: 'gal',
      is_deal: false,
      brand: 'Food Lion',
      scraped_at: new Date().toISOString()
    }
  ])
  if (error) console.error('Error seeding data:', error)
  else console.log('Successfully seeded data')
}

seed()
