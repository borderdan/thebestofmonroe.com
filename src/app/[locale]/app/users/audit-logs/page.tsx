import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Terminal, Shield } from 'lucide-react'

export default async function AuditLogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('business_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') return <div>Access Denied</div>

  const { data: logs } = await supabase
    .from('activity_log')
    .select(`
      *,
      user:users(full_name, email)
    `)
    .eq('business_id', profile.business_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Audit Logs</h1>
          <p className="text-muted-foreground">Trace sensitive actions and staff activities.</p>
        </div>
        <Badge variant="outline" className="h-8 gap-2 px-3">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          Tamper-Proof Ledger
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Network Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id} className="group">
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {format(new Date(log.created_at!), 'MMM d, HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{(log.user as { full_name: string, email: string })?.full_name || 'System'}</span>
                      <span className="text-[10px] text-muted-foreground">{(log.user as { full_name: string, email: string })?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                      {log.action.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="text-[11px] text-muted-foreground font-mono truncate group-hover:whitespace-normal group-hover:overflow-visible">
                      {JSON.stringify(log.metadata)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Terminal className="w-3 h-3" />
                        {log.ip_address || '0.0.0.0'}
                      </div>
                      <div className="text-[9px] text-muted-foreground truncate w-32" title={log.user_agent || ''}>
                        {log.user_agent}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!logs?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No activity recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
