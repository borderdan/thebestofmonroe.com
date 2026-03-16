'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Send, Mail, MessageSquare, FileText, Database, Play } from 'lucide-react'

const ACTION_TYPES = [
  { value: 'send_webhook', label: 'Send Webhook', icon: Send },
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'send_whatsapp', label: 'WhatsApp Alert', icon: MessageSquare },
  { value: 'generate_cfdi', label: 'Generate CFDI', icon: FileText },
  { value: 'update_record', label: 'Update Record', icon: Database },
]

export default function ActionNode({ data, selected }: NodeProps) {
  const actionType = (data?.actionType as string) || 'send_webhook'
  const currentAction = ACTION_TYPES.find((a) => a.value === actionType)
  const Icon = currentAction?.icon || Play

  return (
    <div
      className={`rounded-xl border-2 shadow-lg min-w-[220px] transition-all ${
        selected
          ? 'border-blue-400 shadow-blue-400/20 ring-2 ring-blue-400/30'
          : 'border-blue-500/40 shadow-blue-500/10'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-blue-300"
      />
      <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/10 rounded-t-[10px] px-4 py-2 flex items-center gap-2 border-b border-blue-500/20">
        <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <span className="text-xs font-black uppercase tracking-wider text-blue-400">
          Action
        </span>
      </div>
      <div className="bg-background/90 backdrop-blur-sm rounded-b-[10px] px-4 py-3">
        <div className="text-sm font-semibold text-foreground">
          {currentAction?.label || 'Select Action'}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Execute this step
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-blue-300"
      />
    </div>
  )
}

export { ACTION_TYPES }
