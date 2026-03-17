'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

interface Plan {
  name: string
  price: number
}

interface Subscription {
  status: string
  current_period_end: string
  plans: Plan
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const supabase = createClient()
  const t = useTranslations('subscription')
  const { locale } = useParams()

  useEffect(() => {
    loadSubscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSubscription() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: sub } = await supabase
      .from('tenant_subscriptions')
      .select('*, plans(*)')
      .eq('user_id', user.id)
      .single()

    setSubscription(sub as unknown as Subscription)
    setLoading(false)
  }

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center pt-8">Loading...</div>
  }

  const plan = subscription?.plans

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle>{t('currentPlan')}</CardTitle>
            <CardDescription>You are currently on the {plan?.name || t('freePlan')} plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{plan?.price ? `$${plan.price}/mo` : t('freePlan')}</span>
              <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'} className="px-3 py-1">
                {subscription?.status || t('active')}
              </Badge>
            </div>
            
            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-sm">
                <span>Next Billing Date</span>
                <span className="font-medium">
                  {subscription?.current_period_end 
                    ? new Date(subscription.current_period_end).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 border-t flex justify-between gap-4 p-6">
            <Button variant="outline" className="flex-1" onClick={() => window.open(`/${locale}/app/upgrade`)}>
              Change Plan
            </Button>
            <Button variant="ghost" size="icon" title="Refresh status" onClick={loadSubscription}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('usageLimits')}</CardTitle>
            <CardDescription>{t('monitorLimits')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Entities</span>
                <span>8 / 20</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '40%' }} />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly Transactions</span>
                <span>$1,240 / $5,000</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '25%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('featuresIncluded')}</CardTitle>
          <CardDescription>{t('featuresDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              'Basic Analytics',
              'Digital Menu builder',
              'Self-Invoicing Portal',
              'NFC Tag Routing',
              'Email Support',
              'Multi-currency Support'
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-4 p-4 rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50">
        <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">{t('needMorePower')}</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {t('upgradeDesc')}
          </p>
        </div>
      </div>
    </div>
  )
}
