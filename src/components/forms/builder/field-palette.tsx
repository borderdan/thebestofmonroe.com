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
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('eforms.builder')

  const onDragStart = (e: React.DragEvent, type: FieldType) => {
    e.dataTransfer.setData('application/react-form-builder', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {FIELD_TYPES.map((field) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Icon = (ICONS as any)[field.icon] || Type
        return (
          <div
            key={field.type}
            draggable
            onDragStart={(e) => onDragStart(e, field.type)}
            className={cn(
              "flex items-center gap-3 p-2.5 rounded-xl border bg-card/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md border-slate-200/60 dark:border-white/5 hover:border-primary/20 group/item"
            )}
          >
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
              <Icon size={16} />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{field.label}</span>
          </div>
        )
      })}
    </div>
  )
}
