'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Edit, Search, ArrowUpDown, Trash2, Clock, CalendarDays, Zap, Workflow as WorkflowIcon } from 'lucide-react'
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
import { deleteWorkflow, type Workflow } from '@/lib/actions/workflows'
import { toast } from 'sonner'

const TRIGGER_LABELS: Record<string, string> = {
  pos_sale_completed: 'POS Sale',
  eform_submission: 'E-Form Submission',
  crm_customer_new: 'New Customer',
  inventory_low: 'Inventory Low',
  invoice_issued: 'Invoice Issued',
}

interface WorkflowsClientProps {
  initialWorkflows: Workflow[]
  locale: string
}

export function WorkflowsClient({ initialWorkflows, locale }: WorkflowsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof Workflow; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' })
  const [isPending, startTransition] = useTransition()

  const handleSort = (key: keyof Workflow) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return
    }
    
    startTransition(async () => {
      const result = await deleteWorkflow(id)
      if (result.success) {
        toast.success('Workflow deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete workflow')
      }
    })
  }

  const filteredWorkflows = initialWorkflows.filter((wf) =>
    wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wf.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
    if (!sortConfig) return 0
    
    const aVal: any = a[sortConfig.key] ?? ''
    const bVal: any = b[sortConfig.key] ?? ''

    // Handle null values (already handled by ??, but keeping for safety if '' is expected)

    if (aVal < bVal) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (aVal > bVal) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

  if (initialWorkflows.length === 0) {
    return (
      <div className="col-span-full border-dashed border-white/10 bg-transparent p-12 text-center rounded-xl border-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
          <WorkflowIcon className="h-8 w-8 text-indigo-400" />
        </div>
        <h3 className="mt-4 text-xl font-bold mb-2 text-white/80">No workflows yet</h3>
        <p className="mt-2 text-white/40 max-w-sm mx-auto mb-6">
          Create your first visual workflow to automate business processes like sending alerts, generating invoices, or updating records.
        </p>
        <Link href={`/${locale}/app/workflows/create`}>
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
            Get Started
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search workflows..."
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
              <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('name')}>
                <div className="flex items-center text-white/70">
                  Name
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell cursor-pointer font-semibold" onClick={() => handleSort('description')}>
                <div className="flex items-center text-white/70">
                  Description
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('trigger_event')}>
                <div className="flex items-center text-white/70">
                  Trigger
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('is_active')}>
                <div className="flex items-center text-white/70">
                  Status
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer font-semibold hidden lg:table-cell" onClick={() => handleSort('last_triggered_at')}>
                <div className="flex items-center text-white/70">
                  <Clock className="mr-1.5 h-3.5 w-3.5 opacity-50" />
                  Last Triggered
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
            {sortedWorkflows.length > 0 ? (
              sortedWorkflows.map((wf) => (
                <TableRow key={wf.id} className="group hover:bg-white/5 border-white/5 transition-colors">
                  <TableCell className="font-medium">
                    <Link href={`/${locale}/app/workflows/edit/${wf.id}`} className="hover:text-primary text-white transition-colors">
                      {wf.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-white/50 max-w-[200px] truncate">
                    {wf.description || <span className="italic opacity-50">No description</span>}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                      <Zap className="w-3 h-3" />
                      {TRIGGER_LABELS[wf.trigger_event] || wf.trigger_event}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={wf.is_active ? 'default' : 'secondary'} className={wf.is_active ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-semibold border-none' : 'bg-slate-500/20 text-slate-400 font-semibold border-none'}>
                      {wf.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/50 text-sm hidden lg:table-cell">
                    {wf.last_triggered_at ? format(new Date(wf.last_triggered_at), 'MMM dd, HH:mm') : 'Never'}
                  </TableCell>
                  <TableCell className="text-white/50 text-sm">
                    {format(new Date(wf.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/${locale}/app/workflows/edit/${wf.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        onClick={() => handleDelete(wf.id)}
                        disabled={isPending}
                        title="Delete Workflow"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-white/50 border-white/5">
                  No matching workflows found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}