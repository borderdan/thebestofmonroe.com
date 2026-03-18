import { getCouncilMeeting } from '@/lib/actions/council-meetings';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink, CheckCircle, AlertCircle, Users, ListChecks } from 'lucide-react';
import Link from 'next/link';
import PublicLayout from '@/components/public/PublicLayout';
import PublicHeader from '@/components/public/PublicHeader';

export default async function CouncilMeetingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations('councilMeetings');
  const result = await getCouncilMeeting(id);

  if (!result.success) notFound();

  const meeting = result.data;
  const date = new Date(meeting.published_at);
  const summary = meeting.summary;

  return (
    <PublicLayout locale={locale}>
      <PublicHeader locale={locale} />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back link */}
        <Link
          href={`/${locale}/council-meetings`}
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t('backToMeetings')}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {meeting.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {date.toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <a
              href={meeting.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              {t('watchOnYouTube')}
            </a>
          </div>
        </div>

        {/* Embedded video */}
        <div className="mb-8 aspect-video overflow-hidden rounded-lg">
          <iframe
            src={`https://www.youtube.com/embed/${meeting.youtube_video_id}`}
            title={meeting.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        {summary && (
          <div className="space-y-6">
            {/* Key Highlights */}
            {summary.key_highlights?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    {t('keyHighlights')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.key_highlights.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Agenda Items */}
            {summary.agenda_items?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListChecks className="h-5 w-5" />
                    {t('agendaItemsTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal space-y-1 pl-5 text-sm">
                    {summary.agenda_items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Votes */}
            {summary.votes?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5" />
                    {t('votesTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.votes.map((vote, i) => (
                      <div key={i} className="rounded-md border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{vote.item}</p>
                          <Badge
                            variant={
                              vote.result.toLowerCase().includes('pass') ||
                              vote.result.toLowerCase().includes('approv')
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {vote.result}
                          </Badge>
                        </div>
                        {vote.details && (
                          <p className="mt-1 text-xs text-muted-foreground">{vote.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Decisions */}
            {summary.decisions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('decisionsTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.decisions.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Action Items */}
            {summary.action_items?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('actionItemsTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.action_items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Public Comments */}
            {summary.public_comments_summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    {t('publicCommentsTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{summary.public_comments_summary}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Full Transcript (collapsible) */}
        {meeting.transcript && (
          <details className="mt-8">
            <summary className="cursor-pointer text-lg font-semibold hover:text-primary">
              {t('fullTranscript')}
            </summary>
            <div className="mt-4 max-h-[600px] overflow-y-auto rounded-lg border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {meeting.transcript}
              </pre>
            </div>
          </details>
        )}
      </main>
    </PublicLayout>
  );
}
