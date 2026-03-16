'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Trash2, Eye } from 'lucide-react'
import { deleteCustomer } from '@/lib/actions/crm'
import { toast } from 'sonner'
import type { Database } from '@/lib/database.types'

type Customer = Database['public']['Tables']['crm_customers']['Row']

export function CustomerTable({ customers, locale }: { customers: Customer[], locale: string }) {
  const [search, setSearch] = useState('')
  const router = useRouter()
  const t = useTranslations('crm')

  const filtered = customers.filter(c => {
    const term = search.toLowerCase()
    return (
      c.first_name.toLowerCase().includes(term) ||
      c.last_name.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    )
  })

  const handleDelete = async (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      const res = await deleteCustomer(id)
      if (res.success) {
        toast.success(t('deleteSuccess'))
        router.refresh()
      } else {
        toast.error(t('deleteError'))
      }
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder={t('searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('email')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('points')}</TableHead>
              <TableHead>{t('leadScore')}</TableHead>
              <TableHead>{t('intent')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {customer.first_name} {customer.last_name}
                  </TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.status === 'active' ? 'default' :
                        customer.status === 'lead' ? 'secondary' : 'outline'
                      }
                    >
                      {customer.status === 'active' ? t('statusActive') :
                       customer.status === 'lead' ? t('statusLead') : t('statusInactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs font-bold text-primary">
                      {customer.loyalty_points || 0} {t('pts')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.lead_score ? (
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${customer.lead_score >= 8 ? "text-emerald-500" : "text-amber-500"}`}>
                          {customer.lead_score}/10
                        </span>
                        {customer.lead_score >= 8 && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20">{t('hot')}</Badge>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">{t('pendingAi')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {customer.intent_category || t('new')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/${locale}/app/crm/${customer.id}`} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t('noCustomers')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
