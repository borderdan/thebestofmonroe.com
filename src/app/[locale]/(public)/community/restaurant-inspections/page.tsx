import { createClient } from '@/lib/supabase/server';
import PublicLayout from '@/components/public/PublicLayout';
import PublicHeader from '@/components/public/PublicHeader';
import { UtensilsCrossed, Clock } from 'lucide-react';
import RestaurantInspectionsClient from '@/components/community/restaurant-inspections-client';

export default async function RestaurantInspectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Get latest inspection per facility
  const { data: inspections } = await supabase
    .from('restaurant_inspections')
    .select('*')
    .order('inspection_date', { ascending: false })
    .limit(7000);

  // Dedupe to latest per facility
  const latest = new Map<string, typeof inspections extends (infer T)[] | null ? T : never>();
  for (const row of inspections ?? []) {
    if (!latest.has(row.facility_id)) latest.set(row.facility_id, row);
  }
  const facilities = Array.from(latest.values());

  // Find most recent inspection date for "last updated"
  const mostRecent = inspections?.[0]?.inspection_date;

  return (
    <PublicLayout locale={locale}>
      <PublicHeader locale={locale} />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Restaurant Health Inspections</h1>
              {mostRecent && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  Last updated {new Date(mostRecent).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Latest NC Department of Health inspection scores for restaurants in the Monroe, NC area. Grades are based on health code compliance during routine inspections.
          </p>
        </div>

        <RestaurantInspectionsClient facilities={facilities} locale={locale} />

        {/* Data source attribution */}
        <footer className="mt-10 border-t pt-6">
          <p className="text-xs text-center text-muted-foreground">
            Data sourced from the NC Department of Health and Human Services, Division of Public Health.
            Inspections are conducted by Union County Environmental Health. Scores and grades reflect conditions
            at the time of inspection and may not represent current conditions.
          </p>
        </footer>
      </main>
    </PublicLayout>
  );
}
