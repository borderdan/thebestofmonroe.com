'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, User, Sparkles, Loader2, CheckCircle2, XCircle, ChevronRight, Workflow, FormInput, Zap, ExternalLink, MessageSquare, Plus, Clock, Database, GripVertical, Trash2, Pencil, Copy, Eye } from 'lucide-react'
import { generateBlueprintSchema, deployBlueprintEForm, deployBlueprintWorkflow, deployBlueprintAutomation, type DeploymentLog, type BlueprintStep, type BlueprintStepType } from '@/lib/ai/generate-blueprint'
import { saveBlueprintDraft, updateBlueprintStatus, deleteBlueprint, type Blueprint } from '@/lib/actions/blueprints'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface BlueprintProposal {
  project_name: string
  description?: string
  steps: BlueprintStep[]
  eforms_to_create?: any[]
  workflows_to_create?: any[]
  automations_to_create?: any[]
}

function normalizeProposal(proposal: BlueprintProposal | null): BlueprintProposal | null {
  if (!proposal) return proposal
  if (proposal.steps) return proposal; // Already new format
  
  // Convert old format to new format
  const steps: BlueprintStep[] = []
  if (proposal.eforms_to_create) {
    proposal.eforms_to_create.forEach((f: Record<string, any>, i: number) => {
      steps.push({ id: `legacy-eform-${i}`, type: 'eform', title: f.title, description: f.description || 'E-Form', config: { fields: f.fields } })
    })
  }
  if (proposal.workflows_to_create) {
    proposal.workflows_to_create.forEach((w: Record<string, any>, i: number) => {
      steps.push({ id: `legacy-workflow-${i}`, type: 'workflow', title: w.name, description: 'Visual Workflow', config: { nodes: w.nodes, edges: w.edges } })
    })
  }
  if (proposal.automations_to_create) {
    proposal.automations_to_create.forEach((a: Record<string, any>, i: number) => {
      steps.push({ id: `legacy-automation-${i}`, type: 'automation', title: a.description || a.trigger_type, description: 'Webhook Automation', config: { trigger_type: a.trigger_type, suggested_webhook_url: a.suggested_webhook_url } })
    })
  }

  return { ...proposal, steps }
}

const STEP_TYPES = [
  { value: 'data_table', label: 'Data Table', icon: <Database className="w-3.5 h-3.5 text-blue-400" /> },
  { value: 'eform', label: 'E-Form', icon: <FormInput className="w-3.5 h-3.5 text-emerald-400" /> },
  { value: 'workflow', label: 'Workflow', icon: <Workflow className="w-3.5 h-3.5 text-violet-400" /> },
  { value: 'automation', label: 'Automation', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
] as const

const StepIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'eform': return <FormInput className="w-3.5 h-3.5 text-emerald-400" />
    case 'workflow': return <Workflow className="w-3.5 h-3.5 text-violet-400" />
    case 'automation': return <Zap className="w-3.5 h-3.5 text-amber-400" />
    case 'data_table': return <Database className="w-3.5 h-3.5 text-blue-400" />
    default: return null
  }
}

