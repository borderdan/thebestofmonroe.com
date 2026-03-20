'use client';

import Link from 'next/link';
import { Tag, TrendingDown, Store, ArrowRight, ShoppingBasket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GroceryPrice {
  id: string;
  store_name: string;
  item_name: string;
  price: number;
  unit: string;
  scraped_at: string;
}

export function PriceIntelPreview({
  locale,
  groceryPrices,
}: {
  locale: string;
  groceryPrices: GroceryPrice[];
}) {
  // Group by item and find best price per item
  const groups: Record<string, GroceryPrice[]> = {};
  for (const p of groceryPrices) {
    if (!groups[p.item_name]) groups[p.item_name] = [];
    groups[p.item_name].push(p);
  }

  // Pick top items with the biggest savings spread
  const itemSavings = Object.entries(groups)
    .map(([item, prices]) => {
      const sorted = [...prices].sort((a, b) => a.price - b.price);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      const savings = worst ? worst.price - best.price : 0;
      return { item, best, sorted, savings };
    })
    .filter(s => s.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-black tracking-tighter uppercase text-foreground">
            Price Intel
          </h2>
          <Badge
            variant="outline"
            className="h-6 rounded-full border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-black text-[10px] tracking-widest uppercase py-0"
          >
            {groceryPrices.length} prices tracked
          </Badge>
        </div>
        <Link
          href={`/${locale}/wallet/grocery`}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
        >
          Full Comparison <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <p className="text-sm text-muted-foreground max-w-xl">
        Biggest savings across Monroe&apos;s grocery stores right now.
        Open the full comparison to build your smart basket.
      </p>

      {/* Top savings cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itemSavings.map(({ item, best, sorted, savings }) => (
          <div
            key={item}
            className="group relative p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-1.5">
                  <ShoppingBasket className="w-2.5 h-2.5" />
                  {best.unit}
                </div>
                <h3 className="text-base font-bold text-white/90 mt-0.5">{item}</h3>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                <TrendingDown className="w-2.5 h-2.5" />
                Save ${savings.toFixed(2)}
              </div>
            </div>

            {/* Best price */}
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex justify-between items-center mb-2">
              <div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/60">Best</span>
                <div className="text-sm font-bold text-emerald-400">{best.store_name}</div>
              </div>
              <span className="text-xl font-black font-mono text-emerald-400">${best.price.toFixed(2)}</span>
            </div>

            {/* Other prices */}
            <div className="space-y-1">
              {sorted.slice(1).map((other) => (
                <div key={other.id} className="flex justify-between items-center text-[11px] text-white/40 px-1">
                  <div className="flex items-center gap-1.5">
                    <Store className="w-2.5 h-2.5 opacity-40" />
                    <span>{other.store_name}</span>
                  </div>
                  <span className="font-mono">${other.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <Link
          href={`/${locale}/wallet/grocery`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/20 transition-all"
        >
          <Tag className="h-3.5 w-3.5" />
          Compare All 36 Items Across 4 Stores
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
