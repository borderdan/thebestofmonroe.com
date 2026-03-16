'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Filter } from 'lucide-react'

const OPERATORS = [
  { value: '==', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' },
  { value: '<', label: 'less than' },
  { value: '>=', label: 'at least' },
  { value: '<=', label: 'at most' },
  { value: 'contains', label: 'contains' },
  { value: 'not_empty', label: 'is not empty' },
  { value: 'is_empty', label: 'is empty' },
]

export default function ConditionNode({ data, selected }: NodeProps) {
  const field = (data?.field as string) || ''
  const operator = (data?.operator as string) || '=='
  const value = data?.value as string | number | undefined
  const op = OPERATORS.find((o) => o.value === operator)

  const summary = field
    ? `${field} ${op?.label || operator}${value !== undefined && value !== '' ? ` ${value}` : ''}`
    : 'Configure condition'

  return (
    <div
      className={`rounded-xl border-2 shadow-lg min-w-[220px] transition-all ${
        selected
          ? 'border-violet-400 shadow-violet-400/20 ring-2 ring-violet-400/30'
          : 'border-violet-500/40 shadow-violet-500/10'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-violet-300"
      />
      <div className="bg-gradient-to-r from-violet-500/20 to-violet-600/10 rounded-t-[10px] px-4 py-2 flex items-center gap-2 border-b border-violet-500/20">
        <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
          <Filter className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <span className="text-xs font-black uppercase tracking-wider text-violet-400">
          Condition
        </span>
      </div>
      <div className="bg-background/90 backdrop-blur-sm rounded-b-[10px] px-4 py-3">
        <div className="text-sm font-medium text-foreground truncate max-w-[200px]">
          {summary}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Filter by field value
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-violet-300"
      />
    </div>
  )
}

export { OPERATORS }
