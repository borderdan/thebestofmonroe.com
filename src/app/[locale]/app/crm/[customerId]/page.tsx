import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionWithProfile } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomerNotes } from '@/components/crm/customer-notes'
import { AiSummary } from './_components/ai-summary'
import { ArrowLeft, Mail, Phone, Coins, Star } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Note = Database['public']['Tables']['crm_notes']['Row'] & {
  users?: { full_name: string | null } | null
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; customerId: string }>
}) {
  const { locale, customerId } = await params
  const { supabase, profile } = await getSessionWithProfile()

  // Verify module access
  const { data: moduleData } = await supabase
    .from('modules')
    .select('config')
    .eq('business_id', profile.business_id)
    .single()

  const config = moduleData?.config as Record<string, boolean> | undefined
  if (!config?.crm) {
    notFound()
  }

  // Fetch customer details
  const { data: customer, error: customerError } = await supabase
    .from('crm_customers')
    .select('*')
    .eq('id', customerId)
    .single()

  if (customerError || !customer) {
    notFound()
  }

  // Fetch notes
  const { data: notes } = await supabase
    .from('crm_notes')
    .select(`
      id, content, created_at,
      users ( full_name )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  // Fetch loyalty history
  const { data: loyaltyHistory } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  // Fetch AI Insights
  const { generateCustomerInsights } = await import('@/lib/services/ai')
  const aiInsights = await generateCustomerInsights(customerId)
  
  const enrichedCustomer = {
    ...customer,
    ai_summary: aiInsights?.summary,
    lead_score: aiInsights?.risk_of_churn === 'Low' ? 9 : 5 // Mock scoring based on risk
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/app/crm`} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {customer.first_name} {customer.last_name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={
                customer.status === 'active' ? 'default' :
                customer.status === 'lead' ? 'secondary' : 'outline'
              }
            >
              {customer.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Added {new Date(customer.created_at || '').toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6 space-y-6">
          <AiSummary customer={enrichedCustomer} />
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${customer.email}`} className="hover:underline">
                      {customer.email}
                    </a>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${customer.phone}`} className="hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                )}
                {!customer.email && !customer.phone && (
                  <p className="text-sm text-muted-foreground">No contact information provided.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="loyalty" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                    <Star className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Current Balance</p>
                    <p className="text-3xl font-black text-emerald-900">{customer.loyalty_points || 0} pts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lifetime Earned</p>
                    <p className="text-3xl font-black text-primary">{customer.total_points_earned || 0} pts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Points Ledger</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {loyaltyHistory?.map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{entry.description}</span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase">{entry.type} • {new Date(entry.created_at!).toLocaleDateString()}</span>
                    </div>
                    <div className={`text-sm font-bold ${entry.points_change > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {entry.points_change > 0 ? '+' : ''}{entry.points_change} pts
                    </div>
                  </div>
                ))}
                {!loyaltyHistory?.length && (
                  <div className="p-10 text-center text-muted-foreground italic text-sm">
                    No loyalty activity recorded.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="mt-6">
          <CustomerNotes customerId={customerId} notes={(notes as unknown as Note[]) || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
