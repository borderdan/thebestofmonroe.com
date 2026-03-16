'use client'

import { useState, useTransition } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateTenantSubscription, updateTenantBetaFeatures } from '@/lib/actions/admin'
import { ExternalLink, ShieldCheck, Zap } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  city: string
  subscription_tier: string
  created_at: string
  owners: { full_name: string }[]
}

interface TenantManagementProps {
  tenants: Tenant[]
}

export function TenantManagement({ tenants }: TenantManagementProps) {
  const [isPending, startTransition] = useTransition()

  const handleTierChange = (businessId: string, newTier: string) => {
    startTransition(async () => {
      try {
        await updateTenantSubscription(businessId, newTier)
        toast.success('Subscription updated')
      } catch (err: unknown) {
        toast.error((err as Error).message)
      }
    })
  }

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-950">
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Business</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Owner</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Plan</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Created</TableHead>
            <TableHead className="text-right text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors group">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-zinc-100">{tenant.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{tenant.slug} • {tenant.city}</span>
                </div>
              </TableCell>
              <TableCell>
                {tenant.owners?.[0] ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{tenant.owners[0].full_name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-600 italic">No Owner Found</span>
                )}
              </TableCell>
              <TableCell>
                <Select
                  defaultValue={tenant.subscription_tier}
                  onValueChange={(val) => handleTierChange(tenant.id, val || 'free')}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-8 w-28 bg-zinc-950 border-zinc-800 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-xs text-zinc-500">
                {new Date(tenant.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-emerald-500">
                    <ShieldCheck className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-blue-500">
                    <Zap className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
