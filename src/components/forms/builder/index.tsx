'use client'

import React, { useState } from 'react'
import { FieldPalette } from './field-palette'
import { Canvas } from './canvas'
import { FieldSettings } from './field-settings'
import { BuilderField, FieldType } from './types'
import { generateSchemas } from './utils'
import { Button } from '@/components/ui/button'
import { Save, Eye, Maximize2, Minimize2, LayoutTemplate } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FormRenderer } from '../form-renderer'
import { TemplateSelector } from './template-selector'
import { AIEFormGenerator } from './ai-generator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface EFormsBuilderProps {
  initialFields?: BuilderField[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (jsonSchema: any, uiSchema: any, builderFields: BuilderField[]) => void
  isSaving?: boolean
  fullHeight?: boolean
}

export function EFormsBuilder({ initialFields = [], onSave, isSaving = false, fullHeight = false }: EFormsBuilderProps) {
  const [fields, setFields] = useState<BuilderField[]>(initialFields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null

  const handleTemplateSelect = (templateFields: BuilderField[]) => {
    setFields(templateFields)
    setTemplateOpen(false)
    setSelectedFieldId(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/react-form-builder') as FieldType
    if (!type) return

    const newField: BuilderField = {
      id: uuidv4(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
    }

    if (type === 'select' || type === 'multiselect' || type === 'radio') {
      newField.options = [{ label: 'Option 1', value: 'option_1' }]
    }

    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const updateField = (id: string, updates: Partial<BuilderField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const handleSave = () => {
    const { jsonSchema, uiSchema } = generateSchemas(fields)
    onSave(jsonSchema, uiSchema, fields)
  }

  const handleAIGenerate = (generatedFields: BuilderField[]) => {
    // Merge or replace? Replacing is generally safer for an AI generated form to avoid weird conflicts.
    // If the canvas is empty, we just set it. If not, maybe we confirm, but for now we'll just replace
    // to keep the UX fast and magical.
    setFields(generatedFields)
    if (generatedFields.length > 0) {
      setSelectedFieldId(generatedFields[0].id)
    }
  }

  const { jsonSchema, uiSchema } = generateSchemas(fields)

  return (
    <div className={`flex flex-col bg-card overflow-hidden transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-4 z-[100] h-auto rounded-2xl shadow-2xl border' 
        : fullHeight ? 'h-full border-0' : 'relative h-[800px] border rounded-xl shadow-sm'
    }`}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {fields.length} Fields
            </span>
          </div>
          
          <AIEFormGenerator onGenerate={handleAIGenerate} />

          <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
            <DialogTrigger render={
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <LayoutTemplate className="w-4 h-4" />
                Quick Templates
              </Button>
            } />
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Choose a Form Template</DialogTitle>
              </DialogHeader>
              <TemplateSelector onSelect={handleTemplateSelect} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Sheet>
            <SheetTrigger>
              <Button variant="outline" size="sm" className="h-8 pointer-events-none" disabled={fields.length === 0}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle>Live Preview</SheetTitle>
              </SheetHeader>
              <div className="p-1">
                <FormRenderer 
                  schema={jsonSchema}
                  uiSchema={uiSchema}
                  onSubmit={(data) => console.log('Preview submit:', data)}
                />
              </div>
            </SheetContent>
          </Sheet>
          
          <Button size="sm" className="h-8" onClick={handleSave} disabled={isSaving || fields.length === 0}>
            <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Palette */}
        <div className="w-64 border-r p-4 overflow-y-auto bg-slate-50/30 flex flex-col">
          <div className="mb-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Field Types</h4>
            <FieldPalette />
          </div>
        </div>

        {/* Center Canvas */}
        <div 
          className="flex-1 overflow-y-auto p-8 bg-slate-100/50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="max-w-2xl mx-auto">
            <Canvas 
              fields={fields} 
              onFieldsChange={setFields} 
              onSelectField={setSelectedFieldId}
              selectedFieldId={selectedFieldId}
            />
            {fields.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-white/50 border-slate-200">
                <p className="text-muted-foreground text-sm font-medium">Drag and drop fields here to start building your form.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Settings */}
        <div className="w-80 border-l bg-card shadow-inner">
          <FieldSettings 
            field={selectedField} 
            onUpdate={updateField} 
          />
        </div>
      </div>
    </div>
  )
}
