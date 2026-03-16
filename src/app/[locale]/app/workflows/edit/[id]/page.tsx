'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BuilderProvider } from '@/components/workflows/builder/BuilderProvider'
import { Canvas } from '@/components/workflows/builder/Canvas'
import { NodePalette } from '@/components/workflows/builder/NodePalette'
import { NodeConfigPanel } from '@/components/workflows/builder/NodeConfigPanel'
import { compileWorkflowState } from '@/lib/utils/compile-workflow'
import { saveWorkflow, getWorkflow, deleteWorkflow, toggleWorkflow } from '@/lib/actions/workflows'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Node, Edge } from '@xyflow/react'

export default function WorkflowEditPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const id = params.id as string

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [initialNodes, setInitialNodes] = useState<Node[]>([])
  const [initialEdges, setInitialEdges] = useState<Edge[]>([])
  const [currentNodes, setCurrentNodes] = useState<Node[]>([])
  const [currentEdges, setCurrentEdges] = useState<Edge[]>([])

  useEffect(() => {
    async function load() {
      const result = await getWorkflow(id)
      if (result.success && result.data) {
        setName(result.data.name)
        setIsActive(result.data.is_active)
        const canvas = result.data.canvas_state as { nodes?: Node[]; edges?: Edge[] }
        if (canvas?.nodes) {
          setInitialNodes(canvas.nodes)
          setCurrentNodes(canvas.nodes)
        }
        if (canvas?.edges) {
          setInitialEdges(canvas.edges)
          setCurrentEdges(canvas.edges)
        }
      } else {
        toast.error('Workflow not found')
        router.push(`/${locale}/app/workflows`)
      }
      setLoading(false)
    }
    load()
  }, [id, locale, router])

  const handleStateChange = useCallback((nodes: Node[], edges: Edge[]) => {
    setCurrentNodes(nodes)
    setCurrentEdges(edges)
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a workflow name')
      return
    }

    try {
      const compiled = compileWorkflowState(currentNodes, currentEdges)
      setSaving(true)

      const result = await saveWorkflow({
        id,
        name,
        trigger_event: compiled.trigger_event,
        conditions: compiled.conditions as unknown as Record<string, unknown>[],
        actions: compiled.actions as unknown as Record<string, unknown>[],
        canvas_state: { nodes: currentNodes, edges: currentEdges },
      })

      if (result.success) {
        toast.success('Workflow saved!')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this workflow? This cannot be undone.')) return
    const result = await deleteWorkflow(id)
    if (result.success) {
      toast.success('Workflow deleted')
      router.push(`/${locale}/app/workflows`)
    } else {
      toast.error(result.error)
    }
  }

  const handleToggle = async (checked: boolean) => {
    setIsActive(checked)
    const result = await toggleWorkflow(id, checked)
    if (!result.success) {
      toast.error(result.error)
      setIsActive(!checked) // revert
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -mt-6 -mx-8 bg-slate-950">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/90 backdrop-blur-lg z-10">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/app/workflows`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-64 h-8 bg-white/5 border-white/10 text-white text-sm font-medium"
          />
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[10px] text-white/40 uppercase font-bold">Active</span>
            <Switch checked={isActive} onCheckedChange={handleToggle} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white h-8 gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Builder */}
      <div className="flex-1 overflow-hidden">
        <BuilderProvider>
          <NodePalette />
          <Canvas
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            onStateChange={handleStateChange}
          />
          <NodeConfigPanel />
        </BuilderProvider>
      </div>
    </div>
  )
}
