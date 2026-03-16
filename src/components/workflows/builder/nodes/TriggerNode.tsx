'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Zap } from 'lucide-react'

const TRIGGER_EVENTS = [
  { value: 'pos_sale_completed', label: 'POS Sale Completed' },
  { value: 'eform_submission', label: 'E-Form Submitted' },
  { value: 'crm_customer_new', label: 'New CRM Customer' },
  { value: 'inventory_low', label: 'Inventory Low' },
  { value: 'invoice_issued', label: 'Invoice Issued' },
]

export default function TriggerNode({ data, selected }: NodeProps) {
  const triggerType = (data?.triggerType as string) || 'pos_sale_completed'
  const currentEvent = TRIGGER_EVENTS.find((e) => e.value === triggerType)

  return (
    <div
      className={`rounded-xl border-2 shadow-lg min-w-[220px] transition-all ${
        selected
          ? 'border-amber-400 shadow-amber-400/20 ring-2 ring-amber-400/30'
          : 'border-amber-500/40 shadow-amber-500/10'
      }`}
    >
      <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-t-[10px] px-4 py-2 flex items-center gap-2 border-b border-amber-500/20">
        <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="text-xs font-black uppercase tracking-wider text-amber-400">
          Trigger
        </span>
      </div>
      <div className="bg-background/90 backdrop-blur-sm rounded-b-[10px] px-4 py-3">
        <div className="text-sm font-semibold text-foreground">
          {currentEvent?.label || 'Select Event'}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          When this event occurs
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-amber-300"
      />
    </div>
  )
}

export { TRIGGER_EVENTS }
