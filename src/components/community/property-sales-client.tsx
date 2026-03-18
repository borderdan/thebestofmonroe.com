'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Calendar, Search, AlertCircle, DollarSign,
  TrendingUp, Home, ArrowUpDown, Ruler,
} from 'lucide-react';

type Sale = {
  id: string;
  address: string | null;
  parcel_id: string | null;
  sale_price: number | null;
  sale_date: string;
  property_type: string | null;
  sqft: number | null;
  year_built: number | null;
  buyer: string | null;
  seller: string | null;
};

function formatPrice(price: number | null) {
  if (!price) return '--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

function formatPricePerSqft(price: number | null, sqft: number | null) {
  if (!price || !sqft || sqft === 0) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price / sqft);
}

export default function PropertySalesClient({
  sales,
  locale,
}: {
  sales: Sale[];
  locale: string;
}) {
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  const filtered = useMemo(() => {
    const result = sales.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        const matchAddr = s.address?.toLowerCase().includes(q);
        const matchBuyer = s.buyer?.toLowerCase().includes(q);
        const matchSeller = s.seller?.toLowerCase().includes(q);
        if (!matchAddr && !matchBuyer && !matchSeller) return false;
      }
      if (priceRange !== 'all' && s.sale_price) {
        const [min, max] = priceRange.split('-').map(Number);
        if (s.sale_price < min) return false;
        if (max && s.sale_price > max) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') result.sort((a, b) => (a.sale_price ?? 0) - (b.sale_price ?? 0));
    else if (sortBy === 'price-desc') result.sort((a, b) => (b.sale_price ?? 0) - (a.sale_price ?? 0));
    // default: date (already sorted)

    return result;
  }, [sales, search, priceRange, sortBy]);

  // Stats
  const priced = sales.filter((s) => s.sale_price && s.sale_price > 0);
  const avgPrice = priced.length ? priced.reduce((sum, s) => sum + (s.sale_price ?? 0), 0) / priced.length : null;
  const medianPrice = priced.length ? (() => {
    const sorted = priced.map((s) => s.sale_price!).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  })() : null;
  const maxSale = priced.reduce((max, s) => (!max || (s.sale_price ?? 0) > (max.sale_price ?? 0) ? s : max), null as Sale | null);

  // Date range
  const dates = sales.map((s) => new Date(s.sale_date)).filter((d) => !isNaN(d.getTime()));
  const earliestDate = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null;
  const latestDate = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;

  // Avg price per sqft
  const withSqft = priced.filter((s) => s.sqft && s.sqft > 0);
  const avgPricePerSqft = withSqft.length
    ? withSqft.reduce((sum, s) => sum + (s.sale_price! / s.sqft!), 0) / withSqft.length
    : null;

  return (
    <>
      {/* Stats cards */}
      {sales.length > 0 && (
        <>
          {/* Date range banner */}
          {earliestDate && latestDate && (
            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Showing sales from {earliestDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })} to {latestDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-black">{formatPrice(avgPrice)}</p>
                  <p className="text-xs text-muted-foreground">Average Price</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <ArrowUpDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-black">{formatPrice(medianPrice)}</p>
                  <p className="text-xs text-muted-foreground">Median Price</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-black">{maxSale ? formatPrice(maxSale.sale_price) : '--'}</p>
                  <p className="text-xs text-muted-foreground">Highest Sale</p>
                </div>
              </CardContent>
            </Card>
            {avgPricePerSqft ? (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                    <Ruler className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-lg font-black">{formatPrice(avgPricePerSqft)}</p>
                    <p className="text-xs text-muted-foreground">Avg $/sqft</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                    <Home className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-lg font-black">{sales.length}</p>
                    <p className="text-xs text-muted-foreground">Recent Sales</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Filters */}
      {sales.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by address, buyer, or seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="all">All Prices</option>
              <option value="0-100000">Under $100K</option>
              <option value="100000-250000">$100K - $250K</option>
              <option value="250000-500000">$250K - $500K</option>
              <option value="500000-1000000">$500K - $1M</option>
              <option value="1000000-0">Over $1M</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="date">Newest First</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
            </select>
          </div>
        </div>
      )}

      {/* Results count */}
      {sales.length > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filtered.length} of {sales.length} sales
          {(search || priceRange !== 'all') && (
            <button
              onClick={() => { setSearch(''); setPriceRange('all'); setSortBy('date'); }}
              className="ml-2 text-primary hover:underline text-sm"
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      {/* Sales list */}
      {sales.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">No property sales data available</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Property sales records from Union County will appear here once the data has been ingested.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No sales match your filters</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or price range.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sale) => {
            const pricePerSqft = formatPricePerSqft(sale.sale_price, sale.sqft);
            return (
              <Card key={sale.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold truncate">{sale.address || `Parcel ${sale.parcel_id}`}</p>
                      <div className="text-right shrink-0">
                        <span className="font-black text-lg">{formatPrice(sale.sale_price)}</span>
                        {pricePerSqft && (
                          <p className="text-xs text-muted-foreground">{pricePerSqft}/sqft</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(sale.sale_date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {sale.property_type && <Badge variant="outline" className="text-xs py-0">{sale.property_type}</Badge>}
                      {sale.sqft && (
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3 w-3" />{sale.sqft.toLocaleString()} sqft
                        </span>
                      )}
                      {sale.year_built && <span>Built {sale.year_built}</span>}
                    </div>
                    {(sale.buyer || sale.seller) && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {sale.seller && <><span className="font-medium">From:</span> {sale.seller}</>}
                        {sale.seller && sale.buyer && ' → '}
                        {sale.buyer && <><span className="font-medium">To:</span> {sale.buyer}</>}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
