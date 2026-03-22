import { createClient } from '@/lib/supabase/server'

export async function getPublicHubData() {
  const supabase = await createClient()
  const now = new Date()

  const [
    communityUpdatesRes,
    groceryPricesRes,
    totalBusinessesRes
  ] = await Promise.all([
    // Community Updates
    supabase
      .from('community_feed')
      .select('*')
      .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
      .order('event_time', { ascending: false })
      .limit(10),

    // Grocery Prices — fetch enough to show diverse items across stores
    supabase
      .from('grocery_prices' as unknown)
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(200),

    // Total businesses
    supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
  ])

  return {
    communityUpdates: communityUpdatesRes.data || [],
    groceryPrices: groceryPricesRes.data || [],
    totalBusinesses: totalBusinessesRes.count || 0,
  }
}
