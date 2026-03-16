import { getSessionWithProfile } from '@/lib/supabase/helpers'
import { CustomerTable } from '@/components/crm/customer-table'
import { CreateCustomerSheet } from '@/components/crm/create-customer-sheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function CRMPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { supabase, profile } = await getSessionWithProfile()
  const t = await getTranslations({ locale, namespace: 'crm' })

  // Verify module access
  const { data: moduleData } = await supabase
    .from('modules')
    .select('config')
    .eq('business_id', profile.business_id)
    .single()

  const config = moduleData?.config as Record<string, boolean> | undefined
  if (!config?.crm) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>{t('nativeCrm')}</CardTitle>
            <CardDescription>
              {t('nativeCrmDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{t('moduleInactive')}</p>
            <Link 
              href={`/${locale}/app/upgrade`} 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {t('upgradeToAccess')}
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch customers (RLS ensures we only get this tenant's customers)
  const { data: customers, error } = await supabase
    .from('crm_customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customers:', error)
  }

  const topLeads = (customers || []).filter(c => (c.lead_score || 0) >= 8)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <CreateCustomerSheet />
      </div>

      {topLeads.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2 border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <CardTitle className="text-sm font-medium text-emerald-800">{t('topLeads')}</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                {topLeads.length} {t('hot')}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topLeads.slice(0, 3).map(lead => (
                  <div key={lead.id} className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{lead.first_name} {lead.last_name}</span>
                      <span className="text-xs text-muted-foreground">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-600">{lead.lead_score}/10</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{lead.intent_category || 'LEAD'}</div>
                      </div>
                      <Link 
                        href={`/${locale}/app/crm/${lead.id}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-emerald-500/10 rounded"
                      >
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-emerald-500/10 bg-emerald-500/2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('leadDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-800">{(customers || []).length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('totalInPipeline')}
              </p>
              <div className="mt-4 h-2 w-full bg-emerald-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${(topLeads.length / (customers?.length || 1)) * 100}%` }}
                />
              </div>
              <p className="text-[10px] mt-2 text-muted-foreground italic">
                {Math.round((topLeads.length / (customers?.length || 1)) * 100)}% {t('highPriority')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <CustomerTable customers={customers || []} locale={locale} />
    </div>
  )
}
