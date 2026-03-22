import { getCouncilMeetings } from '@/lib/actions/council-meetings';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, PlayCircle, FileText, Clock, Video, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import PublicLayout from '@/components/public/PublicLayout';
import PublicHeader from '@/components/public/PublicHeader';

function isRecent(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 14;
}

export default async function CouncilMeetingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('councilMeetings');
  const result = await getCouncilMeetings(1, 50);

  const meetings = result.success ? result.data.meetings : [];
  const totalCount = result.success ? result.data.total : 0;

  // Stats
  const totalAgendaItems = meetings.reduce((sum, m) => sum + (m.summary?.agenda_items?.length ?? 0), 0);
  const totalDecisions = meetings.reduce((sum, m) => sum + (m.summary?.decisions?.length ?? 0), 0);
  const mostRecent = meetings[0]?.published_at;

  return (
    <PublicLayout locale={locale}>
      <PublicHeader locale={locale} />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
              {mostRecent && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  Latest meeting: {new Date(mostRecent).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Stats cards */}
        {meetings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-black">{totalCount}</p>
                  <p className="text-xs text-muted-foreground">Meetings</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-black">{totalAgendaItems}</p>
                  <p className="text-xs text-muted-foreground">Agenda Items</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-black">{totalDecisions}</p>
                  <p className="text-xs text-muted-foreground">Decisions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                  <PlayCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-black">{meetings.filter((m) => m.summary).length}</p>
                  <p className="text-xs text-muted-foreground">AI Summarized</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {meetings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">{t('noMeetings')}</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Council meeting recordings and AI-generated summaries will appear here once processed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const date = new Date(meeting.published_at);
              const agendaCount = meeting.summary?.agenda_items?.length ?? 0;
              const decisionsCount = meeting.summary?.decisions?.length ?? 0;
              const recent = isRecent(meeting.published_at);

              return (
                <Link
                  key={meeting.id}
                  href={`/${locale}/council-meetings/${meeting.id}`}
                  className="block group"
                >
                  <Card className="transition-all hover:shadow-lg hover:border-primary/30 overflow-hidden">
                    <CardContent className="flex gap-0 sm:gap-5 p-0 sm:p-4">
                      {/* Thumbnail */}
                      <div className="relative shrink-0">
                        {meeting.thumbnail_url ? (
                          <div className="relative overflow-hidden sm:rounded-xl">
                            <img
                              src={meeting.thumbnail_url}
                              alt=""
                              className="h-48 w-full object-cover sm:h-32 sm:w-56 group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Play overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                                <PlayCircle className="h-6 w-6 text-primary" />
                              </div>
                            </div>
                            {/* NEW badge */}
                            {recent && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-1.5 py-0.5 font-bold">
                                  NEW
                                </Badge>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="hidden sm:flex h-32 w-56 items-center justify-center rounded-xl bg-muted">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2.5 p-4 sm:p-0">
                        <div className="flex items-start gap-2">
                          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                            {meeting.title}
                          </CardTitle>
                          {recent && !meeting.thumbnail_url && (
                            <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-1.5 py-0.5 font-bold shrink-0">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {date.toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          {agendaCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="mr-1 h-3 w-3" />
                              {agendaCount} {t('agendaItems')}
                            </Badge>
                          )}
                          {decisionsCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {decisionsCount} {t('decisions')}
                            </Badge>
                          )}
                        </div>
                        {meeting.summary?.key_highlights?.[0] && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {meeting.summary.key_highlights[0]}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Data source attribution */}
        <footer className="mt-10 border-t pt-6">
          <p className="text-xs text-center text-muted-foreground">
            Meeting recordings sourced from the City of Monroe YouTube channel.
            AI summaries are generated from video transcripts for informational purposes.
            For official meeting records, contact the City Clerk&apos;s office.
          </p>
        </footer>
      </main>
    </PublicLayout>
  );
}
