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

    // Grocery Prices
    supabase
      .from('grocery_prices' as any)
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(5),

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
