import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UpdateStatusButton } from './_components/update-status-button';
import { UploadButton } from './_components/upload-button';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default async function VaultPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations('Vault');
  const supabase = await createClient();

  let query = supabase
    .from('vault_submissions')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (q) {
    query = query.or(`form_id.ilike.%${q}%,payload::text.ilike.%${q}%`);
  }

  const { data: submissions, error } = await query;

  if (error) {
    console.error('Error fetching submissions:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('recentSubmissions')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form className="relative flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t('searchPlaceholder')}
              className="h-10 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button type="submit" variant="secondary" size="sm">
              Buscar
            </Button>
          </form>
          <UploadButton label={t('upload')} />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('formId')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead className="max-w-[300px]">{t('data')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  {t('noSubmissions')}
                </TableCell>
              </TableRow>
            ) : (
              submissions?.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(new Date(sub.created_at!), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.form_id}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.status === 'new' ? 'default' : 'secondary'}>
                      {t(`status_${sub.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="bg-muted p-2 rounded text-xs font-mono overflow-auto max-h-[100px]">
                      <pre>{JSON.stringify(sub.payload, null, 2)}</pre>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <UpdateStatusButton id={sub.id} currentStatus={sub.status as 'new' | 'read' | 'archived'} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
