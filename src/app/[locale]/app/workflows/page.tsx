import { getWorkflows } from '@/lib/actions/workflows'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, History } from 'lucide-react'
import { WorkflowsClient } from './workflows-client'

export default async function WorkflowsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const result = await getWorkflows()
  const workflows = result.success ? result.data || [] : []

  return (
    <div className="container max-w-6xl space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Workflows</h1>
          <p className="text-lg text-white/60">
            Build visual automation flows for your business
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/${locale}/app/workflows/logs`}>
            <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/5">
              <History className="mr-2 h-4 w-4" />
              Execution Log
            </Button>
          </Link>
          <Link href={`/${locale}/app/workflows/create`}>
            <Button className="bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </Link>
        </div>
      </div>

      <WorkflowsClient initialWorkflows={workflows} locale={locale} />
    </div>
  )
}
