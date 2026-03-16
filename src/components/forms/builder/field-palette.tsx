'use client'

import React from 'react'
import { FIELD_TYPES, FieldType } from './types'
import { 
  Type, 
  AlignLeft, 
  Mail, 
  Hash, 
  ChevronDown, 
  CheckSquare, 
  Calendar,
  ListChecks,
  CircleDot,
  Star,
  Phone
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = {
  Type,
  AlignLeft,
  Mail,
  Hash,
  ChevronDown,
  CheckSquare,
  Calendar,
  ListChecks,
  CircleDot,
  Star,
  Phone
}

export function FieldPalette() {
  const onDragStart = (e: React.DragEvent, type: FieldType) => {
    e.dataTransfer.setData('application/react-form-builder', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
        Fields
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {FIELD_TYPES.map((field) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = (ICONS as any)[field.icon] || Type
          return (
            <div
              key={field.type}
              draggable
              onDragStart={(e) => onDragStart(e, field.type)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-all cursor-grab active:cursor-grabbing shadow-sm"
              )}
            >
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <Icon size={18} />
              </div>
              <span className="text-sm font-medium">{field.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
