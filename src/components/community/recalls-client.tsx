'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle, Calendar, Package, Search, AlertCircle,
  ShieldAlert, ShieldCheck, Shield,
} from 'lucide-react';

type FDARecall = {
  recall_number: string;
  product_description: string;
  reason_for_recall: string;
  recalling_firm: string;
  report_date: string;
  classification: string;
  status: string;
  voluntary_mandated: string;
  distribution_pattern: string;
  product_quantity: string;
  city: string;
  state: string;
};

function classificationColor(cls: string): 'destructive' | 'secondary' | 'outline' {
  if (cls === 'Class I') return 'destructive';
  if (cls === 'Class II') return 'secondary';
  return 'outline';
}

function formatDate(dateStr: string, locale: string) {
  const formatted = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  return new Date(formatted).toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function RecallsClient({
  recalls,
  locale,
}: {
  recalls: FDARecall[];
  locale: string;
}) {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');

  const classI = recalls.filter((r) => r.classification === 'Class I');
  const classII = recalls.filter((r) => r.classification === 'Class II');
  const classIII = recalls.filter((r) => r.classification === 'Class III');

  const filtered = useMemo(() => {
    return recalls.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.product_description.toLowerCase().includes(q) &&
          !r.recalling_firm.toLowerCase().includes(q) &&
          !r.reason_for_recall.toLowerCase().includes(q)
        ) return false;
      }
      if (classFilter !== 'all' && r.classification !== classFilter) return false;
      return true;
    });
  }, [recalls, search, classFilter]);

  // Group filtered by classification
  const grouped = useMemo(() => {
    const map = new Map<string, FDARecall[]>();
    const order = ['Class I', 'Class II', 'Class III'];
    for (const cls of order) {
      const items = filtered.filter((r) => r.classification === cls);
      if (items.length > 0) map.set(cls, items);
    }
    // Any others
    const other = filtered.filter((r) => !order.includes(r.classification));
    if (other.length > 0) map.set('Other', other);
    return map;
  }, [filtered]);

  return (
    <>
      {/* Summary cards */}
      {recalls.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className={classI.length > 0 ? 'border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20' : ''}>
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-black text-red-700 dark:text-red-400">{classI.length}</p>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">Class I</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">High Risk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl font-black text-yellow-700 dark:text-yellow-400">{classII.length}</p>
              <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Class II</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Moderate Risk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-black text-green-700 dark:text-green-400">{classIII.length}</p>
              <p className="text-xs font-bold text-green-600 dark:text-green-400">Class III</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Low Risk</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Class I warning */}
      {classI.length > 0 && classFilter !== 'Class II' && classFilter !== 'Class III' && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                {classI.length} Class I recall{classI.length !== 1 ? 's' : ''} active in North Carolina
              </p>
              <p className="text-xs text-destructive/80 mt-0.5">
                Class I recalls involve products that may cause serious health consequences or death.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {recalls.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search recalls by product, firm, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="all">All Classifications</option>
            <option value="Class I">Class I - High Risk</option>
            <option value="Class II">Class II - Moderate Risk</option>
            <option value="Class III">Class III - Low Risk</option>
          </select>
        </div>
      )}

      {/* Results count */}
      {recalls.length > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filtered.length} of {recalls.length} recalls
          {(search || classFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setClassFilter('all'); }}
              className="ml-2 text-primary hover:underline text-sm"
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      {/* Empty states */}
      {recalls.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
              <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">No active recalls in NC</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              There are currently no active FDA food enforcement recalls distributed in North Carolina.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No recalls match your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([cls, items]) => (
            <div key={cls}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`h-2.5 w-2.5 rounded-full ${cls === 'Class I' ? 'bg-red-500' : cls === 'Class II' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                <h2 className="text-lg font-bold">{cls}</h2>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                <span className="text-xs text-muted-foreground">
                  {cls === 'Class I' ? '-- Products that may cause serious adverse health consequences or death' :
                   cls === 'Class II' ? '-- Products that may cause temporary or medically reversible adverse effects' :
                   '-- Products unlikely to cause adverse health consequences'}
                </span>
              </div>
              <div className="space-y-4 ml-5">
                {items.map((recall) => (
                  <Card
                    key={recall.recall_number}
                    className={`hover:shadow-md transition-shadow ${cls === 'Class I' ? 'border-l-4 border-l-red-500' : cls === 'Class II' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight">{recall.product_description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{recall.recalling_firm}{recall.city ? `, ${recall.city}` : ''}</p>
                        </div>
                        <Badge variant={classificationColor(recall.classification)} className="shrink-0 text-xs">
                          {recall.classification}
                        </Badge>
                      </div>

                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Reason for Recall</p>
                        <p className="text-sm">{recall.reason_for_recall}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(recall.report_date, locale)}
                        </span>
                        {recall.voluntary_mandated && (
                          <Badge variant="outline" className="text-xs">{recall.voluntary_mandated}</Badge>
                        )}
                        {recall.recall_number && (
                          <span className="font-mono text-xs">#{recall.recall_number}</span>
                        )}
                      </div>

                      {recall.distribution_pattern && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <Package className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{recall.distribution_pattern}</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
