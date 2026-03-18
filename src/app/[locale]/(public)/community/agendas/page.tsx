import { createClient } from '@/lib/supabase/server';
import PublicLayout from '@/components/public/PublicLayout';
import PublicHeader from '@/components/public/PublicHeader';
import { FileText, Clock } from 'lucide-react';
import AgendasClient from '@/components/community/agendas-client';

export default async function CityAgendasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: agendas } = await supabase
    .from('city_agendas')
    .select('id, title, meeting_date, meeting_body, document_type, document_url, summary, status')
    .order('meeting_date', { ascending: false })
    .limit(50);

  const mostRecent = agendas?.[0]?.meeting_date;

  return (
    <PublicLayout locale={locale}>
      <PublicHeader locale={locale} />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">City Agendas & Minutes</h1>
              {mostRecent && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  Latest meeting: {new Date(mostRecent).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Meeting agendas and minutes from Monroe City Council, Planning Board, and other city bodies.
            Documents with AI summaries include key highlights and agenda item breakdowns.
          </p>
        </div>

        <AgendasClient agendas={agendas ?? []} locale={locale} />

        {/* Data source attribution */}
        <footer className="mt-10 border-t pt-6">
          <p className="text-xs text-center text-muted-foreground">
            Documents sourced from the City of Monroe, NC official meeting portal.
            AI summaries are generated for informational purposes and may not capture all details.
            Always refer to official documents for authoritative information.
          </p>
        </footer>
      </main>
    </PublicLayout>
  );
}
