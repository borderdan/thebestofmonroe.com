import { createClient } from '@/lib/supabase/server'

export async function universalSearch(query: string) {
  const supabase = await createClient()
  const searchTerm = `%${query}%`

  const [entitiesRes, feedRes] = await Promise.all([
    supabase
      .from('canonical_entities')
      .select('id, name, type, category, address, vitality_score')
      .or(`name.ilike.${searchTerm},category.ilike.${searchTerm},address.ilike.${searchTerm}`)
      .limit(10),
    supabase
      .from('community_feed')
      .select('id, title, type, description, event_time, severity')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .order('event_time', { ascending: false })
      .limit(10)
  ])

  return {
    entities: entitiesRes.data || [],
    feed: feedRes.data || []
  }
}
