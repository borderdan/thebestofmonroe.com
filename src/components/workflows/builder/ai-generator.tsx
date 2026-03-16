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
import { generateReactFlowWorkflow } from '@/lib/ai/generate-react-flow'
import { type Node, type Edge, useReactFlow } from '@xyflow/react'
import { toast } from 'sonner'

export function AIWorkflowGenerator() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { setNodes, setEdges } = useReactFlow()

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      const res = await generateReactFlowWorkflow(prompt)
      
      if (res.success && res.data) {
        setNodes(res.data.nodes)
        setEdges(res.data.edges)
        
        toast.success('Workflow generated successfully!')
        setOpen(false)
        setPrompt('')
      } else {
        toast.error(res.error || 'Failed to generate workflow')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full flex items-center justify-center gap-2 rounded-lg border border-violet-500/50 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-700 dark:text-violet-100 transition-all hover:scale-105 hover:bg-violet-500/20 active:scale-95">
        <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-400" />
          Generate with AI
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            AI Workflow Generator
          </DialogTitle>
          <DialogDescription>
            Describe the automation you want to build in plain Spanish. The AI will instantly generate and connect the visual blocks for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Ej: Cuando se complete una venta, si el monto es mayor a 1000, enviar un webhook y un mensaje de WhatsApp..."
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
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? 'Generating...' : 'Generate Workflow'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
