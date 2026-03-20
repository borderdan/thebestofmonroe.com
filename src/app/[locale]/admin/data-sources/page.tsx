import { createClient } from '@/lib/supabase/server';
import { DataPipelineClient } from '@/components/admin/data-pipeline-client';

export default async function AdminDataPipelinePage() {
  const supabase = await createClient();

  // Fetch data sources
  const { data: sources } = await supabase
    .from('data_sources' as any)
    .select('*')
    .order('category', { ascending: true });

  // Fetch recent ingestion logs (last 200)
  const { data: logs } = await supabase
    .from('ingestion_logs' as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  // Fetch table row counts for value metrics
  const [
    communityFeedCount,
    groceryPricesCount,
    inspectionsCount,
    councilMeetingsCount,
    agendasCount,
    propertySalesCount,
  ] = await Promise.all([
    supabase.from('community_feed' as any).select('id', { count: 'exact', head: true }),
    supabase.from('grocery_prices' as any).select('id', { count: 'exact', head: true }),
    supabase.from('restaurant_inspections' as any).select('id', { count: 'exact', head: true }),
    supabase.from('council_meetings' as any).select('id', { count: 'exact', head: true }),
    supabase.from('city_agendas' as any).select('id', { count: 'exact', head: true }),
    supabase.from('property_sales' as any).select('id', { count: 'exact', head: true }),
  ]);

  const tableCounts: Record<string, number> = {
    community_feed: communityFeedCount.count || 0,
    grocery_prices: groceryPricesCount.count || 0,
    restaurant_inspections: inspectionsCount.count || 0,
    council_meetings: councilMeetingsCount.count || 0,
    city_agendas: agendasCount.count || 0,
    property_sales: propertySalesCount.count || 0,
  };

  return (
    <DataPipelineClient
      sources={sources || []}
      logs={logs || []}
      tableCounts={tableCounts}
    />
  );
}
