'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBasket, ArrowDown, TrendingDown, Store, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SourceDrawer } from './source-drawer';

interface GroceryPrice {
  id: string;
  store_name: string;
  item_name: string;
  price: number;
  unit: string;
  scraped_at: string;
}

export function GroceryArbitrage() {
  const [prices, setPrices] = useState<GroceryPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchPrices() {
      const { data } = await supabase
        .from('grocery_prices' as any)
        .select('*')
        .order('scraped_at', { ascending: false })
        .limit(20);
      
      if (data) setPrices(data);
      setLoading(false);
    }
    fetchPrices();
  }, []);

  // Group by item and find best price
  const groups = prices.reduce((acc: any, curr) => {
    if (!acc[curr.item_name]) acc[curr.item_name] = [];
    acc[curr.item_name].push(curr);
    return acc;
  }, {});

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-heading font-black tracking-tighter uppercase italic text-foreground">
                Monroe Wallet <span className="text-emerald-500">Live</span>
            </h2>
            <Badge variant="outline" className="h-6 rounded-full border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-black text-[10px] tracking-widest uppercase py-0">
                Arbitrage Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-medium italic">
            "Stop overpaying. Real-time price tracking across Monroe's major grocers."
          </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groups).map(([item, items]: [string, any]) => {
          const sorted = [...items].sort((a, b) => a.price - b.price);
          const best = sorted[0];
          const runnerUp = sorted[1];
          const savings = runnerUp ? (runnerUp.price - best.price).toFixed(2) : null;

          return (
            <motion.div 
              key={item}
              whileHover={{ y: -4 }}
              className="group relative p-8 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800/50 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full group-hover:bg-emerald-500/20 transition-colors duration-1000" />
              
              <div className="relative flex flex-col h-full gap-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                        <ShoppingBasket className="w-3 h-3" />
                        Staple Comparison
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-white uppercase italic">{item}</h3>
                  </div>
                  {savings && (
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <TrendingDown className="w-3 h-3" />
                            Save ${savings}
                        </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-zinc-100 text-zinc-950 flex justify-between items-center shadow-lg transform group-hover:scale-[1.02] transition-transform duration-500">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Best Offer</span>
                            <span className="text-lg font-black italic uppercase leading-none">{best.store_name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-3xl font-black italic leading-none tracking-tighter">${best.price.toFixed(2)}</span>
                            <span className="text-[9px] font-black uppercase opacity-40">{best.unit}</span>
                        </div>
                    </div>

                    <div className="space-y-3 px-2">
                        {sorted.slice(1).map((other: any) => (
                            <div key={other.id} className="flex justify-between items-center text-xs font-bold text-muted-foreground/80">
                                <div className="flex items-center gap-2">
                                    <Store className="w-3 h-3 opacity-40" />
                                    <span>{other.store_name}</span>
                                </div>
                                <span>${other.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-zinc-800/50 flex justify-between items-center">
                    <SourceDrawer 
                        source="Direct Web Scrape"
                        confidence={0.95}
                        lastVerified={best.scraped_at}
                        rawData={items}
                    />
                    <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                        Loc: {best.store_location}
                    </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
