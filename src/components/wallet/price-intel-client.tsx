'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  Check,
  ShoppingCart,
  TrendingDown,
  MapPin,
  Store,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ExternalLink,
  Flame,
  LayoutGrid,
  Table2,
  Swords,
  Tag,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  Image,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/* ── Types ───────────────────────────────────────────────────────── */
interface GroceryPrice {
  id: string;
  store_name: string;
  store_location: string;
  item_name: string;
  category: string;
  price: number;
  unit: string;
  is_deal: boolean;
  deal_description: string | null;
  scraped_at: string;
  brand?: string;
  image_url?: string;
  source?: string;
  discount_pct?: number;
}

interface BasketItem {
  item_name: string;
  unit: string;
  qty: number;
}

/* ── Store metadata ──────────────────────────────────────────────── */
const storeInfo: Record<string, { color: string; bg: string; border: string; location: string; textColor: string }> = {
  'Walmart': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', location: '2406 W Roosevelt Blvd', textColor: '#60a5fa' },
  'Food Lion': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', location: '3016 W Hwy 74', textColor: '#f87171' },
  'ALDI': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', location: '2322 W Roosevelt Blvd', textColor: '#fbbf24' },
  'Aldi': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', location: '2322 W Roosevelt Blvd', textColor: '#fbbf24' },
  'Harris Teeter': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', location: '2125 W Roosevelt Blvd', textColor: '#34d399' },
  'Lidl': { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', location: '927 E Roosevelt Blvd', textColor: '#22d3ee' },
  'Publix': { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', location: '2143 Younts Rd', textColor: '#4ade80' },
  'Lowes Foods': { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', location: '2115 W Roosevelt Blvd', textColor: '#c084fc' },
};

const storeLogos: Record<string, string> = {
  'ALDI': 'https://images.wishabi.net/merchants/2353/1505910235/large',
  'Aldi': 'https://images.wishabi.net/merchants/2353/1505910235/large',
  'Food Lion': 'https://images.wishabi.net/merchants/2100/1400690672-2ae9ce5e-e107-11e3-b331-22000b220403/large',
  'Walmart': 'https://images.wishabi.net/merchants/2267/1400690716-34d1eab2-e107-11e3-b37f-22000b220403/large',
  'Lidl': 'https://images.wishabi.net/merchants/3187/1523963760/large',
  'Publix': 'https://images.wishabi.net/merchants/2056/1516110321/large',
  'Lowes Foods': 'https://images.wishabi.net/merchants/2145/1444338424/large',
};

const flyerLinks: Record<string, string> = {
  'ALDI': 'https://flipp.com/en-us/monroe-nc/flyer/aldi',
  'Aldi': 'https://flipp.com/en-us/monroe-nc/flyer/aldi',
  'Food Lion': 'https://flipp.com/en-us/monroe-nc/flyer/food-lion',
  'Walmart': 'https://flipp.com/en-us/monroe-nc/flyer/walmart',
  'Lidl': 'https://flipp.com/en-us/monroe-nc/flyer/lidl',
  'Publix': 'https://flipp.com/en-us/monroe-nc/flyer/publix',
  'Lowes Foods': 'https://flipp.com/en-us/monroe-nc/flyer/lowes-foods',
};

const categoryOrder = ['Dairy', 'Protein', 'Bakery', 'Produce', 'Pantry', 'Beverages', 'Frozen', 'Snacks'];

type ViewMode = 'deals' | 'compare' | 'store' | 'head2head' | 'categories';

/* ── Shared hooks / data ─────────────────────────────────────────── */
function usePriceData(prices: GroceryPrice[]) {
  const priceLookup = useMemo(() => {
    const lookup: Record<string, Record<string, GroceryPrice>> = {};
    for (const p of prices) {
      if (!lookup[p.item_name]) lookup[p.item_name] = {};
      lookup[p.item_name][p.store_name] = p;
    }
    return lookup;
  }, [prices]);

  const items = useMemo(() => {
    const itemMap = new Map<string, { name: string; category: string; unit: string }>();
    for (const p of prices) {
      if (!itemMap.has(p.item_name)) {
        itemMap.set(p.item_name, { name: p.item_name, category: p.category, unit: p.unit });
      }
    }
    return Array.from(itemMap.values());
  }, [prices]);

  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category).filter(Boolean))];
    return cats.sort((a, b) => {
      const ai = categoryOrder.indexOf(a);
      const bi = categoryOrder.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [items]);

  const bestPriceStore = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [item, storePrices] of Object.entries(priceLookup)) {
      let best = Infinity;
      let bestStore = '';
      for (const [store, data] of Object.entries(storePrices)) {
        if (data.price < best) { best = data.price; bestStore = store; }
      }
      map[item] = bestStore;
    }
    return map;
  }, [priceLookup]);

  return { priceLookup, items, categories, bestPriceStore };
}

