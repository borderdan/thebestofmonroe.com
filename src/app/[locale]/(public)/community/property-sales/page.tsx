import { createClient } from '@/lib/supabase/server';
import PublicLayout from '@/components/public/PublicLayout';
import PublicHeader from '@/components/public/PublicHeader';
import { LandPlot, Clock } from 'lucide-react';
import PropertySalesClient from '@/components/community/property-sales-client';

export default async function PropertySalesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: sales } = await supabase
    .from('property_sales')
    .select('*')
    .order('sale_date', { ascending: false })
    .limit(50);

  const mostRecent = sales?.[0]?.sale_date;

  return (
    <PublicLayout locale={locale}>
      <PublicHeader locale={locale} />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <LandPlot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Property Sales</h1>
              {mostRecent && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  Last recorded sale: {new Date(mostRecent).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Recent real estate transactions in Monroe and Union County compiled from public records.
            Data includes sale prices, property details, and buyer/seller information when available.
          </p>
        </div>

        <PropertySalesClient sales={sales ?? []} locale={locale} />

        {/* Data source attribution */}
        <footer className="mt-10 border-t pt-6">
          <p className="text-xs text-center text-muted-foreground">
            Data sourced from Union County Register of Deeds and public property records.
            Sale prices reflect recorded transfer amounts and may not include additional considerations.
            This information is provided for general reference only and should not be relied upon for investment decisions.
          </p>
        </footer>
      </main>
    </PublicLayout>
  );
}
