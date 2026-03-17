'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Edit, ExternalLink, Search, ArrowUpDown, ListCollapse, Trash2, Clock, CalendarDays, Plus } from 'lucide-react'
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
import { cn } from '@/lib/utils'

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
          <Button variant="outline" className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> {translations.getStarted}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center">
        <div className="relative w-full max-w-sm group">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={translations.searchPlaceholder}
            className="pl-8 bg-card/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-sm focus-visible:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="rounded-2xl border bg-card/30 backdrop-blur-md shadow-xl overflow-hidden border-white/10 dark:border-slate-800/50">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800/50">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="cursor-pointer font-bold h-12" onClick={() => handleSort('title')}>
                <div className="flex items-center text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest px-2">
                  {translations.title}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell cursor-pointer font-bold h-12" onClick={() => handleSort('description')}>
                <div className="flex items-center text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest px-2">
                  {translations.description}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-bold h-12" onClick={() => handleSort('fields_schema')}>
                <div className="flex items-center text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest px-2">
                  {translations.fields}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-bold h-12" onClick={() => handleSort('is_active')}>
                <div className="flex items-center text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest px-2">
                  {translations.status}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-bold h-12" onClick={() => handleSort('created_at')}>
                <div className="flex items-center text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest px-2">
                  {translations.created}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-bold h-12 hidden lg:table-cell" onClick={() => handleSort('updated_at')}>
                <div className="flex items-center text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest px-2">
                  Last Updated
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />
                </div>
              </TableHead>
              <TableHead className="text-right font-bold h-12 text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest px-4">{translations.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedForms.length > 0 ? (
              sortedForms.map((form) => (
                <TableRow key={form.id} className="group hover:bg-primary/5 transition-all duration-200 border-b border-slate-100/50 dark:border-slate-800/30">
                  <TableCell className="font-semibold py-4 px-4">
                    <Link href={`/${locale}/app/eforms/edit/${form.id}`} className="hover:text-primary transition-colors flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <ListCollapse className="w-4 h-4" />
                      </div>
                      {form.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground/80 max-w-[200px] truncate py-4 px-4 text-sm">
                    {form.description || <span className="italic opacity-30">No description</span>}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                      {form.fields_schema?.length || 0} FIELDS
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <Badge variant={form.is_active ? 'default' : 'secondary'} className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border-none shadow-sm",
                      form.is_active 
                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-emerald-500/10' 
                        : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'
                    )}>
                      {form.is_active ? translations.active : translations.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground/60 text-xs py-4 px-4 font-mono">
                    {format(new Date(form.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-muted-foreground/60 text-xs py-4 px-4 hidden lg:table-cell font-mono">
                    {format(new Date(form.updated_at || form.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right py-4 px-4">
                    <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-200">
                      <Link href={`/${locale}/forms/${form.id}`} target="_blank" title={translations.publicLink}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-full transition-transform hover:scale-110">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/${locale}/app/eforms/edit/${form.id}`} title={tCommon.edit}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-full transition-transform hover:scale-110">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-transform hover:scale-110"
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
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 opacity-50">
                    <Search className="w-8 h-8 mb-2" />
                    <p className="text-sm font-medium">{translations.noResults}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}