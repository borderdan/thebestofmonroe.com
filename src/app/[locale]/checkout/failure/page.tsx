import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function CheckoutFailurePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('checkout')

  return (
    <div className="container max-w-lg py-20">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto bg-red-100 text-red-600 p-3 rounded-full mb-4 w-fit">
            <AlertCircle className="w-12 h-12" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
          <CardDescription>
            We could not process your payment at this time. Please try again or use a different payment method.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/${locale}/directory`} className={cn("inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-all bg-primary text-primary-foreground h-8 gap-1.5 px-2.5 w-full mt-6")}>
            {t('returnToDirectory')}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

