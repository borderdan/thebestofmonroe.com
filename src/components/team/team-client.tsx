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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { UserPlus, Trash2, Shield, Loader2, Settings2 } from 'lucide-react'
import { updateUserRole, removeTeamMember, updateUserPermissions } from '@/lib/actions/team'
import { InviteDialog } from './invite-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

interface TeamMember {
  id: string
  full_name: string | null
  role: string
  created_at: string | null
  permissions: Record<string, boolean>
}

interface TeamClientProps {
  members: TeamMember[]
  currentUserId: string
  currentUserRole: string
}

const ROLE_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  owner: 'default',
  manager: 'secondary',
  staff: 'secondary',
}

const PERMISSION_LABELS: Record<string, string> = {
  can_refund: 'Process Refunds',
  can_edit_prices: 'Override Prices',
  can_view_reports: 'View Reports',
  can_manage_team: 'Manage Team',
  can_manage_inventory: 'Inventory Access'
}

export function TeamClient({ members, currentUserId, currentUserRole }: TeamClientProps) {
  const t = useTranslations('team')
  const { locale } = useParams()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isOwner = currentUserRole === 'owner'

  const handleRoleChange = (userId: string, newRole: string) => {
    startTransition(async () => {
      const result = await updateUserRole({ userId, newRole })
      if (result.success) {
        toast.success('Role updated successfully')
      } else {
        toast.error(result.error)
      }
    })
  }

  const handlePermissionToggle = (userId: string, perm: string, current: Record<string, boolean>) => {
    const updated = { ...current, [perm]: !current[perm] }
    startTransition(async () => {
      const res = await updateUserPermissions(userId, updated)
      if (res.success) toast.success('Permissions updated')
      else toast.error(res.error)
    })
  }

  const handleRemove = (userId: string, name: string) => {
    if (!confirm(t('remove_confirm', { name: name }))) return
    startTransition(async () => {
      const result = await removeTeamMember(userId)
      if (result.success) {
        toast.success('Team member removed')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('member_count', { count: members.length })}
        </p>
        {isOwner && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('invite')}
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('col_member')}</TableHead>
              <TableHead>{t('col_role')}</TableHead>
              <TableHead>{t('col_permissions')}</TableHead>
              <TableHead>{t('col_joined')}</TableHead>
              {isOwner && <TableHead className="text-right">{t('col_actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">
                        {(member.full_name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.full_name || 'Unnamed'}</p>
                      {member.id === currentUserId && (
                        <span className="text-xs text-muted-foreground">(you)</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {isOwner && member.id !== currentUserId ? (
                    <Select
                      defaultValue={member.role}
                      onValueChange={(val) => { if (val) handleRoleChange(member.id, val) }}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">
                          <span className="flex items-center gap-2">
                            <Shield className="h-3 w-3" /> {t('roles.owner')}
                          </span>
                        </SelectItem>
                        <SelectItem value="manager">{t('roles.manager')}</SelectItem>
                        <SelectItem value="staff">{t('roles.staff')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={ROLE_COLORS[member.role] || 'secondary'}>
                      {t(`roles.${member.role}`)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isOwner && member.id !== currentUserId ? (
                    <Popover>
                      <PopoverTrigger render={<Button variant="outline" size="sm" className="h-8 gap-2" />}>
                          <Settings2 className="h-3.5 w-3.5" />
                          {t('configure')}
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-4">
                        <div className="space-y-4">
                          <h4 className="font-medium leading-none text-sm">{t('permissions')}</h4>
                          <div className="grid gap-3">
                            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`${member.id}-${key}`}
                                  checked={!!member.permissions?.[key]}
                                  onCheckedChange={() => handlePermissionToggle(member.id, key, member.permissions || {})}
                                  disabled={isPending}
                                />
                                <Label htmlFor={`${member.id}-${key}`} className="text-xs">{label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(member.permissions || {}).filter(k => member.permissions[k]).slice(0, 2).map(k => (
                        <Badge key={k} variant="outline" className="text-[10px] py-0 px-1 capitalize">
                          {k.replace('can_', '').replace('_', ' ')}
                        </Badge>
                      ))}
                      {Object.keys(member.permissions || {}).filter(k => member.permissions[k]).length > 2 && (
                        <span className="text-[10px] text-muted-foreground">...</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.created_at
                    ? new Date(member.created_at).toLocaleDateString(locale as string, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </TableCell>
                {isOwner && (
                  <TableCell className="text-right">
                    {member.id !== currentUserId ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleRemove(member.id, member.full_name ?? 'this member')}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    ) : null}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  )
}
