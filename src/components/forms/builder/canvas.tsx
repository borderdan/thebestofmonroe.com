'use client'

import React from 'react'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { BuilderField } from './types'
import { SortableField } from './sortable-field'

interface CanvasProps {
  fields: BuilderField[]
  onFieldsChange: (fields: BuilderField[]) => void
  onSelectField: (id: string | null) => void
  selectedFieldId: string | null
}

export function Canvas({ fields, onFieldsChange, onSelectField, selectedFieldId }: CanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      onFieldsChange(arrayMove(fields, oldIndex, newIndex))
    }
  }

  const removeField = (id: string) => {
    onFieldsChange(fields.filter((f) => f.id !== id))
    if (selectedFieldId === id) onSelectField(null)
  }

  return (
    <div className="w-full">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={fields.map(f => f.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <SortableField 
                key={field.id} 
                field={field} 
                onRemove={() => removeField(field.id)}
                onSelect={() => onSelectField(field.id)}
                isSelected={selectedFieldId === field.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
