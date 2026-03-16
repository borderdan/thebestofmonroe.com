'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ExternalLink, Edit, Search, Plus } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function EFormsDataTable({ eforms, locale, t, tCommon }: { eforms: any[], locale: string, t: any, tCommon: any }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredForms = (eforms || []).filter((form) =>
    form.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    form.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder') || "Search forms..."}
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">{t('formTitle') || "Form Title"}</TableHead>
              <TableHead>{t('fields')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('created')}</TableHead>
              <TableHead className="text-right">{t('actions') || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredForms.length > 0 ? (
              filteredForms.map((form) => (
                <TableRow 
                  key={form.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    // Prevent navigation if clicking on actions
                    if ((e.target as HTMLElement).closest('.table-actions')) return;
                    router.push(`/${locale}/app/eforms/edit/${form.id}`);
                  }}
                >
                  <TableCell>
                    <div className="font-medium text-foreground">{form.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{form.description}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center bg-secondary text-secondary-foreground text-xs font-medium px-2 py-1 rounded-md">
                      {form.fields_schema?.length || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${form.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {form.is_active ? t('active') : t('inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(form.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right table-actions">
                    <div className="flex justify-end items-center gap-2">
                      <Link 
                        href={`/${locale}/forms/${form.id}`} 
                        target="_blank" 
                        title={t('publicLink')}
                        className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link 
                        href={`/${locale}/app/eforms/edit/${form.id}`} 
                        title={tCommon('edit')} 
                        className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {searchQuery ? (t('noResults') || "No matching forms found.") : (t('noForms') || "No EForms Created Yet")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
