import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { EFormsClient } from './eforms-client'

export default async function EFormsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const t = await getTranslations({ locale, namespace: 'eforms' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  const { data: eforms } = await supabase
    .from('eforms')
    .select('*')
    .order('created_at', { ascending: false })

  const translations = {
    searchPlaceholder: t('searchPlaceholder'),
    title: t('formTitle'),
    description: t('formDescription'),
    fields: t('fields'),
    status: t('status'),
    created: t('created'),
    actions: t('actions'),
    active: t('active'),
    inactive: t('inactive'),
    publicLink: t('publicLink'),
    noResults: t('noResults'),
    noForms: t('noForms'),
    noFormsDesc: t('noFormsDesc'),
    getStarted: t('getStarted')
  }

  const commonTranslations = {
    edit: tCommon('edit')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Link href={`/${locale}/app/eforms/create`}>
          <Button shadow-md="true">
            <Plus className="w-4 h-4 mr-2" /> {t('createForm')}
          </Button>
        </Link>
      </div>

      <EFormsClient 
        initialForms={eforms || []} 
        locale={locale} 
        translations={translations}
        tCommon={commonTranslations}
      />
    </div>
  )
}
