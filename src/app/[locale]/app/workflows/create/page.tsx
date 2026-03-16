'use client'

import { useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BuilderProvider } from '@/components/workflows/builder/BuilderProvider'
import { Canvas } from '@/components/workflows/builder/Canvas'
import { NodePalette } from '@/components/workflows/builder/NodePalette'
import { NodeConfigPanel } from '@/components/workflows/builder/NodeConfigPanel'
import { compileWorkflowState } from '@/lib/utils/compile-workflow'
import { saveWorkflow } from '@/lib/actions/workflows'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Node, Edge } from '@xyflow/react'
import { AIWorkflowGenerator } from '@/components/workflows/builder/ai-generator'

export default function WorkflowCreatePage() {
  const router = useRouter()
  const { locale } = useParams()
  const [name, setName] = useState('Untitled Workflow')
  const [saving, setSaving] = useState(false)
  const [currentNodes, setCurrentNodes] = useState<Node[]>([])
  const [currentEdges, setCurrentEdges] = useState<Edge[]>([])

  const handleStateChange = useCallback((nodes: Node[], edges: Edge[]) => {
    setCurrentNodes(nodes)
    setCurrentEdges(edges)
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a workflow name')
      return
    }

    if (currentNodes.length === 0) {
      toast.error('Add at least one node to the canvas')
      return
    }

    try {
      const compiled = compileWorkflowState(currentNodes, currentEdges)
      setSaving(true)

      const result = await saveWorkflow({
        name,
        trigger_event: compiled.trigger_event,
        conditions: compiled.conditions as unknown as Record<string, unknown>[],
        actions: compiled.actions as unknown as Record<string, unknown>[],
        canvas_state: { nodes: currentNodes, edges: currentEdges },
      })

      if (result.success) {
        toast.success('Workflow created!')
        router.push(`/${locale as string}/app/workflows`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save workflow')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -mt-6 -mx-8 bg-slate-950">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/90 backdrop-blur-lg z-10">
        <div className="flex items-center gap-3">
          <Link href={`/${locale as string}/app/workflows`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-64 h-8 bg-white/5 border-white/10 text-white text-sm font-medium"
            placeholder="Workflow name..."
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || currentNodes.length === 0}
            className="bg-primary text-white h-8 gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save Workflow'}
          </Button>
        </div>
      </div>

      {/* Builder */}
      <div className="flex-1 overflow-hidden">
        <BuilderProvider>
          <NodePalette />
          <Canvas onStateChange={handleStateChange} />
          <NodeConfigPanel />
        </BuilderProvider>
      </div>
    </div>
  )
}
