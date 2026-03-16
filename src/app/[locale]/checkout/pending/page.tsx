import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ClearGuestCart } from '@/components/checkout/clear-guest-cart'

export default async function CheckoutPendingPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ payment_id?: string; external_reference?: string }>
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { payment_id, external_reference } = await searchParams
  const t = await getTranslations('checkout')

  return (
    <div className="container max-w-lg py-20">
      <ClearGuestCart />
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto bg-blue-100 text-blue-600 p-3 rounded-full mb-4 w-fit">
            <Clock className="w-12 h-12" />
          </div>
          <CardTitle className="text-2xl">Payment Pending</CardTitle>
          <CardDescription>
            Your payment is currently being processed by MercadoPago.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {payment_id && (
            <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('paymentId')}</span>
              <span className="font-mono font-medium">{payment_id}</span>
            </div>
          )}
          {external_reference && (
            <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('orderReference')}</span>
              <span className="font-mono font-medium">{external_reference}</span>
            </div>
          )}
          
          <Link href={`/${locale}/directory`} className={cn("inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-all bg-primary text-primary-foreground h-8 gap-1.5 px-2.5 w-full mt-6")}>
            {t('returnToDirectory')}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

