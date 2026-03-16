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
        isDragging && "opacity-50 scale-102"
      )}
    >
      <Card 
        onClick={onSelect}
        className={cn(
          "p-4 cursor-pointer hover:border-primary/50 transition-colors bg-card",
          isSelected && "ring-2 ring-primary border-primary shadow-lg"
        )}
      >
        <div className="flex items-center gap-4">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded text-muted-foreground"
          >
            <GripVertical size={18} />
          </div>
          
          <div className="flex-1 flex items-center gap-3">
            <div className="p-1.5 rounded bg-slate-100 text-slate-500">
              <Icon size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">
                {field.title || 'Untitled Field'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[10px] px-1 h-4 uppercase">
                  {field.type}
                </Badge>
                {field.required && (
                  <Badge variant="destructive" className="text-[10px] px-1 h-4 uppercase">
                    Required
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:bg-destructive/10 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <Trash size={16} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
