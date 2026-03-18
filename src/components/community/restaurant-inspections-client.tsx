'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Calendar, Search, AlertCircle, Building2 } from 'lucide-react';

type Inspection = {
  id: string;
  facility_id: string;
  name: string;
  address: string | null;
  city: string | null;
  score: number | null;
  grade: string | null;
  inspection_date: string;
  inspection_type: string | null;
  violations: unknown;
};

function gradeColor(grade: string | null) {
  if (!grade) return 'secondary';
  if (grade === 'A') return 'default';
  if (grade === 'B') return 'secondary';
  return 'destructive';
}

function scoreColor(score: number | null) {
  if (!score) return 'text-muted-foreground';
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 80) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function ScoreRing({ score, grade }: { score: number | null; grade: string | null }) {
  const pct = score ? Math.min(score, 100) : 0;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const strokeColor = score && score >= 90 ? '#22c55e' : score && score >= 80 ? '#eab308' : '#ef4444';

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg className="absolute inset-0" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={score ? strokeColor : '#888'}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 32 32)"
          className="transition-all duration-500"
        />
      </svg>
      <div className="text-center z-10">
        <span className={`text-lg font-black leading-none ${scoreColor(score)}`}>
          {score ?? '--'}
        </span>
        {grade && (
          <span className="block text-[10px] font-bold text-muted-foreground">{grade}</span>
        )}
      </div>
    </div>
  );
}

export default function RestaurantInspectionsClient({
  facilities,
  locale,
}: {
  facilities: Inspection[];
  locale: string;
}) {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const f of facilities) {
      if (f.city) set.add(f.city);
    }
    return Array.from(set).sort();
  }, [facilities]);

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (gradeFilter !== 'all' && f.grade !== gradeFilter) return false;
      if (cityFilter !== 'all' && f.city !== cityFilter) return false;
      return true;
    });
  }, [facilities, search, gradeFilter, cityFilter]);

  const gradeCount = (g: string) => facilities.filter((f) => f.grade === g).length;

  return (
    <>
      {/* Grade summary cards */}
      {facilities.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800/50">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15">
                <span className="text-xl font-black text-green-700 dark:text-green-400">A</span>
              </div>
              <p className="text-2xl font-black text-green-700 dark:text-green-400">{gradeCount('A')}</p>
              <p className="text-xs text-muted-foreground">Excellent</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800/50">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/15">
                <span className="text-xl font-black text-yellow-700 dark:text-yellow-400">B</span>
              </div>
              <p className="text-2xl font-black text-yellow-700 dark:text-yellow-400">{gradeCount('B')}</p>
              <p className="text-xs text-muted-foreground">Adequate</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800/50">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                <span className="text-xl font-black text-red-700 dark:text-red-400">C</span>
              </div>
              <p className="text-2xl font-black text-red-700 dark:text-red-400">{gradeCount('C')}</p>
              <p className="text-xs text-muted-foreground">Needs Improvement</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800/50">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
                <Building2 className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{facilities.length}</p>
              <p className="text-xs text-muted-foreground">Total Facilities</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {facilities.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="all">All Grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
            {cities.length > 1 && (
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="all">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      {facilities.length > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filtered.length} of {facilities.length} facilities
          {(search || gradeFilter !== 'all' || cityFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setGradeFilter('all'); setCityFilter('all'); }}
              className="ml-2 text-primary hover:underline text-sm"
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      {/* Facility list */}
      {facilities.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">No inspection data available</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Restaurant health inspection data will appear here once ingested from the NC Department of Health.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No restaurants match your filters</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const violations = Array.isArray(f.violations) ? f.violations : [];
            return (
              <Card key={f.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  <ScoreRing score={f.score} grade={f.grade} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold truncate">{f.name}</p>
                      {f.grade && (
                        <Badge variant={gradeColor(f.grade) as 'default' | 'secondary' | 'destructive'}>
                          Grade {f.grade}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      {f.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{f.city}
                        </span>
                      )}
                      {f.address && !f.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{f.address}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(f.inspection_date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {f.inspection_type && (
                        <Badge variant="outline" className="text-xs py-0">{f.inspection_type}</Badge>
                      )}
                    </div>
                    {violations.length > 0 && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                        {violations.length} violation{violations.length !== 1 ? 's' : ''} found
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
