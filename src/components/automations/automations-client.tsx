'use client'

import { useTranslations } from 'next-intl'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Plus, Zap, ShieldCheck, Search, ArrowUpDown, Trash2, Edit, CalendarDays, Link as LinkIcon } from 'lucide-react'
import { AutomationFormDialog } from '@/components/automations/automation-form-dialog'
import { AIAutomationGenerator } from '@/components/automations/ai-generator'
import { useState, useTransition } from 'react'
import type { AutomationConfig } from '@/lib/actions/automations'
import { deleteAutomationConfig } from '@/lib/actions/automations'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AutomationsClientProps {
  initialConfigs: AutomationConfig[]
  isSuperAdmin: boolean
}

export function AutomationsClient({ initialConfigs, isSuperAdmin }: AutomationsClientProps) {
  const t = useTranslations('automations')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<AutomationConfig | undefined>()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof AutomationConfig; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' })
  const [isPending, startTransition] = useTransition()

  const handleEdit = (config: AutomationConfig) => {
    setSelectedConfig(config)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedConfig(undefined)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirm_delete') || 'Are you sure you want to delete this automation?')) {
      return
    }
    
    startTransition(async () => {
      const result = await deleteAutomationConfig(id)
      if (result.success) {
        toast.success(t('delete_success') || 'Automation deleted')
      } else {
        toast.error(result.error || 'Failed to delete automation')
      }
    })
  }

  const handleSort = (key: keyof AutomationConfig) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const filteredConfigs = initialConfigs.filter((config) => {
    const title = t(`triggers.${config.trigger_type}.title`) || ''
    const desc = t(`triggers.${config.trigger_type}.desc`) || ''
    const term = searchTerm.toLowerCase()
    return (
      title.toLowerCase().includes(term) ||
      desc.toLowerCase().includes(term) ||
      config.webhook_url.toLowerCase().includes(term)
    )
  })

  const sortedConfigs = [...filteredConfigs].sort((a, b) => {
    if (!sortConfig) return 0
    
    const aVal: any = a[sortConfig.key] ?? ''
    const bVal: any = b[sortConfig.key] ?? ''

    if (aVal < bVal) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (aVal > bVal) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

  return (
    <div className="container max-w-6xl space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('title')}</h1>
          <p className="text-lg text-white/60">{t('description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <AIAutomationGenerator />
          <Button 
            onClick={handleCreate}
            className="bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('new_automation')}
          </Button>
        </div>
      </div>

      {isSuperAdmin && (
        <Card className="border-primary/20 bg-primary/5 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <CardTitle>{t('superadmin.title')}</CardTitle>
            </div>
            <CardDescription>{t('superadmin.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <a 
              href={process.env.NEXT_PUBLIC_N8N_URL || '#'} 
              target={process.env.NEXT_PUBLIC_N8N_URL ? "_blank" : undefined}
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!process.env.NEXT_PUBLIC_N8N_URL) {
                  e.preventDefault();
                  toast.error('Please configure NEXT_PUBLIC_N8N_URL in .env.local');
                }
              }}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                "w-full border-primary/20 hover:bg-primary/10 text-white"
              )}
            >
              <Zap className="h-4 w-4 mr-2" />
              {t('superadmin.open_n8n')}
            </a>
          </CardContent>
        </Card>
      )}

      {initialConfigs.length === 0 ? (
        <Card className="col-span-full border-dashed border-white/10 bg-transparent p-12 text-center rounded-xl border-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Zap className="h-8 w-8 text-white/20" />
          </div>
          <h3 className="mt-4 text-xl font-bold mb-2 text-white/80">{t('empty.title')}</h3>
          <p className="mt-2 text-white/40 max-w-sm mx-auto mb-6">{t('empty.desc')}</p>
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5" onClick={handleCreate}>
            Get Started
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search automations..."
                className="pl-8 bg-black/20 border-white/10 text-white placeholder:text-white/40 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('trigger_type')}>
                    <div className="flex items-center text-white/70">
                      Trigger Event
                      <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell cursor-pointer font-semibold" onClick={() => handleSort('webhook_url')}>
                    <div className="flex items-center text-white/70">
                      Webhook URL
                      <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('is_active')}>
                    <div className="flex items-center text-white/70">
                      Status
                      <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center text-white/70">
                      <CalendarDays className="mr-1.5 h-3.5 w-3.5 opacity-50" />
                      Created
                      <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-semibold text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedConfigs.length > 0 ? (
                  sortedConfigs.map((config) => (
                    <TableRow key={config.id} className="group hover:bg-white/5 border-white/5 transition-colors">
                      <TableCell className="font-medium">
                        <button onClick={() => handleEdit(config)} className="hover:text-primary text-white transition-colors text-left font-semibold">
                          {t(`triggers.${config.trigger_type}.title`)}
                        </button>
                        <p className="text-xs text-white/50 mt-1">{t(`triggers.${config.trigger_type}.desc`)}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-white/50 max-w-[250px] truncate font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{config.webhook_url}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.is_active ? 'default' : 'secondary'} className={config.is_active ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-semibold border-none' : 'bg-slate-500/20 text-slate-400 font-semibold border-none'}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/50 text-sm">
                        {format(new Date(config.created_at || new Date()), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                            onClick={() => handleEdit(config)}
                            title="Edit Automation"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={() => handleDelete(config.id)}
                            disabled={isPending}
                            title="Delete Automation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-white/50 border-white/5">
                      No matching automations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <AutomationFormDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        initialData={selectedConfig}
      />
    </div>
  )
}
