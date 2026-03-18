import PublicLayout from '@/components/public/PublicLayout';
import PublicHeader from '@/components/public/PublicHeader';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import RecallsClient from '@/components/community/recalls-client';

const FDA_URL =
  'https://api.fda.gov/food/enforcement.json?search=state:"NC"+AND+status:"Ongoing"&sort=report_date:desc&limit=30';

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

async function fetchRecalls(): Promise<FDARecall[]> {
  const res = await fetch(FDA_URL, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`FDA API error: ${res.status}`);
  const data = await res.json();
  return data?.results ?? [];
}

export default async function RecallsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let recalls: FDARecall[] = [];
  let fetchError: string | null = null;

  try {
    recalls = await fetchRecalls();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load FDA recall data';
  }

  return (
    <PublicLayout locale={locale}>
      <PublicHeader locale={locale} />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">FDA Food Recalls</h1>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                Data refreshes every hour from FDA Enforcement Reports
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Active FDA food and drug enforcement recalls distributed in North Carolina.
            Recalls are classified by severity from Class I (most serious) to Class III (least serious).
          </p>
        </div>

        {fetchError ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">Unable to load recall data</p>
              <p className="text-sm text-muted-foreground mt-2">{fetchError}</p>
              <p className="text-xs text-muted-foreground mt-4">
                The FDA API may be temporarily unavailable. Please try again later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <RecallsClient recalls={recalls} locale={locale} />
        )}

        {/* Data source attribution */}
        <footer className="mt-10 border-t pt-6">
          <p className="text-xs text-center text-muted-foreground">
            Source:{' '}
            <a href="https://open.fda.gov/apis/food/enforcement/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              FDA Enforcement Reports API
            </a>
            {' '}| Data is provided for informational purposes only. For the most current recall information, visit the{' '}
            <a href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              FDA Safety Recalls page
            </a>.
          </p>
        </footer>
      </main>
    </PublicLayout>
  );
}
