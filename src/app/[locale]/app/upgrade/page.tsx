import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Lock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UpgradePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ feature?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: 'Upgrade' })

  // Fallback to a generic translation if no specific feature key is passed
  const blockedFeature = resolvedSearchParams.feature || 'premium'

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <Card className="max-w-md w-full text-center shadow-lg border-muted">
        <CardHeader className="flex flex-col items-center space-y-4 pb-2">
          <div className="p-3 bg-muted rounded-full">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t('accessDenied')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('featureRequiresUpgrade', { feature: blockedFeature })}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-6 text-muted-foreground text-sm">
          {t('upgradeBenefits')}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Link href={`/${resolvedParams.locale}/app/settings/subscription`} className="w-full">
            <Button className="w-full h-11" size="lg">
              <Zap className="w-4 h-4 mr-2" />
              {t('viewPlans')}
            </Button>
          </Link>
          <Link href={`/${resolvedParams.locale}/app`} className="w-full">
            <Button variant="ghost" className="w-full">
              {t('returnToDashboard')}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
