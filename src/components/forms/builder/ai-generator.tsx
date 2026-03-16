'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { generateEForm } from '@/lib/ai/generate-eform'
import { BuilderField, FieldType } from './types'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'

interface AIEFormGeneratorProps {
  onGenerate: (fields: BuilderField[], title: string, description: string) => void
}

export function AIEFormGenerator({ onGenerate }: AIEFormGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      const res = await generateEForm(prompt)
      
      if (res.success && res.data) {
        const generatedFields: BuilderField[] = []
        const properties = (res.data.json_schema?.properties || {}) as Record<string, any>
        const requiredFields = (res.data.json_schema?.required || []) as string[]
        const uiSchema = (res.data.ui_schema || {}) as Record<string, any>

        // Convert JSON Schema properties back to BuilderFields
        Object.entries(properties).forEach(([key, schema]: [string, any]) => {
          let fieldType: FieldType = 'string'
          const uiWidget = uiSchema[key]?.['ui:widget']

          // Determine visual FieldType based on JSON Schema mapping
          if (schema.type === 'string') {
            if (uiWidget === 'textarea') fieldType = 'textarea'
            else if (schema.format === 'email') fieldType = 'email'
            else if (schema.format === 'date') fieldType = 'date'
            else if (schema.pattern) fieldType = 'phone' // Assuming pattern is phone in this context
            else fieldType = 'string'
          } else if (schema.type === 'integer' || schema.type === 'number') {
            if (uiWidget === 'updown') fieldType = 'number' // Or rating depending on context, default to number
            else fieldType = 'number'
          } else if (schema.type === 'boolean') {
            fieldType = 'boolean'
          } else if (schema.enum) {
            fieldType = uiWidget === 'radio' ? 'radio' : 'select'
          } else if (schema.type === 'array') {
            fieldType = 'multiselect'
          }

          const newField: BuilderField = {
            id: uuidv4(),
            type: fieldType,
            title: schema.title || key,
            description: schema.description,
            required: requiredFields.includes(key),
            min: schema.minimum,
            max: schema.maximum,
            pattern: schema.pattern,
          }

          if (schema.enum) {
            newField.options = schema.enum.map((opt: string) => ({ label: opt, value: opt }))
          }

          generatedFields.push(newField)
        })

        onGenerate(generatedFields, res.data.title, res.data.description)
        toast.success('Form generated successfully!')
        setOpen(false)
        setPrompt('')
      } else {
        toast.error(res.error || 'Failed to generate form')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-100 shadow-sm h-9 px-4 py-2 hover:scale-105">
        <Sparkles className="w-4 h-4 mr-2 text-emerald-400" />
          Generate with AI
        </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            AI Form Generator
          </DialogTitle>
          <DialogDescription>
            Describe the form you want to build in plain Spanish. The AI will instantly generate the fields for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Ej: Una encuesta de satisfacción del cliente solicitando nombre, correo, calificación y comentarios..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-32 resize-none"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={!prompt.trim() || isGenerating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? 'Generating...' : 'Generate Form'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