/* ── Reusable: Product Card (for deals/category grid) ────────────── */
function ProductCard({
  item,
  priceLookup,
  bestPriceStore,
  onAdd,
  inBasket,
}: {
  item: { name: string; category: string; unit: string };
  priceLookup: Record<string, Record<string, GroceryPrice>>;
  bestPriceStore: Record<string, string>;
  onAdd: (name: string, unit: string) => void;
  inBasket: boolean;
}) {
  const itemPrices = priceLookup[item.name] || {};
  const allPrices = Object.values(itemPrices).map(p => p.price);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 1 ? Math.max(...allPrices) : minPrice;
  const savings = maxPrice - minPrice;
  const bestStore = bestPriceStore[item.name];
  const imageUrl = Object.values(itemPrices).find(p => p.image_url)?.image_url;
  const brand = Object.values(itemPrices).find(p => p.brand)?.brand;
  const isDeal = Object.values(itemPrices).some(p => p.is_deal);
  const bestInfo = storeInfo[bestStore] || storeInfo['Walmart'];
  const storesWithPrice = Object.keys(itemPrices);

  return (
    <div className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden">
      {/* Image area */}
      <div className="relative h-48 bg-white/[0.02] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="h-full w-full object-contain p-2"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <Image className="h-8 w-8 text-white/10" />
        )}
        {isDeal && (
          <div className="absolute top-2 left-2">
            <Badge className="text-[8px] h-4 bg-amber-500/90 text-black border-none font-black px-1.5">
              SALE
            </Badge>
          </div>
        )}
        {savings > 0.5 && (
          <div className="absolute top-2 right-2">
            <Badge className="text-[8px] h-4 bg-emerald-500/90 text-black border-none font-black px-1.5">
              SAVE ${savings.toFixed(2)}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white/80 leading-tight line-clamp-2">{item.name}</h3>
          {brand && <p className="text-[9px] text-white/30 mt-0.5 truncate">{brand}</p>}
        </div>

        {/* Best price highlight */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-emerald-400">${minPrice.toFixed(2)}</span>
              {savings > 0 && (
                <span className="text-[9px] font-mono text-white/25 line-through">${maxPrice.toFixed(2)}</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {storeLogos[bestStore] && (
                <img src={storeLogos[bestStore]} alt="" className="h-3.5 w-3.5 rounded-sm object-contain bg-white/10" />
              )}
              <span className={`text-[9px] font-bold ${bestInfo.color}`}>{bestStore}</span>
            </div>
          </div>
          <button
            onClick={() => onAdd(item.name, item.unit)}
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              inBasket
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/[0.06] text-white/30 hover:bg-white/[0.12] hover:text-white/60'
            }`}
          >
            {inBasket ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Available at stores */}
        <div className="flex gap-1 pt-1 border-t border-white/[0.04]">
          {storesWithPrice.map(store => {
            const info = storeInfo[store] || storeInfo['Walmart'];
            const isBest = store === bestStore;
            return (
              <div key={store} className="flex items-center gap-1" title={`${store}: $${itemPrices[store].price.toFixed(2)}`}>
                <span className={`text-[8px] font-mono ${isBest ? info.color : 'text-white/25'}`}>
                  ${itemPrices[store].price.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── VIEW: Deals Feed ────────────────────────────────────────────── */
function DealsView({
  prices, stores, priceLookup, items, bestPriceStore, basket, addToBasket, removeFromBasket
}: {
  prices: GroceryPrice[]; stores: string[];
  priceLookup: Record<string, Record<string, GroceryPrice>>;
  items: { name: string; category: string; unit: string }[];
  bestPriceStore: Record<string, string>;
  basket: BasketItem[]; addToBasket: (n: string, u: string) => void; removeFromBasket: (n: string) => void;
}) {
  const [storeFilter, setStoreFilter] = useState<string | null>(null);

  // Items sorted by number of stores carrying them (cross-store comparison value)
  // then by savings amount
  const dealItems = useMemo(() => {
    let list = items.map(item => {
      const storePrices = priceLookup[item.name] || {};
      const allPrices = Object.values(storePrices).map(p => p.price);
      const isDeal = Object.values(storePrices).some(p => p.is_deal);
      const savings = allPrices.length > 1 ? Math.max(...allPrices) - Math.min(...allPrices) : 0;
      const storeCount = Object.keys(storePrices).length;
      return { ...item, savings, isDeal, storeCount, minPrice: Math.min(...allPrices) };
    });

    if (storeFilter) {
      list = list.filter(item => priceLookup[item.name]?.[storeFilter]);
    }

    // Sort: deals first, then by savings
    list.sort((a, b) => {
      if (a.isDeal !== b.isDeal) return a.isDeal ? -1 : 1;
      return b.savings - a.savings;
    });

    return list.slice(0, 60);
  }, [items, priceLookup, storeFilter]);

  return (
    <div className="space-y-4">
      {/* Store filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setStoreFilter(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
            !storeFilter ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.03] text-white/40 border border-white/[0.06]'
          }`}
        >
          <Flame className="h-3 w-3" /> All Stores
        </button>
        {stores.map(store => {
          const info = storeInfo[store] || storeInfo['Walmart'];
          return (
            <button
              key={store}
              onClick={() => setStoreFilter(store === storeFilter ? null : store)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                storeFilter === store ? `${info.bg} ${info.color} border ${info.border}` : 'bg-white/[0.03] text-white/40 border border-white/[0.06]'
              }`}
            >
              {storeLogos[store] && <img src={storeLogos[store]} alt="" className="h-3.5 w-3.5 rounded-sm object-contain" />}
              {store}
            </button>
          );
        })}
      </div>

      {/* Deals grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dealItems.map(item => (
          <ProductCard
            key={item.name}
            item={item}
            priceLookup={priceLookup}
            bestPriceStore={bestPriceStore}
            onAdd={(name, unit) => basket.some(b => b.item_name === name) ? removeFromBasket(name) : addToBasket(name, unit)}
            inBasket={basket.some(b => b.item_name === item.name)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── VIEW: Store Mode ────────────────────────────────────────────── */
function StoreView({
  prices, stores, priceLookup, items, bestPriceStore, basket, addToBasket, removeFromBasket
}: {
  prices: GroceryPrice[]; stores: string[];
  priceLookup: Record<string, Record<string, GroceryPrice>>;
  items: { name: string; category: string; unit: string }[];
  bestPriceStore: Record<string, string>;
  basket: BasketItem[]; addToBasket: (n: string, u: string) => void; removeFromBasket: (n: string) => void;
}) {
  const [selectedStore, setSelectedStore] = useState(stores[0] || 'Walmart');
  const [sortMode, setSortMode] = useState<'price-asc' | 'price-desc' | 'name' | 'deals'>('deals');

  const storeItems = useMemo(() => {
    const list = prices
      .filter(p => p.store_name === selectedStore)
      .map(p => ({
        ...p,
        isCheapest: bestPriceStore[p.item_name] === selectedStore,
        storesAvailable: Object.keys(priceLookup[p.item_name] || {}).length,
      }));

    switch (sortMode) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'name': list.sort((a, b) => a.item_name.localeCompare(b.item_name)); break;
      case 'deals': list.sort((a, b) => {
        if (a.is_deal !== b.is_deal) return a.is_deal ? -1 : 1;
        if (a.isCheapest !== b.isCheapest) return a.isCheapest ? -1 : 1;
        return a.price - b.price;
      }); break;
    }
    return list;
  }, [prices, selectedStore, sortMode, bestPriceStore, priceLookup]);

  const info = storeInfo[selectedStore] || storeInfo['Walmart'];
  const dealCount = storeItems.filter(p => p.is_deal).length;
  const cheapestCount = storeItems.filter(p => p.isCheapest).length;

  return (
    <div className="space-y-4">
      {/* Store selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {stores.map(store => {
          const si = storeInfo[store] || storeInfo['Walmart'];
          const isSelected = store === selectedStore;
          return (
            <button
              key={store}
              onClick={() => setSelectedStore(store)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                isSelected ? `${si.bg} ${si.color} ${si.border} ring-1 ring-${si.textColor}` : 'bg-white/[0.02] text-white/40 border-white/[0.06] hover:bg-white/[0.04]'
              }`}
            >
              {storeLogos[store] && <img src={storeLogos[store]} alt="" className="h-5 w-5 rounded-md object-contain bg-white/10" />}
              <span className="text-xs font-bold">{store}</span>
            </button>
          );
        })}
      </div>

      {/* Store stats bar */}
      <div className="flex gap-4 items-center px-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black font-mono text-white/80">{storeItems.length}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Items<br />This Week</span>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-black font-mono ${info.color}`}>{dealCount}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">On<br />Sale</span>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black font-mono text-emerald-400">{cheapestCount}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Cheapest<br />vs Others</span>
        </div>
        <div className="flex-1" />
        {/* Sort controls */}
        <div className="flex gap-1.5">
          {(['deals', 'price-asc', 'price-desc', 'name'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                sortMode === mode ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
              }`}
            >
              {mode === 'deals' ? '🔥 Deals' : mode === 'price-asc' ? '$ Low' : mode === 'price-desc' ? '$ High' : 'A→Z'}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {storeItems.slice(0, 80).map(p => (
          <div
            key={p.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              p.is_deal ? `${info.border} ${info.bg}` : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'
            }`}
          >
            {p.image_url ? (
              <img src={p.image_url} alt={p.item_name} className="h-12 w-12 rounded-lg object-contain bg-white/5 flex-shrink-0" loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-white/[0.03] flex items-center justify-center flex-shrink-0">
                <Tag className="h-4 w-4 text-white/10" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white/80 truncate">{p.item_name}</p>
              {p.brand && <p className="text-[9px] text-white/25 truncate">{p.brand}</p>}
              <div className="flex items-center gap-2 mt-1">
                {p.is_deal && <Badge className="text-[7px] h-3.5 bg-amber-500/20 text-amber-400 border-none px-1">SALE</Badge>}
                {p.isCheapest && p.storesAvailable > 1 && (
                  <Badge className="text-[7px] h-3.5 bg-emerald-500/20 text-emerald-400 border-none px-1">CHEAPEST</Badge>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`text-base font-black font-mono ${p.isCheapest ? 'text-emerald-400' : 'text-white/70'}`}>
                ${p.price.toFixed(2)}
              </span>
              {p.discount_pct && p.discount_pct > 0 && (
                <p className="text-[8px] font-bold text-amber-400">-{p.discount_pct}%</p>
              )}
            </div>
            <button
              onClick={() => basket.some(b => b.item_name === p.item_name) ? removeFromBasket(p.item_name) : addToBasket(p.item_name, p.unit)}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                basket.some(b => b.item_name === p.item_name) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-white/20 hover:text-white/50'
              }`}
            >
              {basket.some(b => b.item_name === p.item_name) ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── VIEW: Head to Head ──────────────────────────────────────────── */
function HeadToHeadView({
  prices, stores, priceLookup, items, bestPriceStore, basket, addToBasket, removeFromBasket
}: {
  prices: GroceryPrice[]; stores: string[];
  priceLookup: Record<string, Record<string, GroceryPrice>>;
  items: { name: string; category: string; unit: string }[];
  bestPriceStore: Record<string, string>;
  basket: BasketItem[]; addToBasket: (n: string, u: string) => void; removeFromBasket: (n: string) => void;
}) {
  const [storeA, setStoreA] = useState(stores.includes('Food Lion') ? 'Food Lion' : stores[0]);
  const [storeB, setStoreB] = useState(stores.includes('Walmart') ? 'Walmart' : stores[1] || stores[0]);

  const comparison = useMemo(() => {
    // Items available at both stores
    const shared = items.filter(item => priceLookup[item.name]?.[storeA] && priceLookup[item.name]?.[storeB]);

    let aWins = 0, bWins = 0, ties = 0, totalSavingsA = 0, totalSavingsB = 0;

    const sorted = shared.map(item => {
      const priceA = priceLookup[item.name][storeA].price;
      const priceB = priceLookup[item.name][storeB].price;
      const diff = priceA - priceB;
      if (Math.abs(diff) < 0.01) ties++;
      else if (diff < 0) { aWins++; totalSavingsA += Math.abs(diff); }
      else { bWins++; totalSavingsB += Math.abs(diff); }
      return { ...item, priceA, priceB, diff, imageUrl: priceLookup[item.name][storeA]?.image_url || priceLookup[item.name][storeB]?.image_url };
    });

    sorted.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    return { shared: sorted, aWins, bWins, ties, totalSavingsA, totalSavingsB };
  }, [items, priceLookup, storeA, storeB]);

  const infoA = storeInfo[storeA] || storeInfo['Walmart'];
  const infoB = storeInfo[storeB] || storeInfo['Walmart'];

  return (
    <div className="space-y-4">
      {/* Store pickers */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <select
            value={storeA}
            onChange={e => setStoreA(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-bold text-white appearance-none cursor-pointer"
          >
            {stores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-white/20" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">VS</span>
        </div>
        <div className="flex-1">
          <select
            value={storeB}
            onChange={e => setStoreB(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-bold text-white appearance-none cursor-pointer"
          >
            {stores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-4 rounded-xl border ${infoA.border} ${infoA.bg} text-center`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            {storeLogos[storeA] && <img src={storeLogos[storeA]} alt="" className="h-5 w-5 rounded-md object-contain bg-white/10" />}
            <span className={`text-xs font-bold ${infoA.color}`}>{storeA}</span>
          </div>
          <div className={`text-3xl font-black font-mono ${infoA.color}`}>{comparison.aWins}</div>
          <div className="text-[9px] text-white/30 uppercase tracking-wider mt-1">Wins</div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1">Saves ${comparison.totalSavingsA.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
          <div className="text-xs font-bold text-white/30 mb-1">Shared Items</div>
          <div className="text-3xl font-black font-mono text-white/60">{comparison.shared.length}</div>
          <div className="text-[9px] text-white/30 uppercase tracking-wider mt-1">{comparison.ties} Ties</div>
        </div>
        <div className={`p-4 rounded-xl border ${infoB.border} ${infoB.bg} text-center`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            {storeLogos[storeB] && <img src={storeLogos[storeB]} alt="" className="h-5 w-5 rounded-md object-contain bg-white/10" />}
            <span className={`text-xs font-bold ${infoB.color}`}>{storeB}</span>
          </div>
          <div className={`text-3xl font-black font-mono ${infoB.color}`}>{comparison.bWins}</div>
          <div className="text-[9px] text-white/30 uppercase tracking-wider mt-1">Wins</div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1">Saves ${comparison.totalSavingsB.toFixed(2)}</div>
        </div>
      </div>

      {/* Items comparison - biggest differences first */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_60px_100px_40px] gap-0 bg-white/[0.03] border-b border-white/[0.06] px-4 py-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/30">Item</span>
          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${infoA.color} text-center`}>{storeA}</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/30 text-center">Diff</span>
          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${infoB.color} text-center`}>{storeB}</span>
          <span />
        </div>
        {comparison.shared.slice(0, 60).map((item, idx) => {
          const aWins = item.diff < -0.01;
          const bWins = item.diff > 0.01;
          const inBasket = basket.some(b => b.item_name === item.name);
          return (
            <div key={item.name} className={`grid grid-cols-[1fr_100px_60px_100px_40px] gap-0 px-4 py-2.5 items-center hover:bg-white/[0.02] transition-colors ${
              idx < comparison.shared.length - 1 ? 'border-b border-white/[0.04]' : ''
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="h-8 w-8 rounded-md object-contain bg-white/5 flex-shrink-0" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <span className="text-xs text-white/70 truncate">{item.name}</span>
              </div>
              <span className={`text-sm font-mono font-bold text-center ${aWins ? 'text-emerald-400' : 'text-white/50'}`}>
                ${item.priceA.toFixed(2)}
              </span>
              <span className={`text-[10px] font-mono font-bold text-center ${
                aWins ? infoA.color : bWins ? infoB.color : 'text-white/20'
              }`}>
                {Math.abs(item.diff) < 0.01 ? '—' : `$${Math.abs(item.diff).toFixed(2)}`}
              </span>
              <span className={`text-sm font-mono font-bold text-center ${bWins ? 'text-emerald-400' : 'text-white/50'}`}>
                ${item.priceB.toFixed(2)}
              </span>
              <button
                onClick={() => inBasket ? removeFromBasket(item.name) : addToBasket(item.name, item.unit)}
                className={`h-6 w-6 rounded-md flex items-center justify-center transition-all cursor-pointer mx-auto ${
                  inBasket ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-white/20 hover:text-white/50'
                }`}
              >
                {inBasket ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── VIEW: Category Browser ──────────────────────────────────────── */
function CategoryView({
  prices, stores, priceLookup, items, categories, bestPriceStore, basket, addToBasket, removeFromBasket
}: {
  prices: GroceryPrice[]; stores: string[]; categories: string[];
  priceLookup: Record<string, Record<string, GroceryPrice>>;
  items: { name: string; category: string; unit: string }[];
  bestPriceStore: Record<string, string>;
  basket: BasketItem[]; addToBasket: (n: string, u: string) => void; removeFromBasket: (n: string) => void;
}) {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Category stats
  const catStats = useMemo(() => {
    return categories.map(cat => {
      const catItems = items.filter(i => i.category === cat);
      const itemCount = catItems.length;
      const withDeals = catItems.filter(i => Object.values(priceLookup[i.name] || {}).some(p => p.is_deal)).length;
      const avgPrice = catItems.reduce((sum, i) => {
        const ps = Object.values(priceLookup[i.name] || {}).map(p => p.price);
        return sum + (ps.length ? Math.min(...ps) : 0);
      }, 0) / (itemCount || 1);
      // Get a sample image
      const sampleImage = catItems.find(i => Object.values(priceLookup[i.name] || {}).find(p => p.image_url));
      const imageUrl = sampleImage ? Object.values(priceLookup[sampleImage.name]).find(p => p.image_url)?.image_url : null;
      return { category: cat, itemCount, withDeals, avgPrice, imageUrl };
    });
  }, [categories, items, priceLookup]);

  const filteredItems = useMemo(() => {
    if (!selectedCat) return [];
    return items.filter(i => i.category === selectedCat).sort((a, b) => {
      const aMin = Math.min(...Object.values(priceLookup[a.name] || {}).map(p => p.price));
      const bMin = Math.min(...Object.values(priceLookup[b.name] || {}).map(p => p.price));
      return aMin - bMin;
    });
  }, [selectedCat, items, priceLookup]);

  if (selectedCat) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedCat(null)}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to categories
        </button>
        <h3 className="text-lg font-black uppercase tracking-wider text-white/80">{selectedCat}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map(item => (
            <ProductCard
              key={item.name}
              item={item}
              priceLookup={priceLookup}
              bestPriceStore={bestPriceStore}
              onAdd={(name, unit) => basket.some(b => b.item_name === name) ? removeFromBasket(name) : addToBasket(name, unit)}
              inBasket={basket.some(b => b.item_name === item.name)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {catStats.map(cat => (
        <button
          key={cat.category}
          onClick={() => setSelectedCat(cat.category)}
          className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden cursor-pointer text-left"
        >
          <div className="h-28 bg-white/[0.02] flex items-center justify-center overflow-hidden">
            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt={cat.category} className="h-full w-full object-contain p-4 opacity-60 group-hover:opacity-80 transition-opacity" loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <LayoutGrid className="h-10 w-10 text-white/10" />
            )}
          </div>
          <div className="p-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white/80">{cat.category || 'Other'}</h3>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] font-mono text-white/40">{cat.itemCount} items</span>
              {cat.withDeals > 0 && (
                <Badge className="text-[7px] h-3.5 bg-amber-500/20 text-amber-400 border-none px-1">{cat.withDeals} deals</Badge>
              )}
            </div>
            <p className="text-[10px] text-white/25 mt-1">From ${cat.avgPrice.toFixed(2)} avg</p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ── VIEW: Comparison Table (original) ───────────────────────────── */
function CompareView({
  prices, stores, priceLookup, items, categories, bestPriceStore, basket, addToBasket, removeFromBasket
}: {
  prices: GroceryPrice[]; stores: string[]; categories: string[];
  priceLookup: Record<string, Record<string, GroceryPrice>>;
  items: { name: string; category: string; unit: string }[];
  bestPriceStore: Record<string, string>;
  basket: BasketItem[]; addToBasket: (n: string, u: string) => void; removeFromBasket: (n: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'savings'>('name');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q) ||
        Object.values(priceLookup[i.name] || {}).some(p => p.brand?.toLowerCase().includes(q)));
    }
    if (selectedCategory) filtered = filtered.filter(i => i.category === selectedCategory);
    if (sortBy === 'savings') {
      filtered.sort((a, b) => {
        const ap = Object.values(priceLookup[a.name] || {}).map(p => p.price);
        const bp = Object.values(priceLookup[b.name] || {}).map(p => p.price);
        return (bp.length > 1 ? Math.max(...bp) - Math.min(...bp) : 0) - (ap.length > 1 ? Math.max(...ap) - Math.min(...ap) : 0);
      });
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [items, search, selectedCategory, sortBy, priceLookup]);

  useEffect(() => { setPage(0); }, [search, selectedCategory, sortBy]);
  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const paginatedItems = filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input type="text" placeholder="Search items or brands..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              !selectedCategory ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.03] text-white/40 border border-white/[0.06]'
            }`}>All</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                cat === selectedCategory ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.03] text-white/40 border border-white/[0.06]'
              }`}>{cat}</button>
          ))}
        </div>
        <button onClick={() => setSortBy(sortBy === 'name' ? 'savings' : 'name')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/60 transition-all cursor-pointer whitespace-nowrap">
          <ArrowUpDown className="h-3 w-3" /> {sortBy === 'name' ? 'A→Z' : '$ Savings'}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
        <div className="grid gap-0" style={{ gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${stores.length}, minmax(80px, 1fr)) 48px` }}>
          <div className="p-3 bg-white/[0.03] border-b border-r border-white/[0.06]">
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/30">Item</span>
          </div>
          {stores.map(store => {
            const info = storeInfo[store] || storeInfo['Walmart'];
            return (
              <div key={store} className="p-3 bg-white/[0.03] border-b border-r border-white/[0.06] text-center">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-[0.15em] ${info.color}`}>{store}</span>
              </div>
            );
          })}
          <div className="p-3 bg-white/[0.03] border-b border-white/[0.06]" />
        </div>
        {paginatedItems.map((item, idx) => {
          const itemPrices = priceLookup[item.name] || {};
          const bestStore = bestPriceStore[item.name];
          const allPrices = Object.values(itemPrices).map(p => p.price);
          const maxSavings = allPrices.length > 1 ? (Math.max(...allPrices) - Math.min(...allPrices)).toFixed(2) : null;
          const inBasket = basket.some(b => b.item_name === item.name);
          const imageUrl = Object.values(itemPrices).find(p => p.image_url)?.image_url;
          const brand = Object.values(itemPrices).find(p => p.brand)?.brand;
          return (
            <div key={item.name}
              className={`grid gap-0 group hover:bg-white/[0.02] transition-colors ${idx < paginatedItems.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
              style={{ gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${stores.length}, minmax(80px, 1fr)) 48px` }}>
              <div className="p-3 border-r border-white/[0.06] flex items-center gap-2">
                {imageUrl && <img src={imageUrl} alt={item.name} className="h-10 w-10 rounded-md object-contain flex-shrink-0 bg-white/5" loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white/80 truncate">{item.name}</span>
                  {brand && <span className="text-[9px] text-white/30 truncate">{brand}</span>}
                  <div className="flex items-center gap-2">
                    {item.unit && <span className="text-[9px] text-white/25 font-mono">per {item.unit}</span>}
                    {maxSavings && parseFloat(maxSavings) > 0 && (
                      <span className="text-[8px] font-mono font-bold text-emerald-400/60 flex items-center gap-0.5">
                        <TrendingDown className="h-2 w-2" />${maxSavings}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {stores.map(store => {
                const priceData = itemPrices[store];
                const isBest = store === bestStore && allPrices.length > 1;
                return (
                  <div key={store} className="p-3 border-r border-white/[0.06] flex items-center justify-center">
                    {priceData ? (
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-mono font-bold ${isBest ? 'text-emerald-400' : 'text-white/60'}`}>${priceData.price.toFixed(2)}</span>
                        {isBest && <span className="text-[7px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">Best</span>}
                        {priceData.is_deal && <Badge className="text-[7px] h-3.5 mt-0.5 bg-amber-500/20 text-amber-400 border-none px-1">Sale</Badge>}
                      </div>
                    ) : <span className="text-[10px] text-white/15 font-mono">—</span>}
                  </div>
                );
              })}
              <div className="p-3 flex items-center justify-center">
                <button onClick={() => inBasket ? removeFromBasket(item.name) : addToBasket(item.name, item.unit)}
                  className={`h-6 w-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                    inBasket ? 'bg-emerald-500/20 text-emerald-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-white/[0.04] text-white/20 hover:bg-white/[0.08] hover:text-white/50'
                  }`}>{inBasket ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-mono text-white/30">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] text-white/40 border border-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pn = totalPages <= 7 ? i : page < 3 ? i : page > totalPages - 4 ? totalPages - 7 + i : page - 3 + i;
              return (
                <button key={pn} onClick={() => setPage(pn)}
                  className={`w-7 h-7 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
                    page === pn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/[0.03] text-white/40 border border-white/[0.06]'
                  }`}>{pn + 1}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] text-white/40 border border-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ *
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════════ */
export default function PriceIntelClient({
  prices,
  stores,
  locale,
}: {
  prices: GroceryPrice[];
  stores: string[];
  locale: string;
}) {
  const [view, setView] = useState<ViewMode>('deals');
  const { priceLookup, items, categories, bestPriceStore } = usePriceData(prices);

  // Basket with localStorage persistence
  const [basket, setBasket] = useState<BasketItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try { const s = localStorage.getItem('price-intel-basket'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [showBasket, setShowBasket] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { const s = localStorage.getItem('price-intel-basket'); return s ? JSON.parse(s).length > 0 : false; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('price-intel-basket', JSON.stringify(basket)); } catch {}
  }, [basket]);

  const addToBasket = (name: string, unit: string) => {
    setBasket(prev => {
      const existing = prev.find(b => b.item_name === name);
      if (existing) return prev.map(b => b.item_name === name ? { ...b, qty: b.qty + 1 } : b);
      return [...prev, { item_name: name, unit, qty: 1 }];
    });
    setShowBasket(true);
  };
  const removeFromBasket = (name: string) => setBasket(prev => prev.filter(b => b.item_name !== name));
  const updateQty = (name: string, delta: number) =>
    setBasket(prev => prev.map(b => b.item_name !== name ? b : { ...b, qty: Math.max(1, b.qty + delta) }));

  // Basket totals
  const basketTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const store of stores) {
      let total = 0;
      for (const item of basket) {
        const price = priceLookup[item.item_name]?.[store]?.price;
        if (price !== undefined) total += price * item.qty;
      }
      totals[store] = total;
    }
    return totals;
  }, [basket, stores, priceLookup]);

  const cheapestBasketStore = useMemo(() => {
    if (basket.length === 0) return null;
    let min = Infinity, minStore = '';
    for (const [store, total] of Object.entries(basketTotals)) {
      if (total > 0 && total < min) { min = total; minStore = store; }
    }
    return minStore;
  }, [basketTotals, basket]);

  const smartSplit = useMemo(() => {
    if (basket.length < 2 || stores.length < 2) return null;
    const itemBest: Record<string, { store: string; price: number }> = {};
    for (const item of basket) {
      let best = Infinity, bestS = stores[0];
      for (const store of stores) {
        const p = priceLookup[item.item_name]?.[store]?.price;
        if (p !== undefined && p < best) { best = p; bestS = store; }
      }
      itemBest[item.item_name] = { store: bestS, price: best === Infinity ? 0 : best };
    }
    const storeItems: Record<string, { item: string; price: number; qty: number }[]> = {};
    let splitTotal = 0;
    for (const item of basket) {
      const b = itemBest[item.item_name];
      if (!storeItems[b.store]) storeItems[b.store] = [];
      storeItems[b.store].push({ item: item.item_name, price: b.price, qty: item.qty });
      splitTotal += b.price * item.qty;
    }
    const singleBest = Math.min(...Object.values(basketTotals).filter(t => t > 0));
    const savings = singleBest - splitTotal;
    return savings > 0.01 ? { storeItems, splitTotal, savings, singleBest } : null;
  }, [basket, stores, priceLookup, basketTotals]);

  const summaryStats = useMemo(() => {
    const totalItems = items.length;

    const uniqueDeals = new Set(
      prices.filter(p => p.is_deal).map(p => p.item_name)
    ).size;

    let totalSavings = 0;
    let savingsCount = 0;
    for (const storePrices of Object.values(priceLookup)) {
      const allPrices = Object.values(storePrices).map(p => p.price);
      if (allPrices.length >= 2) {
        totalSavings += Math.max(...allPrices) - Math.min(...allPrices);
        savingsCount++;
      }
    }
    const avgSavings = savingsCount > 0 ? totalSavings / savingsCount : 0;

    const storeWins: Record<string, number> = {};
    for (const store of Object.values(bestPriceStore)) {
      storeWins[store] = (storeWins[store] || 0) + 1;
    }
    let bestValueStore = stores[0] || 'Walmart';
    let maxWins = 0;
    for (const [store, wins] of Object.entries(storeWins)) {
      if (wins > maxWins) {
        maxWins = wins;
        bestValueStore = store;
      }
    }

    const catCount = categories.length;

    let lastUpdated = 'Unknown';
    if (prices.length > 0) {
      const latest = prices.reduce((max, p) => p.scraped_at > max ? p.scraped_at : max, prices[0].scraped_at);
      try {
        const d = new Date(latest);
        lastUpdated = d.toLocaleDateString(locale || 'en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      } catch {
        lastUpdated = 'Unknown';
      }
    }

    return { totalItems, uniqueDeals, avgSavings, bestValueStore, maxWins, catCount, lastUpdated };
  }, [items, prices, priceLookup, bestPriceStore, stores, categories, locale]);

  if (prices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Tag className="h-12 w-12 text-white/10 mb-4" />
        <h2 className="text-lg font-bold text-white/40 mb-2">No Price Data Available</h2>
        <p className="text-sm text-white/25 max-w-md">Price data for Monroe, NC grocery stores has not been loaded yet.</p>
      </div>
    );
  }

  const views: { key: ViewMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'deals', label: 'Deals', icon: <Flame className="h-3.5 w-3.5" />, desc: 'Best deals this week' },
    { key: 'store', label: 'By Store', icon: <Store className="h-3.5 w-3.5" />, desc: "One store at a time" },
    { key: 'head2head', label: 'Head to Head', icon: <Swords className="h-3.5 w-3.5" />, desc: 'Compare 2 stores' },
    { key: 'categories', label: 'Categories', icon: <LayoutGrid className="h-3.5 w-3.5" />, desc: 'Browse by aisle' },
    { key: 'compare', label: 'Full Table', icon: <Table2 className="h-3.5 w-3.5" />, desc: 'All stores side-by-side' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Statistics Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-emerald-400">{summaryStats.totalItems}</div>
            <div className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold">Items Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-amber-400 flex items-center justify-center gap-1">
              <Flame className="h-5 w-5" /> {summaryStats.uniqueDeals}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold">Active Deals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-emerald-400">${summaryStats.avgSavings.toFixed(2)}</div>
            <div className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold">Avg Savings</div>
          </div>
          <div className="text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 h-8">
              {storeLogos[summaryStats.bestValueStore] ? (
                <img src={storeLogos[summaryStats.bestValueStore]} alt={summaryStats.bestValueStore} className="h-6 w-6 rounded-md object-contain bg-white/10" loading="lazy" />
              ) : (
                <Store className={`h-6 w-6 ${storeInfo[summaryStats.bestValueStore]?.color || 'text-white'}`} />
              )}
              <span className={`text-sm font-black ${storeInfo[summaryStats.bestValueStore]?.color || 'text-white'}`}>{summaryStats.bestValueStore}</span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold flex flex-col items-center mt-1">
              <span>Best Value</span>
              <span className="text-[8px] opacity-70 lowercase">{summaryStats.maxWins} wins</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-cyan-400">{summaryStats.catCount}</div>
            <div className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold">Categories</div>
          </div>
          <div className="text-center flex flex-col items-center justify-center h-full">
            <div className="text-sm font-black text-gray-400 h-8 flex items-center">{summaryStats.lastUpdated}</div>
            <div className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold mt-1">Last Updated</div>
          </div>
        </div>
      </div>

      {/* Store cards strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {stores.map(store => {
          const info = storeInfo[store] || storeInfo['Walmart'];
          const count = prices.filter(p => p.store_name === store).length;
          const deals = prices.filter(p => p.store_name === store && p.is_deal).length;
          return (
            <div key={store} className={`p-2.5 rounded-xl border ${info.border} ${info.bg} backdrop-blur-sm`}>
              <div className="flex items-center gap-1.5 mb-1">
                {storeLogos[store] ? (
                  <img src={storeLogos[store]} alt={store} className="h-5 w-5 rounded-md object-contain bg-white/10" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : <Store className={`h-3.5 w-3.5 ${info.color}`} />}
                <span className={`text-[10px] font-bold ${info.color}`}>{store}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-white/35">{count} items</span>
                {deals > 0 && <Badge className="text-[7px] h-3.5 bg-emerald-500/20 text-emerald-400 border-none px-1">{deals}</Badge>}
              </div>
              {flyerLinks[store] && (
                <a href={flyerLinks[store]} target="_blank" rel="noopener noreferrer"
                  className={`mt-1.5 flex items-center gap-1 text-[8px] font-medium ${info.color} hover:underline`}>
                  Flyer <ExternalLink className="h-2 w-2" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* View mode tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto no-scrollbar">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              view === v.key
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/35 hover:text-white/55'
            }`}
          >
            {v.icon} {v.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Basket toggle */}
        <button
          onClick={() => setShowBasket(!showBasket)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
            showBasket ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/35 hover:text-white/55'
          }`}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {basket.length > 0 ? `Basket (${basket.length})` : 'Basket'}
        </button>
      </div>

      {/* Smart Basket Panel */}
      {showBasket && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] backdrop-blur-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">Smart Basket</span>
              <span className="text-[10px] text-white/30 font-mono">{basket.length} item{basket.length !== 1 ? 's' : ''}</span>
            </div>
            {basket.length > 0 && (
              <button onClick={() => setBasket([])} className="text-[10px] text-white/30 hover:text-red-400 transition-colors cursor-pointer">Clear all</button>
            )}
          </div>

          {basket.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">Click + on any item to add it to your basket.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {basket.map(item => (
                  <div key={item.item_name} className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.08]">
                    <span className="text-[10px] font-medium text-white/70">{item.item_name}</span>
                    <div className="flex items-center gap-0.5 ml-1">
                      <button onClick={() => updateQty(item.item_name, -1)} className="p-0.5 hover:text-white/80 text-white/30 cursor-pointer"><Minus className="h-2.5 w-2.5" /></button>
                      <span className="text-[10px] font-mono font-bold text-white/60 min-w-[14px] text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.item_name, 1)} className="p-0.5 hover:text-white/80 text-white/30 cursor-pointer"><Plus className="h-2.5 w-2.5" /></button>
                    </div>
                    <button onClick={() => removeFromBasket(item.item_name)} className="p-0.5 hover:text-red-400 text-white/20 ml-1 cursor-pointer"><Trash2 className="h-2.5 w-2.5" /></button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {stores.map(store => {
                  const total = basketTotals[store] || 0;
                  const info = storeInfo[store] || storeInfo['Walmart'];
                  const isCheapest = store === cheapestBasketStore;
                  return (
                    <div key={store} className={`p-3 rounded-lg border ${isCheapest ? 'border-emerald-500/40 bg-emerald-500/10' : `${info.border} ${info.bg}`}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {isCheapest && <Check className="h-3 w-3 text-emerald-400" />}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isCheapest ? 'text-emerald-400' : info.color}`}>{store}</span>
                      </div>
                      <div className={`text-xl font-black font-mono ${isCheapest ? 'text-emerald-400' : 'text-white/60'}`}>${total.toFixed(2)}</div>
                      {isCheapest && <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Best Single-Store</span>}
                    </div>
                  );
                })}
              </div>

              {smartSplit && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/[0.06] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-400">Split-Shop Optimizer</span>
                    <Badge className="text-[8px] h-4 bg-purple-500/20 text-purple-300 border-none">Save ${smartSplit.savings.toFixed(2)}</Badge>
                  </div>
                  <p className="text-[10px] text-white/40 mb-3">Buy from {Object.keys(smartSplit.storeItems).length} stores to save ${smartSplit.savings.toFixed(2)}.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(smartSplit.storeItems).map(([store, sitems]) => {
                      const info = storeInfo[store] || storeInfo['Walmart'];
                      const storeTotal = sitems.reduce((sum, i) => sum + i.price * i.qty, 0);
                      return (
                        <div key={store} className={`p-3 rounded-lg border ${info.border} ${info.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${info.color}`}>{store}</span>
                            <span className="text-sm font-mono font-bold text-white/60">${storeTotal.toFixed(2)}</span>
                          </div>
                          <div className="space-y-1">
                            {sitems.map(i => (
                              <div key={i.item} className="flex justify-between text-[10px] text-white/40">
                                <span className="truncate mr-2">{i.item} ×{i.qty}</span>
                                <span className="font-mono flex-shrink-0">${(i.price * i.qty).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Active View */}
      {view === 'deals' && (
        <DealsView prices={prices} stores={stores} priceLookup={priceLookup} items={items}
          bestPriceStore={bestPriceStore} basket={basket} addToBasket={addToBasket} removeFromBasket={removeFromBasket} />
      )}
      {view === 'store' && (
        <StoreView prices={prices} stores={stores} priceLookup={priceLookup} items={items}
          bestPriceStore={bestPriceStore} basket={basket} addToBasket={addToBasket} removeFromBasket={removeFromBasket} />
      )}
      {view === 'head2head' && (
        <HeadToHeadView prices={prices} stores={stores} priceLookup={priceLookup} items={items}
          bestPriceStore={bestPriceStore} basket={basket} addToBasket={addToBasket} removeFromBasket={removeFromBasket} />
      )}
      {view === 'categories' && (
        <CategoryView prices={prices} stores={stores} priceLookup={priceLookup} items={items} categories={categories}
          bestPriceStore={bestPriceStore} basket={basket} addToBasket={addToBasket} removeFromBasket={removeFromBasket} />
      )}
      {view === 'compare' && (
        <CompareView prices={prices} stores={stores} priceLookup={priceLookup} items={items} categories={categories}
          bestPriceStore={bestPriceStore} basket={basket} addToBasket={addToBasket} removeFromBasket={removeFromBasket} />
      )}
    </div>
  );
}
