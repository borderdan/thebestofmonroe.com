import { getWorkflowExecutions } from '@/lib/actions/workflows'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Loader2, Zap } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Success' },
  failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
  queued: { icon: Clock, color: 'text-amber-400', label: 'Queued' },
  running: { icon: Loader2, color: 'text-blue-400', label: 'Running' },
}

export default async function WorkflowLogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const result = await getWorkflowExecutions()
  const executions = result.success ? result.data || [] : []

  return (
    <div className="container max-w-6xl space-y-8 p-8">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/app/workflows`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Execution Log</h1>
          <p className="text-white/60">History of all workflow executions</p>
        </div>
      </div>

      {executions.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-transparent p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Zap className="h-8 w-8 text-white/20" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white/80">No executions yet</h3>
          <p className="mt-2 text-white/40">
            Workflow executions will appear here as events are triggered.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {executions.map((exec: any) => {
            const status = STATUS_CONFIG[exec.status] || STATUS_CONFIG.queued
            const StatusIcon = status.icon
            return (
              <Card key={exec.id} className="border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <StatusIcon className={`w-5 h-5 ${status.color} shrink-0 ${exec.status === 'running' ? 'animate-spin' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold uppercase">
                        {exec.trigger_event}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 mt-0.5 truncate">
                      Workflow: {exec.workflow_id.slice(0, 8)}...
                      {exec.error_message && (
                        <span className="text-red-400 ml-2">Error: {exec.error_message}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-white/40">
                      {format(new Date(exec.created_at), 'MMM dd, HH:mm:ss')}
                    </div>
                    {exec.duration_ms !== null && (
                      <div className="text-[10px] text-white/20 mt-0.5">
                        {exec.duration_ms}ms
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