function SortableStepItem({ step, isDeployed, onRemove, onUpdate, onClone }: { step: BlueprintStep, isDeployed?: boolean, onRemove?: () => void, onUpdate?: (patch: { title?: string, description?: string, type?: string }) => void, onClone?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [editing, setEditing] = useState(false)
  const [showSchema, setShowSchema] = useState(false)
  const [editTitle, setEditTitle] = useState(step.title)
  const [editDesc, setEditDesc] = useState(step.description || '')
  const [editType, setEditType] = useState(step.type)

  const borderColor = ({
    eform: 'border-l-emerald-500/60',
    workflow: 'border-l-violet-500/60',
    automation: 'border-l-amber-500/60',
    data_table: 'border-l-blue-500/60',
  } as Record<string, string>)[editing ? editType : step.type] || 'border-l-white/20'

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className={cn("px-3 py-2.5 bg-slate-800/70 border border-indigo-500/20 rounded-lg mb-1.5 relative z-10 border-l-2 space-y-2", borderColor)}>
        <input
          autoFocus
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          className="w-full bg-slate-900/60 border border-white/10 rounded px-2 py-1 text-[13px] text-white/90 placeholder:text-white/30 outline-none focus:border-indigo-500/40"
          placeholder="Step title"
        />
        <input
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          className="w-full bg-slate-900/60 border border-white/10 rounded px-2 py-1 text-[11px] text-white/60 placeholder:text-white/20 outline-none focus:border-indigo-500/40"
          placeholder="Description (optional)"
        />
        <div className="flex gap-1.5">
          {STEP_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setEditType(t.value)}
              className={cn("flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors",
                editType === t.value ? "border-indigo-500/40 bg-indigo-500/10 text-white" : "border-white/[0.06] text-white/40 hover:text-white/70 hover:border-white/15"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-0.5">
          <button onClick={() => setEditing(false)} className="text-[11px] text-white/40 hover:text-white/70 px-2 py-0.5">Cancel</button>
          <button
            onClick={() => {
              onUpdate?.({ title: editTitle, description: editDesc, type: editType })
              setEditing(false)
            }}
            className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-0.5 rounded transition-colors"
          >Save</button>
        </div>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-center gap-2.5 px-3 py-2 bg-slate-800/50 border border-white/[0.06] rounded-lg group mb-1.5 relative z-10 hover:border-white/15 transition-colors border-l-2", borderColor)}>
      {!isDeployed && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 -ml-0.5">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}
      <StepIcon type={step.type} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-white/90 truncate leading-tight">{step.title}</div>
        {step.description && <div className="text-[11px] text-white/40 truncate leading-tight mt-0.5">{step.description}</div>}
      </div>
      <div className="text-[9px] uppercase font-bold tracking-wider text-white/25 shrink-0">
        {step.type.replace('_', ' ')}
      </div>
      {!isDeployed && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {step.type === 'data_table' && (
            <button 
              onClick={() => setShowSchema(!showSchema)} 
              className={cn("p-0.5 transition-colors", showSchema ? "text-indigo-400" : "text-white/20 hover:text-indigo-400")}
              title="Preview schema"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          {onUpdate && (
            <button onClick={() => { setEditTitle(step.title); setEditDesc(step.description || ''); setEditType(step.type); setEditing(true) }} className="text-white/20 hover:text-indigo-400 p-0.5" title="Edit step">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onClone && (
            <button onClick={onClone} className="text-white/20 hover:text-sky-400 p-0.5" title="Duplicate step">
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="text-white/20 hover:text-rose-400 p-0.5" title="Remove step">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      {showSchema && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-slate-900 border border-indigo-500/20 rounded shadow-xl z-50 animate-in fade-in slide-in-from-top-1">
          <div className="text-[9px] uppercase font-bold text-white/30 mb-1">Schema Preview</div>
          <pre className="text-[10px] text-indigo-300 font-mono leading-tight max-h-32 overflow-auto bg-black/20 p-1.5 rounded">
            {JSON.stringify(step.config || { fields: [] }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  logs?: DeploymentLog[]
  proposal?: BlueprintProposal | null
  blueprintId?: string
  isDeployed?: boolean
}

export function ArchitectClient({ initialBlueprints }: { initialBlueprints: Blueprint[] }) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>(initialBlueprints)
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAddStepForMsg, setShowAddStepForMsg] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // const t = useTranslations('architect')

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent, messageId: string) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.proposal?.steps) {
          const oldIndex = msg.proposal.steps.findIndex((s: BlueprintStep) => s.id === active.id)
          const newIndex = msg.proposal.steps.findIndex((s: BlueprintStep) => s.id === over.id)
          return {
            ...msg,
            proposal: {
              ...msg.proposal,
              steps: arrayMove(msg.proposal.steps, oldIndex, newIndex)
            }
          }
        }
        return msg
      }))
      autoSaveDraft(messageId)
    }
  }

  // If selecting a past blueprint, show it magically
  const handleSelectBlueprint = (bp: Blueprint) => {
    setActiveBlueprintId(bp.id)
    setMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Loaded Architecture: ${bp.name}`,
      timestamp: new Date(bp.updated_at),
      proposal: normalizeProposal(bp.content),
      blueprintId: bp.id,
      isDeployed: bp.status === 'deployed'
    }])
  }

  const startNewSession = () => {
    setActiveBlueprintId(null)
    setMessages([])
    setInput('')
  }

  // ── Blueprint Deletion ──
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const handleDeleteBlueprint = async (bpId: string) => {
    if (confirmDeleteId !== bpId) {
      setConfirmDeleteId(bpId)
      return // First click sets confirmation state
    }
    // Second click: actually delete
    const res = await deleteBlueprint(bpId)
    if (res.success) {
      setBlueprints(prev => prev.filter(b => b.id !== bpId))
      if (activeBlueprintId === bpId) startNewSession()
    }
    setConfirmDeleteId(null)
  }

  // ── Auto-save when pipeline is manually modified ──
  const autoSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSaveDraft = (messageId: string) => {
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current)
    autoSaveTimeout.current = setTimeout(() => {
      const msg = messages.find(m => m.id === messageId)
      if (msg?.proposal && msg.blueprintId) {
        saveBlueprintDraft(msg.proposal.project_name, msg.proposal, msg.blueprintId)
      }
    }, 1500)
  }

  // ── Deployment progress ──
  const [deployProgress, setDeployProgress] = useState<{ current: number; total: number } | null>(null)

  // ── Inline project name editing ──
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null)
  const [projectNameDraft, setProjectNameDraft] = useState('')

  const handleTemplateClick = (prompt: string) => {
    setInput(prompt)
  }

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)

    const aiMessageId = crypto.randomUUID()
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: 'I am drafting the architecture blueprint based on your request...',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, aiMessage])

    try {
      // Pass chat history for conversational multi-turn
      const history = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
      
      const result = await generateBlueprintSchema(history)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate blueprint')
      }

      const proposal = normalizeProposal(result.data)
      if (!proposal) throw new Error('Failed to normalize blueprint proposal')

      // Automatically save as draft
      const draftRes = await saveBlueprintDraft(proposal.project_name, proposal)
      if (draftRes.success && draftRes.data) {
        const newBlueprint: Blueprint = {
           id: draftRes.data.id,
           business_id: '', // Will be refreshed on reload, just stubbing for UI
           name: proposal.project_name,
           description: null,
           status: 'draft',
           content: proposal,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString()
        }
        setBlueprints(prev => [newBlueprint, ...prev])
        setActiveBlueprintId(draftRes.data!.id)

        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: `Here is the architecture blueprint for "${proposal.project_name}". Please review the proposed components below, and click "Approve & Deploy" when you're ready, or tell me what to change.`,
                proposal: proposal,
                blueprintId: draftRes.data!.id,
                isDeployed: false
              }
            : msg
        ))
      } else {
        throw new Error('Failed to save draft.')
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              content: `I encountered an error while trying to build your architecture: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }
          : msg
      ))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeploy = async (msgId: string, bpId: string, proposal: BlueprintProposal) => {
    setIsGenerating(true)

    // Helper to push a log
    const appendLog = (type: DeploymentLog['type'], message: string, status: DeploymentLog['status'] = 'success', metadata?: Record<string, any>): string => {
      const newLog: DeploymentLog = { id: crypto.randomUUID(), type, message, status, metadata }
      setMessages(prev => prev.map(msg => 
        msg.id === msgId 
          ? { ...msg, logs: [...(msg.logs || []), newLog] }
          : msg
      ))
      return newLog.id
    }

    const updateLog = (logId: string, status: DeploymentLog['status'], message?: string, metadata?: Record<string, any>) => {
      setMessages(prev => prev.map(msg => 
        msg.id === msgId 
          ? { 
              ...msg, 
              logs: (msg.logs || []).map(l => l.id === logId ? { ...l, status, message: message || l.message, metadata: metadata || l.metadata } : l)
            }
          : msg
      ))
    }

    // Set deploying state
    setMessages(prev => prev.map(msg => msg.id === msgId ? { ...msg, isDeployed: true, logs: [] } : msg))
    appendLog('info', 'Starting deployment sequence...', 'pending')

    try {
      const allSteps = proposal.steps || []
      const total = allSteps.length
      let completed = 0
      setDeployProgress({ current: 0, total })

      // 1. Deploy Data Tables
      const tables = proposal.steps.filter((s: BlueprintStep) => s.type === 'data_table')
      for (const table of tables) {
        const logId = appendLog('info', `Deploying Data Model: ${table.title}...`, 'pending')
        updateLog(logId, 'success', `Provisioned data schema for '${table.title}'`)
        completed++
        setDeployProgress({ current: completed, total })
      }

      // 2. Deploy E-Forms
      const forms = proposal.steps.filter((s: BlueprintStep) => s.type === 'eform')
      for (const step of forms) {
        const logId = appendLog('eform', `Deploying E-Form: ${step.title}...`, 'pending')
        const deployRes = await deployBlueprintEForm(step)
        if (deployRes.success && deployRes.id) {
          updateLog(logId, 'success', `Deployed E-Form '${step.title}'`, { link: `/en/app/eforms/${deployRes.id}/edit` })
        } else {
          updateLog(logId, 'error', `Failed to deploy E-Form '${step.title}': ${deployRes.error}`)
        }
        completed++
        setDeployProgress({ current: completed, total })
      }

      // 3. Deploy Workflows
      const wfs = proposal.steps.filter((s: BlueprintStep) => s.type === 'workflow')
      for (const step of wfs) {
        const logId = appendLog('workflow', `Deploying Visual Workflow: '${step.title}'...`, 'pending')
        const wfRes = await deployBlueprintWorkflow(step, proposal.project_name)
        if (wfRes.success && wfRes.id) {
          updateLog(logId, 'success', `Deployed Visual Workflow '${step.title}'`, { link: `/en/app/workflows/${wfRes.id}/edit` })
        } else {
          updateLog(logId, 'error', `Failed to save Workflow '${step.title}': ${wfRes.error}`)
        }
        completed++
        setDeployProgress({ current: completed, total })
      }

      // 4. Deploy Automations
      const autos = proposal.steps.filter((s: BlueprintStep) => s.type === 'automation')
      for (const step of autos) {
        const logName = step.title || step.config?.trigger_type || 'Webhook'
        const logId = appendLog('automation', `Configuring Automation Protocol: ${logName}...`, 'pending')
        const autoRes = await deployBlueprintAutomation(step)
        if (autoRes.success) {
          updateLog(logId, 'success', `Activated Webhook target for ${step.config?.trigger_type}`, { link: `/en/app/automations` })
        } else {
          updateLog(logId, 'error', `Failed to configure Automation: ${autoRes.error}`)
        }
        completed++
        setDeployProgress({ current: completed, total })
      }

      appendLog('success', 'Blueprint Architecture deployed successfully! 🎉')

      // Mark blueprint as deployed in DB
      await updateBlueprintStatus(bpId, 'deployed')
      setBlueprints(prev => prev.map(b => b.id === bpId ? { ...b, status: 'deployed' } : b))

    } catch (error) {
      appendLog('error', `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
      setDeployProgress(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getLogIcon = (type: DeploymentLog['type']) => {
    switch (type) {
      case 'eform': return <FormInput className="w-4 h-4 text-emerald-500" />
      case 'workflow': return <Workflow className="w-4 h-4 text-violet-500" />
      case 'automation': return <Zap className="w-4 h-4 text-amber-500" />
      default: return <ChevronRight className="w-4 h-4 text-muted-foreground" />
    }
  }

  const templates = [
    { title: "Employee Onboarding", icon: <User className="w-4 h-4" />, prompt: "Create an employee onboarding pipeline. I need a registration e-form, a visual workflow to review documents, and an automation to send a welcome email." },
    { title: "Customer Feedback Loop", icon: <MessageSquare className="w-4 h-4" />, prompt: "Build a customer feedback loop. An e-form to collect reviews, an automation to alert us if the rating is bad, and a workflow to process compensations." },
    { title: "Inventory Alerts", icon: <Zap className="w-4 h-4" />, prompt: "I need an automation to hit a slack webhook when inventory runs low, and a form to request restocking." },
  ]

  return (
    <div className="flex h-[calc(100vh-5rem)] min-h-0 gap-3">
      
      {/* HISTORY SIDEBAR */}
      <Card className="w-60 hidden md:flex flex-col min-h-0 bg-slate-950/60 border-white/[0.06] backdrop-blur-xl shrink-0">
        <CardHeader className="p-3 border-b border-white/[0.06]">
          <Button variant="outline" size="sm" onClick={startNewSession} className="w-full justify-start text-white/80 border-white/10 bg-slate-800/40 hover:bg-slate-700/40 h-8 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Architecture
          </Button>
        </CardHeader>
        <ScrollArea className="flex-1 p-2">
          {blueprints.length === 0 ? (
            <div className="text-center p-4 py-8 text-xs text-white/40">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No past architectures found.
            </div>
          ) : (
            <div className="space-y-1">
              {blueprints.map(bp => {
                const isActive = activeBlueprintId === bp.id
                const hasDetails = isActive && bp.content

                return (
                  <div key={bp.id} className="mb-2 group/sidebar">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => { setConfirmDeleteId(null); handleSelectBlueprint(bp) }}
                        className={cn("flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors min-w-0",
                          isActive ? "bg-indigo-500/20 text-indigo-300 rounded-b-none" : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <div className="font-medium truncate">{bp.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded", bp.status === 'deployed' ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50")}>
                            {bp.status}
                          </span>
                          <span className="text-[10px] text-white/30 truncate">
                            {new Date(bp.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBlueprint(bp.id) }}
                        className={cn("shrink-0 p-1.5 rounded transition-all",
                          confirmDeleteId === bp.id
                            ? "bg-rose-500/20 text-rose-400"
                            : "opacity-0 group-hover/sidebar:opacity-100 text-white/20 hover:text-rose-400 hover:bg-rose-500/10"
                        )}
                        title={confirmDeleteId === bp.id ? "Click again to confirm deletion" : "Delete blueprint"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {hasDetails && (() => {
                      const normalized = normalizeProposal(bp.content)
                      const steps = normalized?.steps || []
                      const stepIcon = (type: string) => {
                        switch (type) {
                          case 'eform': return <FormInput className="w-3 h-3 text-emerald-400" />
                          case 'workflow': return <Workflow className="w-3 h-3 text-violet-400" />
                          case 'automation': return <Zap className="w-3 h-3 text-amber-400" />
                          case 'data_table': return <Database className="w-3 h-3 text-blue-400" />
                          default: return <ChevronRight className="w-3 h-3" />
                        }
                      }
                      const stepLink = (type: string) => {
                        switch (type) {
                          case 'eform': return '/en/app/eforms'
                          case 'workflow': return '/en/app/workflows'
                          case 'automation': return '/en/app/automations'
                          default: return null
                        }
                      }
                      return (
                        <div className="bg-slate-900/40 px-3 py-2 border border-t-0 border-indigo-500/15 rounded-b-md text-xs space-y-1">
                          {steps.map((step: any, i: number) => {
                            const link = stepLink(step.type)
                            return (
                              <div key={step.id || i} className="pl-3 border-l text-white/70 border-white/10 flex items-center justify-between group">
                                <div className="flex items-center gap-1.5 truncate">
                                  {stepIcon(step.type)}
                                  <span className="truncate" title={step.title}>{step.title}</span>
                                </div>
                                {bp.status === 'deployed' && link && (
                                  <Link target="_blank" href={link} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded">
                                    <ExternalLink className="w-3 h-3 text-white/50 hover:text-white" />
                                  </Link>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* CHAT AREA */}
      <Card className="flex-1 flex flex-col min-h-0 bg-slate-950/60 border-white/[0.06] backdrop-blur-xl">
        <CardHeader className="border-b border-white/[0.06] px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            AI Architect Copilot
          </CardTitle>
          <CardDescription className="text-white/50 text-xs">
            Describe what to automate. The Architect will generate E-Forms, Workflows, and Automations.
          </CardDescription>
        </CardHeader>

        <ScrollArea className="flex-1 px-4 py-3 min-h-0">
          <div className="space-y-4 pb-2">
            {messages.length === 0 && (
              <div className="text-center py-10 opacity-80">
                <Bot className="w-12 h-12 mx-auto mb-4 text-white/30" />
                <p className="text-white font-medium mb-8">How can I help you automate your business today?</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto px-4">
                  {templates.map((tpl, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleTemplateClick(tpl.prompt)}
                      className="text-left p-3 rounded-lg border border-white/[0.06] bg-slate-800/30 hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-indigo-300 mb-2 font-medium text-sm">
                        {tpl.icon}
                        {tpl.title}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{tpl.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={cn("flex flex-col w-full", message.role === 'user' ? "items-end" : "items-start")}>
                <div className={cn("flex items-end gap-2 mb-1", message.role === 'user' ? "flex-row-reverse" : "")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", 
                    message.role === 'user' ? "bg-primary/20" : "bg-indigo-500/20"
                  )}>
                    {message.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className={cn("text-xs text-muted-foreground font-medium")}>
                    {message.role === 'user' ? 'You' : 'Architect'} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 border", 
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground border-transparent rounded-tr-sm" 
                    : "bg-muted/50 text-foreground border-border/50 rounded-tl-sm w-full"
                )}>
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* PROPOSAL CARD */}
                  {message.proposal && (
                    <div className="mt-3 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/[0.06]">
                      <div className="font-semibold text-sm mb-2 flex items-center justify-between group/title">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                          {editingProjectName === message.id ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                autoFocus
                                className="bg-background border border-primary/30 rounded px-2 py-0.5 text-xs text-foreground outline-none w-full"
                                value={projectNameDraft}
                                onChange={(e) => setProjectNameDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setMessages(prev => prev.map(msg => (msg.id === message.id && msg.proposal) ? { ...msg, proposal: { ...msg.proposal, project_name: projectNameDraft } } : msg))
                                    setEditingProjectName(null)
                                    autoSaveDraft(message.id)
                                  }
                                  if (e.key === 'Escape') setEditingProjectName(null)
                                }}
                                onBlur={() => {
                                  setMessages(prev => prev.map(msg => (msg.id === message.id && msg.proposal) ? { ...msg, proposal: { ...msg.proposal, project_name: projectNameDraft } } : msg))
                                  setEditingProjectName(null)
                                  autoSaveDraft(message.id)
                                }}
                              />
                            </div>
                          ) : (
                            <div 
                              className="truncate cursor-text hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                              onClick={() => {
                                if (message.proposal) {
                                  setEditingProjectName(message.id)
                                  setProjectNameDraft(message.proposal.project_name || 'Architecture Proposal')
                                }
                              }}
                            >
                              {message.proposal.project_name || 'Architecture Proposal'}
                              <Pencil className="w-3 h-3 opacity-0 group-hover/title:opacity-40" />
                            </div>
                          )}
                        </div>
                        {message.isDeployed && (
                          <div className="text-[10px] text-emerald-400 font-bold tracking-widest flex items-center gap-1 uppercase">
                            <CheckCircle2 className="w-3 h-3" /> Deployed
                          </div>
                        )}
                      </div>
                      
                      {/* DEPLOYMENT PROGRESS STEPPER */}
                      {deployProgress && activeBlueprintId === message.blueprintId && (
                        <div className="mb-4 space-y-1.5">
                          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter text-indigo-300/60 transition-all animate-pulse">
                            <span>Deploying Resources...</span>
                            <span>{Math.round((deployProgress.current / deployProgress.total) * 100)}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-900/60 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                              style={{ width: `${(deployProgress.current / deployProgress.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* PIPELINE STEPS (Sortable) */}
                      {message.proposal.steps && message.proposal.steps.length > 0 && (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, message.id)}>
                          <SortableContext items={message.proposal.steps.map((s: BlueprintStep) => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 font-semibold">Pipeline ({message.proposal.steps.length} steps)</div>
                            {message.proposal.steps.map((step: BlueprintStep) => (
                              <SortableStepItem
                                key={step.id}
                                step={step}
                                isDeployed={message.isDeployed}
                                onRemove={() => {
                                  setMessages(prev => prev.map(msg =>
                                    (msg.id === message.id && msg.proposal)
                                      ? { ...msg, proposal: { ...msg.proposal, steps: msg.proposal.steps.filter((s: BlueprintStep) => s.id !== step.id) } }
                                      : msg
                                  ))
                                  autoSaveDraft(message.id)
                                }}
                                onUpdate={(patch) => {
                                  setMessages(prev => prev.map(msg =>
                                    (msg.id === message.id && msg.proposal)
                                      ? { ...msg, proposal: { ...msg.proposal, steps: msg.proposal.steps.map((s: BlueprintStep) => s.id === step.id ? { ...s, ...patch } as BlueprintStep : s) } }
                                      : msg
                                  ))
                                  autoSaveDraft(message.id)
                                }}
                                onClone={() => {
                                  setMessages(prev => prev.map(m =>
                                    (m.id === message.id && m.proposal)
                                      ? { ...m, proposal: { ...m.proposal, steps: [...m.proposal.steps, { ...step, id: `clone-${crypto.randomUUID().slice(0,8)}`, title: `${step.title} (Copy)` }] } }
                                      : m
                                  ))
                                  autoSaveDraft(message.id)
                                }}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      )}

                      {/* ADD STEP BUTTON */}
                      {!message.isDeployed && (
                        <div className="mt-1">
                          {showAddStepForMsg === message.id ? (
                            <div className="grid grid-cols-2 gap-2 p-2 bg-muted/40 border border-border/50 rounded-lg">
                              {[
                                { type: 'data_table' as const, label: 'Data Table', icon: <Database className="w-4 h-4 text-blue-400" /> },
                                { type: 'eform' as const, label: 'E-Form', icon: <FormInput className="w-4 h-4 text-emerald-400" /> },
                                { type: 'workflow' as const, label: 'Workflow', icon: <Workflow className="w-4 h-4 text-violet-400" /> },
                                { type: 'automation' as const, label: 'Automation', icon: <Zap className="w-4 h-4 text-amber-400" /> },
                              ].map(opt => (
                                <button
                                  key={opt.type}
                                  className="flex items-center gap-2 p-2 rounded-md text-xs text-foreground hover:bg-muted/50 border border-border/50 hover:border-border/80 transition-colors"
                                  onClick={() => {
                                    const newStep: BlueprintStep = { id: `manual-${crypto.randomUUID().slice(0,8)}`, type: opt.type as BlueprintStepType, title: `New ${opt.label}`, description: 'Manually added step', config: {} }
                                    setMessages(prev => prev.map(msg =>
                                      (msg.id === message.id && msg.proposal)
                                        ? { ...msg, proposal: { ...msg.proposal, steps: [...msg.proposal.steps, newStep] } }
                                        : msg
                                    ))
                                    setShowAddStepForMsg(null)
                                    autoSaveDraft(message.id)
                                  }}
                                >
                                  {opt.icon}
                                  {opt.label}
                                </button>
                              ))}
                              <button onClick={() => setShowAddStepForMsg(null)} className="col-span-2 text-[10px] text-muted-foreground hover:text-foreground mt-1">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowAddStepForMsg(message.id)}
                              className="w-full py-2 px-3 text-xs rounded-lg border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Step
                            </button>
                          )}
                        </div>
                      )}

                      {!message.isDeployed && (
                        <div className="mt-5 pt-4 border-t border-border/50 flex justify-end">
                           <Button 
                             onClick={() => message.proposal && handleDeploy(message.id, message.blueprintId!, message.proposal)}
                             disabled={isGenerating}
                             className="bg-primary hover:bg-primary/90 text-primary-foreground"
                           >
                              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                              Approve & Deploy
                           </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LOGS LIST WITH DEEP LINKS */}
                  {message.logs && message.logs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-2 font-mono text-xs">
                      {message.logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {log.status === 'pending' ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> 
                             : log.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-success" />
                             : log.status === 'error' ? <XCircle className="w-4 h-4 text-destructive" />
                             : getLogIcon(log.type)}
                          </div>
                          <div className="flex-1">
                            <span className={cn(
                              log.status === 'error' ? "text-destructive" :
                              log.status === 'success' ? "text-success font-medium" : "text-muted-foreground"
                            )}>
                              {log.message}
                            </span>
                            {/* DEEP LINK RENDERER */}
                            {log.metadata?.link && log.status === 'success' && (
                              <Link target="_blank" href={log.metadata.link} className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded bg-muted/50 hover:bg-muted text-foreground transition-colors">
                                Edit <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm ml-10">
                <Loader2 className="w-4 h-4 animate-spin" />
                Architect is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t border-border/50">
          <div className="flex gap-3 max-w-3xl mx-auto relative">
            <Textarea 
              placeholder="Describe your process (e.g., 'When inventory runs low, send me an email' or 'Create a customer survey...')"
              className="resize-none min-h-[52px] bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground/70 pr-24 py-2.5 rounded-lg"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              autoFocus
            />
            <Button 
              size="icon"
              className="absolute right-1.5 bottom-1.5 h-9 w-9 shrink-0 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
              onClick={handleSubmit}
              disabled={!input.trim() || isGenerating}
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            </Button>
          </div>
          <div className="text-center mt-2">
           <span className="text-[10px] text-white/30">Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
