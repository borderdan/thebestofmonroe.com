'use client'

import { useBuilderContext } from './BuilderProvider'
import { Zap, Filter, Play, Send, Mail, MessageSquare, FileText, Database } from 'lucide-react'
import { AIWorkflowGenerator } from './ai-generator'

const NODE_CATEGORIES = [
  {
    label: 'Triggers',
    nodes: [
      { type: 'trigger', label: 'Event Trigger', icon: Zap, color: 'amber' },
    ],
  },
  {
    label: 'Logic',
    nodes: [
      { type: 'condition', label: 'Condition', icon: Filter, color: 'violet' },
    ],
  },
  {
    label: 'Actions',
    nodes: [
      { type: 'action', label: 'Send Webhook', icon: Send, color: 'blue', actionType: 'send_webhook' },
      { type: 'action', label: 'Send Email', icon: Mail, color: 'blue', actionType: 'send_email' },
      { type: 'action', label: 'WhatsApp Alert', icon: MessageSquare, color: 'emerald', actionType: 'send_whatsapp' },
      { type: 'action', label: 'Generate CFDI', icon: FileText, color: 'orange', actionType: 'generate_cfdi' },
      { type: 'action', label: 'Update Record', icon: Database, color: 'cyan', actionType: 'update_record' },
    ],
  },
]

export function NodePalette() {
  const { setDraggedType } = useBuilderContext()

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
    setDraggedType(nodeType)
  }

  const colorClasses: Record<string, string> = {
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50',
    violet: 'border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/50',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50',
  }

  return (
    <div className="w-56 border-r border-border/50 bg-background/90 backdrop-blur-lg p-4 overflow-y-auto flex flex-col gap-6">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          AI Generation
        </h3>
        <AIWorkflowGenerator />
      </div>

      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground -mt-2">
        Drag & Drop
      </h3>
      {NODE_CATEGORIES.map((category) => (
        <div key={category.label}>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
            {category.label}
          </h4>
          <div className="flex flex-col gap-1.5">
            {category.nodes.map((node) => (
              <div
                key={`${node.type}-${node.label}`}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                onDragEnd={() => setDraggedType(null)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-150 ${colorClasses[node.color]}`}
              >
                <node.icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
