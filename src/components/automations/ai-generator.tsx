'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { generateAndDeployAutomation } from '@/lib/ai/generate-automation'
import { saveAutomationConfig } from '@/lib/actions/automations'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export function AIAutomationGenerator() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const t = useTranslations('automations')

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      toast.info('Analyzing request and generating workflow...')
      
      const aiResult = await generateAndDeployAutomation(prompt)
      
      if (!aiResult.success || !aiResult.webhook_url || !aiResult.trigger_type) {
        throw new Error(aiResult.error || 'Failed to generate automation')
      }

      toast.success(`Workflow deployed! Wiring up to ${aiResult.trigger_type}...`)

      // Automatically construct and save the Database config
      const saveResult = await saveAutomationConfig({
        trigger_type: aiResult.trigger_type,
        webhook_url: aiResult.webhook_url,
        is_active: true
      })

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save automation record')
      }

      toast.success('Automation active and ready!')
      setOpen(false)
      setPrompt('')
      
      // Force a reload to pick up the new server-rendered list in `/app/automations/page.tsx`
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (err) {
       toast.error(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Note: Not using asChild due to Radix UI type mismatches in this specific setup */}
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-primary/50 bg-primary/20 hover:bg-primary/30 text-primary-foreground shadow-sm h-9 px-4 py-2 hover:scale-105">
        <Sparkles className="w-4 h-4 mr-2" />
        Generate with AI
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] border-border/50 bg-background/90 backdrop-blur-xl text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Automation Generator
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Describe the automation you need in plain Spanish. The AI will classify the trigger, build the workflow, and deploy it automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Ej: Cuando se registre una nueva venta, envía un mensaje de Slack y genera una factura..."
            className="col-span-3 min-h-[120px] bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 resize-none font-medium"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isGenerating}
            className="hover:bg-muted/50 hover:text-foreground text-muted-foreground"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || prompt.trim().length === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Orchestrating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate & Deploy
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
