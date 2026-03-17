'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BuilderField, FIELD_TYPES } from './types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, Trash, Type, AlignLeft, Mail, Hash, ChevronDown, CheckSquare, Calendar, ListChecks, CircleDot, Star, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'

interface SortableFieldProps {
  field: BuilderField
  onRemove: () => void
  onSelect: () => void
  isSelected: boolean
}

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

export function SortableField({ field, onRemove, onSelect, isSelected }: SortableFieldProps) {
  const t = useTranslations('eforms.builder')

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  }

  const fieldTypeInfo = FIELD_TYPES.find(t => t.type === field.type)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (ICONS as any)[fieldTypeInfo?.icon || 'Type']

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative transition-all",
        isDragging && "opacity-50 scale-102 z-50",
        field.colSpan === 1 ? "col-span-1" : "col-span-1 md:col-span-2"
      )}
    >
      <Card
        onClick={onSelect}
        className={cn(
          "p-4 cursor-pointer transition-all duration-300 bg-card/60 backdrop-blur-sm border-slate-200/60 dark:border-white/5 shadow-sm group/card",
          isSelected 
            ? "ring-1 ring-primary border-primary shadow-[0_8px_24px_rgba(var(--primary),0.1)] -translate-y-1" 
            : "hover:border-primary/30 hover:shadow-md"
        )}
      >
        <div className="flex items-center gap-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 opacity-0 group-hover/card:opacity-100 transition-opacity"
          >
            <GripVertical size={16} />
          </div>

          <div className="flex-1 flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isSelected ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            )}>
              <Icon size={18} />
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "font-bold text-sm tracking-tight transition-colors",
                isSelected ? "text-primary" : "text-slate-700 dark:text-slate-200"
              )}>
                {field.title || t('untitled')}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-tighter text-slate-400">
                  {field.type}
                </div>
                {field.required && (
                  <div className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-tighter">
                    {t('required')}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 rounded-full opacity-0 group-hover/card:opacity-100 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <Trash size={14} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
