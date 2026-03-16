'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Edit, ExternalLink, Search, ArrowUpDown, ListCollapse, Trash2, Clock, CalendarDays } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { deleteEForm } from '@/lib/actions/eforms'
import { toast } from 'sonner'

type EForm = {
  id: string
  title: string
  description: string
  fields_schema: any[]
  created_at: string
  updated_at: string
  is_active: boolean
}

interface EFormsClientProps {
  initialForms: EForm[]
  locale: string
  translations: {
    searchPlaceholder: string
    title: string
    description: string
    fields: string
    status: string
    created: string
    actions: string
    active: string
    inactive: string
    publicLink: string
    noResults: string
    noForms: string
    noFormsDesc: string
    getStarted: string
  }
  tCommon: {
    edit: string
  }
}

export function EFormsClient({ initialForms, locale, translations, tCommon }: EFormsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof EForm; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' })
  const [isPending, startTransition] = useTransition()

  const handleSort = (key: keyof EForm) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return
    }
    
    startTransition(async () => {
      const result = await deleteEForm(id)
      if (result.success) {
        toast.success('Form deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete form')
      }
    })
  }

  const filteredForms = initialForms.filter((form) =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedForms = [...filteredForms].sort((a, b) => {
    if (!sortConfig) return 0
    
    let aVal: any = a[sortConfig.key]
    let bVal: any = b[sortConfig.key]

    if (sortConfig.key === 'fields_schema') {
       aVal = a.fields_schema?.length || 0
       bVal = b.fields_schema?.length || 0
    }

    if (aVal < bVal) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (aVal > bVal) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

  if (initialForms.length === 0) {
    return (
      <div className="col-span-full text-center py-20 bg-muted/20 border-2 border-dashed rounded-xl">
        <ListCollapse className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold mb-2 text-slate-700">{translations.noForms}</h3>
        <p className="text-muted-foreground mb-6">{translations.noFormsDesc}</p>
        <Link href={`/${locale}/app/eforms/create`}>
          <Button variant="outline">{translations.getStarted}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={translations.searchPlaceholder}
            className="pl-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('title')}>
                <div className="flex items-center text-slate-700 dark:text-slate-300">
                  {translations.title}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell cursor-pointer font-semibold" onClick={() => handleSort('description')}>
                <div className="flex items-center text-slate-700 dark:text-slate-300">
                  {translations.description}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('fields_schema')}>
                <div className="flex items-center text-slate-700 dark:text-slate-300">
                  {translations.fields}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('is_active')}>
                <div className="flex items-center text-slate-700 dark:text-slate-300">
                  {translations.status}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('created_at')}>
                <div className="flex items-center text-slate-700 dark:text-slate-300">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5 opacity-50" />
                  {translations.created}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-semibold hidden lg:table-cell" onClick={() => handleSort('updated_at')}>
                <div className="flex items-center text-slate-700 dark:text-slate-300">
                  <Clock className="mr-1.5 h-3.5 w-3.5 opacity-50" />
                  Last Updated
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">{translations.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedForms.length > 0 ? (
              sortedForms.map((form) => (
                <TableRow key={form.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="font-medium">
                    <Link href={`/${locale}/app/eforms/edit/${form.id}`} className="hover:text-primary transition-colors">
                      {form.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                    {form.description || <span className="italic opacity-50">No description</span>}
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                      {form.fields_schema?.length || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={form.is_active ? 'default' : 'secondary'} className={form.is_active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold' : 'font-semibold'}>
                      {form.is_active ? translations.active : translations.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(form.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                    {format(new Date(form.updated_at || form.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/${locale}/forms/${form.id}`} target="_blank" title={translations.publicLink}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/${locale}/app/eforms/edit/${form.id}`} title={tCommon.edit}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-slate-100 dark:hover:bg-slate-800">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={() => handleDelete(form.id)}
                        disabled={isPending}
                        title="Delete Form"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {translations.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}