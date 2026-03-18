'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Calendar, ExternalLink, ChevronRight, ChevronDown,
  Search, FileText, ScrollText, AlertCircle, ListChecks,
} from 'lucide-react';
import Link from 'next/link';

type Agenda = {
  id: string;
  title: string;
  meeting_date: string;
  meeting_body: string | null;
  document_type: string | null;
  document_url: string | null;
  summary: { key_highlights?: string[]; agenda_items_count?: number; agenda_items?: unknown[] } | null;
  status: string | null;
};

const bodyColors: Record<string, { bg: string; dot: string }> = {
  'City Council': {
    bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  'Planning Board': {
    bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  'Board of Adjustment': {
    bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
};

const defaultBodyStyle = {
  bg: 'bg-muted text-muted-foreground',
  dot: 'bg-muted-foreground',
};

export default function AgendasClient({
  agendas,
  locale,
}: {
  agendas: Agenda[];
  locale: string;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedBodies, setExpandedBodies] = useState<Set<string>>(new Set(['all']));

  // Group by meeting body
  const grouped = useMemo(() => {
    const map = new Map<string, Agenda[]>();
    for (const a of agendas) {
      const body = a.meeting_body ?? 'Other';
      if (!map.has(body)) map.set(body, []);
      map.get(body)!.push(a);
    }
    return map;
  }, [agendas]);

  const bodies = useMemo(() => Array.from(grouped.keys()), [grouped]);

  const filtered = useMemo(() => {
    return agendas.filter((a) => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && a.document_type !== typeFilter) return false;
      return true;
    });
  }, [agendas, search, typeFilter]);

  const filteredGrouped = useMemo(() => {
    const map = new Map<string, Agenda[]>();
    for (const a of filtered) {
      const body = a.meeting_body ?? 'Other';
      if (!map.has(body)) map.set(body, []);
      map.get(body)!.push(a);
    }
    return map;
  }, [filtered]);

  const toggleBody = (body: string) => {
    setExpandedBodies((prev) => {
      const next = new Set(prev);
      if (next.has(body)) next.delete(body);
      else next.add(body);
      return next;
    });
  };

  // Stats
  const agendaCount = agendas.filter((a) => a.document_type === 'agenda').length;
  const minutesCount = agendas.filter((a) => a.document_type === 'minutes').length;
  const summarizedCount = agendas.filter((a) => a.status === 'completed').length;

  return (
    <>
      {/* Stats */}
      {agendas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-black">{agendaCount}</p>
                <p className="text-xs text-muted-foreground">Agendas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                <ScrollText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-black">{minutesCount}</p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                <ListChecks className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-black">{summarizedCount}</p>
                <p className="text-xs text-muted-foreground">AI Summarized</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-black">{bodies.length}</p>
                <p className="text-xs text-muted-foreground">Meeting Bodies</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {agendas.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agendas and minutes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="all">All Types</option>
            <option value="agenda">Agendas Only</option>
            <option value="minutes">Minutes Only</option>
          </select>
        </div>
      )}

      {/* Empty state */}
      {agendas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">No agenda documents available</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              City meeting agendas and minutes will appear here once ingested from the City of Monroe website.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No documents match your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(filteredGrouped.entries()).map(([body, docs]) => {
            const style = bodyColors[body] ?? defaultBodyStyle;
            const isExpanded = expandedBodies.has(body) || expandedBodies.has('all');

            return (
              <div key={body}>
                {/* Collapsible section header */}
                <button
                  onClick={() => toggleBody(body)}
                  className="flex w-full items-center gap-3 mb-3 group"
                >
                  <div className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                  <h2 className="text-lg font-bold tracking-tight">{body}</h2>
                  <Badge variant="secondary" className="text-xs">{docs.length}</Badge>
                  <div className="flex-1 border-t border-border/50" />
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                </button>

                {isExpanded && (
                  <div className="space-y-3 ml-5">
                    {docs.map((doc) => {
                      const highlights: string[] = doc.summary?.key_highlights ?? [];
                      const agendaItemsCount = doc.summary?.agenda_items_count ?? doc.summary?.agenda_items?.length ?? 0;
                      const isMinutes = doc.document_type === 'minutes';

                      return (
                        <Card
                          key={doc.id}
                          className={`hover:shadow-md transition-all ${isMinutes ? 'border-l-4 border-l-purple-400 dark:border-l-purple-600' : 'border-l-4 border-l-blue-400 dark:border-l-blue-600'}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <Badge
                                    variant={isMinutes ? 'secondary' : 'outline'}
                                    className="text-xs"
                                  >
                                    {isMinutes ? (
                                      <><ScrollText className="mr-1 h-3 w-3" />Minutes</>
                                    ) : (
                                      <><FileText className="mr-1 h-3 w-3" />Agenda</>
                                    )}
                                  </Badge>
                                  {doc.status === 'completed' && (
                                    <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">AI Summary</Badge>
                                  )}
                                  {agendaItemsCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {agendaItemsCount} item{agendaItemsCount !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                <p className="font-semibold text-sm leading-tight">{doc.title}</p>
                                <span className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(doc.meeting_date).toLocaleDateString(locale, {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                  })}
                                </span>
                                {highlights.length > 0 && (
                                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2 bg-muted/50 rounded-md px-3 py-2">
                                    {highlights[0]}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {doc.document_url && (
                                  <a
                                    href={doc.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                                    title="View original PDF"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                                {doc.status === 'completed' && (
                                  <Link
                                    href={`/${locale}/community/agendas/${doc.id}`}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
