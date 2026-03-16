import { getPublicHubData } from '@/lib/queries/public-hub'
import { createClient } from '@/lib/supabase/server'
import PublicLayout from '@/components/public/PublicLayout'
import PublicHeader from '@/components/public/PublicHeader'
import { OverviewStrip } from '@/components/hub/overview-strip'
import { LiveSignalCard } from '@/components/hub/live-signal-card'
import { IntelligenceFeed } from '@/components/hub/intelligence-feed'
import { MarketLeaders } from '@/components/hub/market-leaders'
import { AviationPanel } from '@/components/hub/aviation-panel'
import { Plane, TrendingUp, Wallet, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GroceryArbitrage } from '@/components/hub/grocery-arbitrage'
import { SideHustleRegistry } from '@/components/hub/side-hustle-registry'
import { FlashDealAggregator } from '@/components/hub/flash-deal-aggregator'

export default async function LocaleIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { communityUpdates, groceryPrices, totalBusinesses } = await getPublicHubData()
  const supabase = await createClient()

  // 1. Fetch High Vitality for the Editorial Grid
  let { data: trendingEntities } = await supabase
    .from('canonical_entities')
    .select('*')
    .order('vitality_score', { ascending: false })
    .limit(4)

  if (!trendingEntities || trendingEntities.length === 0) {
    trendingEntities = [
      {
        id: 'mock-1',
        name: 'Southern Range Brewing Co.',
        address: '151 S Stewart St, Monroe, NC',
        vitality_score: 98,
        category: 'Food & Beverage',
        commercial_data: {
          cover_url: 'https://images.unsplash.com/photo-1581622558667-3419a8dc5f83?auto=format&fit=crop&q=80&w=800',
          rating: '4.8'
        },
        official_data: {
          ai_summary: 'A community staple offering locally brewed craft beers with frequent food trucks and live music.'
        }
      },
      {
        id: 'mock-2',
        name: 'The Courthouse Self-Pour',
        address: '100 W Jefferson St, Monroe, NC',
        vitality_score: 94,
        category: 'Entertainment',
        commercial_data: {
          cover_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800',
          rating: '4.9'
        },
        official_data: {
          ai_summary: 'Historic downtown building transformed into a modern self-pour taproom and community gathering space.'
        }
      }
    ]
  }

  const weatherUpdate = communityUpdates.find(u => u.type === 'weather' && u.source_id.startsWith('forecast'));
  const aviationUpdates = communityUpdates.filter(u => u.type === 'aviation');
  const activeAlerts = communityUpdates.filter(u => u.type === 'alert').length;

  const weatherData = weatherUpdate ? { 
    temp: weatherUpdate.raw_data?.temperature || 72, 
    condition: weatherUpdate.raw_data?.shortForecast || 'Sunny' 
  } : undefined;

  return (
    <PublicLayout locale={locale}>
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        <PublicHeader locale={locale} />
        
        {/* City Overview Control Strip */}
        <OverviewStrip weather={weatherData} activeAlerts={activeAlerts} />

        <main className="flex-1 px-4 md:px-6 lg:px-16 py-8 space-y-32">
          
          {/* Main Modular Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Live Signals (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Air Terminal Board (Refined as a signal card) */}
                <LiveSignalCard 
                  title="Aviation (KEQY)" 
                  icon={<Plane className="w-4 h-4" />}
                  live={true}
                  timestamp={new Date().toLocaleTimeString()}
                >
                  <AviationPanel flights={aviationUpdates} />
                </LiveSignalCard>

                {/* Market Activity Signal */}
                <LiveSignalCard
                  title="Market Activity"
                  icon={<TrendingUp className="w-4 h-4" />}
                  timestamp={new Date().toLocaleTimeString()}
                >
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <div className="text-3xl font-bold tracking-tighter text-foreground">{totalBusinesses.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-1">Total active businesses</div>
                    </div>
                    <div className="text-emerald-500 font-bold text-sm bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">+12 this week</div>
                  </div>
                </LiveSignalCard>

                {/* The Wallet / Grocery */}
                <LiveSignalCard
                  title="The Wallet"
                  icon={<Wallet className="w-4 h-4" />}
                  timestamp={new Date().toLocaleTimeString()}
                  className="bg-monroe-surface"
                >
                  <div className="space-y-4 mt-2">
                      {groceryPrices.slice(0, 3).map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center group">
                              <div>
                                  <div className="text-[10px] font-bold uppercase text-muted-foreground">{item.store_name}</div>
                                  <div className="text-sm font-medium text-foreground group-hover:text-monroe-accent transition-colors">{item.item_name}</div>
                              </div>
                              <div className="text-lg font-bold tracking-tight text-foreground">${item.price}</div>
                          </div>
                      ))}
                      <a href="#wallet">
                        <Button variant="outline" className="w-full mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800">
                            Launch Arbitrage Board
                        </Button>
                      </a>
                  </div>
                </LiveSignalCard>

            </div>

            {/* Right Column: Intelligence & Leaders (8 Cols) */}
            <div className="lg:col-span-8 space-y-12">
                
                {/* 1. Civic Intelligence Section */}
                <IntelligenceFeed updates={communityUpdates} />

                {/* 2. Market Editorial */}
                <MarketLeaders entities={trendingEntities || []} />

            </div>
          </div>

          <div className="space-y-32">
            {/* Monroe Wallet Section */}
            <section id="wallet" className="scroll-mt-32">
                <GroceryArbitrage />
            </section>

            {/* Side-Hustle Registry */}
            <section id="hustles" className="scroll-mt-32">
                <SideHustleRegistry />
            </section>

            {/* Flash Deals */}
            <section id="deals" className="scroll-mt-32">
                <FlashDealAggregator updates={communityUpdates} />
            </section>
          </div>
        </main>
      </div>
    </PublicLayout>
  )
}
