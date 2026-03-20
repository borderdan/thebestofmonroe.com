import { createClient } from '@/lib/supabase/server';
import PublicLayout from '@/components/public/PublicLayout';
import PublicHeader from '@/components/public/PublicHeader';
import { Tag, Clock } from 'lucide-react';
import PriceIntelClient from '@/components/wallet/price-intel-client';

export default async function PriceIntelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Fetch all grocery prices, most recent per store+item
  const { data: rawPrices } = await supabase
    .from('grocery_prices' as any)
    .select('*')
    .order('scraped_at', { ascending: false })
    .limit(2000);

  // Dedupe to latest price per store+item combo
  const priceMap = new Map<string, any>();
  for (const row of rawPrices ?? []) {
    const key = `${row.store_name}|${row.item_name}`;
    if (!priceMap.has(key)) priceMap.set(key, row);
  }
  const prices = Array.from(priceMap.values());

  // Get unique stores and most recent scrape
  const stores = [...new Set(prices.map((p: any) => p.store_name))].sort();
  const mostRecent = rawPrices?.[0]?.scraped_at;

  return (
    <PublicLayout locale={locale}>
      <PublicHeader locale={locale} />
      <main className="flex-1 px-4 md:px-6 py-6">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Tag className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Price Intel
              </h1>
              {mostRecent && (
                <p className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  Last sync: {new Date(mostRecent).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Side-by-side grocery price comparison across Monroe, NC stores.
            Find the best deals on staples and build your weekly smart basket.
          </p>
        </div>

        <PriceIntelClient
          prices={prices}
          stores={stores as string[]}
          locale={locale}
        />

        {/* Data source attribution */}
        <footer className="mt-10 border-t border-white/[0.06] pt-6">
          <p className="text-[10px] text-center text-muted-foreground/50 font-mono uppercase tracking-wider">
            Prices sourced from weekly store flyers via Flipp. Updated daily.
            Actual in-store prices may vary. Check store apps for current pricing.
          </p>
        </footer>
      </main>
    </PublicLayout>
  );
}
