'use client'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Calendar } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

export default function PricingPage() {
  const t = useTranslations('pricing')
  const { locale } = useParams()

  return (
    <div className="container mx-auto py-20 px-4 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-slate-900">
          {t('title')} <span className="text-sm font-bold bg-[#fce7f3] text-[#db2777] px-2 py-1 rounded-full uppercase ml-2 align-middle">B2B</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-brand-primary via-brand-primary/90 to-brand-accent text-white rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight" dangerouslySetInnerHTML={{ __html: t('intro') }} />
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-emerald-400 shrink-0" />
              <span className="text-lg text-white/90" dangerouslySetInnerHTML={{ __html: t('feature_1') }} />
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-emerald-400 shrink-0" />
              <span className="text-lg text-white/90" dangerouslySetInnerHTML={{ __html: t('feature_2') }} />
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-emerald-400 shrink-0" />
              <span className="text-lg text-white/90" dangerouslySetInnerHTML={{ __html: t('feature_3') }} />
            </li>
          </ul>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md text-slate-900 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
          <CardHeader className="text-center pb-2">
            <CardDescription className="uppercase tracking-widest font-bold text-slate-500 mb-2">{t('plan_name')}</CardDescription>
            <CardTitle className="text-5xl font-black mb-2">{t('price')} <span className="text-xl text-muted-foreground font-normal">{t('currency')}</span></CardTitle>
            <CardDescription className="text-base px-4">{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Link 
              href={`/${locale}/app/upgrade?source=pricing`}
              className={cn(buttonVariants({ size: 'lg' }), "w-full text-lg h-14 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-xl text-white shadow-md flex items-center justify-center")}
            >
              {t('cta')}
            </Link>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">{t('disclaimer')}</p>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-24 text-center">
        <h2 className="text-3xl font-bold mb-4 text-[#1e293b]">{t('demo_title')}</h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          {t('demo_desc')}
        </p>
        <Link 
          href="https://wa.me/5215545155705" 
          target="_blank" 
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: 'lg' }), "bg-[#25d366] hover:bg-[#20bd5a] text-white rounded-full px-8 h-14 text-lg shadow-lg flex items-center justify-center")}
        >
          <Calendar className="w-5 h-5 mr-2" /> {t('demo_cta')}
        </Link>
      </div>
    </div>
  )
}
