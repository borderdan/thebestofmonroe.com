'use client'

import React, { useState } from 'react'
import { FieldPalette } from './field-palette'
import { Canvas } from './canvas'
import { FieldSettings } from './field-settings'
import { BuilderField, FieldType } from './types'
import { generateSchemas } from './utils'
import { Button } from '@/components/ui/button'
import { Save, Eye, Maximize2, Minimize2, LayoutTemplate, Plus } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FormRenderer } from '../form-renderer'
import { TemplateSelector } from './template-selector'
import { AIEFormGenerator } from './ai-generator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useTranslations } from 'next-intl'

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

  const t = useTranslations('eforms.builder')

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
      title: `${t('untitled')}`,
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
      <div className="flex items-center justify-between p-3 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10 border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2 px-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-white/5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {fields.length} {t('fields')}
            </span>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1" />

          <AIEFormGenerator onGenerate={handleAIGenerate} />

          <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
            <DialogTrigger render={
              <Button variant="ghost" size="sm" className="h-8 gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs font-bold text-slate-500">
                <LayoutTemplate className="w-3.5 h-3.5" />
                TEMPLATES
              </Button>
            } />
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('chooseTemplate')}</DialogTitle>
              </DialogHeader>
              <TemplateSelector onSelect={handleTemplateSelect} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Sheet>
            <SheetTrigger render={
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs font-bold" disabled={fields.length === 0}>
                <Eye className="w-3.5 h-3.5" /> PREVIEW
              </Button>
            } />
            <SheetContent side="right" className="sm:max-w-xl overflow-y-auto border-l-0 shadow-2xl">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-sm font-black uppercase tracking-widest text-primary/70">Form Preview</SheetTitle>
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

          <Button 
            size="sm" 
            className="h-8 bg-black dark:bg-slate-100 dark:text-black rounded-full px-4 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105" 
            onClick={handleSave} 
            disabled={isSaving || fields.length === 0}
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> {isSaving ? 'SAVING...' : 'QUICK SAVE'}
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Palette */}
        <div className="w-64 border-r p-5 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20 flex flex-col border-slate-200/50 dark:border-slate-800/50 shadow-[inset_-1px_0_0_rgba(0,0,0,0.02)]">
          <div className="mb-4">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Field Palette</h4>
            <FieldPalette />
          </div>
        </div>

        {/* Center Canvas */}
        <div
          className="flex-1 overflow-y-auto p-12 bg-[#f8fbff] dark:bg-[#020617] relative group/canvas"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.4] mix-blend-multiply dark:mix-blend-overlay dark:opacity-[0.05]" 
               style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <div className="max-w-xl mx-auto relative z-10 transition-all duration-500">
            <Canvas
              fields={fields}
              onFieldsChange={setFields}
              onSelectField={setSelectedFieldId}
              selectedFieldId={selectedFieldId}
            />
            {fields.length === 0 && (
              <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-sm transition-all group-hover/canvas:border-primary/30 group-hover/canvas:bg-white/60">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover/canvas:scale-110 transition-transform duration-300">
                  <Plus className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{t('dragDrop')}</p>
                <p className="text-slate-400/50 text-[10px] mt-2 italic px-8">Drag fields from the left or use AI to get started</p>
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
