import { getSessionWithProfile } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Users, MousePointer2, TrendingUp } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function LinkAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'analytics' })
  const { supabase, profile } = await getSessionWithProfile()

  // Fetch aggregate analytics
  const { data: events } = await supabase
    .from('analytics_events')
    .select('event_type, created_at')
    .eq('business_id', profile.business_id)

  const { data: totalLinks } = await supabase
    .from('entities')
    .select('id', { count: 'exact' })
    .eq('business_id', profile.business_id)
    .eq('type', 'link')

  const profileViews = events?.filter(e => e.event_type === 'profile_view').length || 0
  const linkClicks = events?.filter(e => e.event_type === 'link_click').length || 0
  const ctr = profileViews > 0 ? (linkClicks / profileViews) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle') || 'Real-time performance metrics for your digital assets.'}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('totalProfileViews') || 'Total Profile Views'}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileViews}</div>
            <p className="text-xs text-muted-foreground">+0% {t('fromLastMonth') || 'from last month'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('linkClicks') || 'Link Clicks'}</CardTitle>
            <MousePointer2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkClicks}</div>
            <p className="text-xs text-muted-foreground">+0% {t('fromLastMonth') || 'from last month'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('ctr') || 'Click-Through Rate (CTR)'}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ctr.toFixed(1)}%</div>
            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${Math.min(ctr, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('activeLinks') || 'Active Links'}</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLinks?.length || 0}</div>
            <Badge variant="outline" className="mt-1">{t('operational') || 'Operational'}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>{t('performanceOverview') || 'Performance Overview'}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center border-t">
          <p className="text-muted-foreground italic text-sm">
            {t('chartPlaceholder') || 'Interactive time-series charts powered by Recharts will load here as data accumulates.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
