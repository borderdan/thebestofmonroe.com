'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, FileText, Zap, Copy, Check, ExternalLink } from 'lucide-react'
import { generateEForm } from '@/lib/ai/generate-eform'
import { generateN8nWorkflow, pushToN8n } from '@/lib/ai/generate-workflow'
import { toast } from 'sonner'

export default function AIToolsPage() {
  return (
    <div className="container max-w-6xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          AI Generation Tools
        </h1>
        <p className="text-lg text-white/60 mt-1">
          Super-admin tools powered by Gemini AI
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <EFormGenerator />
        <WorkflowGenerator />
      </div>
    </div>
  )
}

function EFormGenerator() {
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!description.trim()) return
    setGenerating(true)
    try {
      const res = await generateEForm(description)
      if (res.success && res.data) {
        setResult(JSON.stringify(res.data, null, 2))
        toast.success('E-Form schema generated!')
      } else {
        toast.error(res.error || 'Generation failed')
      }
    } catch {
      toast.error('Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-white/5 bg-white/[0.02]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-white">E-Form Generator</CardTitle>
            <CardDescription className="text-white/40">
              Describe a form in natural language → Get RJSF JSON Schema
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-white/60">Describe the form you need</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g., A customer satisfaction survey with name, email, rating (1-5), and open comments. Include fields for service date and employee name."
            className="bg-white/5 border-white/10 text-white min-h-[120px]"
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating || !description.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {generating ? 'Generating...' : 'Generate E-Form'}
        </Button>

        {result && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 text-white/40 hover:text-white"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <pre className="bg-slate-950 border border-white/5 rounded-lg p-4 text-xs text-white/70 overflow-auto max-h-[300px] font-mono">
              {result}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function WorkflowGenerator() {
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [result, setResult] = useState<string>('')
  const [workflowData, setWorkflowData] = useState<Record<string, unknown> | null>(null)

  const handleGenerate = async () => {
    if (!description.trim()) return
    setGenerating(true)
    try {
      const res = await generateN8nWorkflow(description)
      if (res.success && res.data) {
        setResult(JSON.stringify(res.data, null, 2))
        setWorkflowData(res.data as unknown as Record<string, unknown>)
        toast.success('n8n workflow generated!')
      } else {
        toast.error(res.error || 'Generation failed')
      }
    } catch {
      toast.error('Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  const handlePushToN8n = async () => {
    if (!workflowData) return
    setPushing(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await pushToN8n(workflowData as any)
      if (res.success) {
        toast.success(`Workflow pushed to n8n! ID: ${res.workflowId}`)
      } else {
        toast.error(res.error || 'Failed to push')
      }
    } catch {
      toast.error('Failed to push to n8n')
    } finally {
      setPushing(false)
    }
  }

  return (
    <Card className="border-white/5 bg-white/[0.02]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-white">n8n Workflow Generator</CardTitle>
            <CardDescription className="text-white/40">
              Describe a workflow → Generate & push to n8n
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-white/60">Describe the automation workflow</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g., When a webhook receives a form submission, check if the amount is over $1000 MXN. If yes, send a WhatsApp message to the manager and create a Facturama invoice."
            className="bg-white/5 border-white/10 text-white min-h-[120px]"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={generating || !description.trim()}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {generating ? 'Generating...' : 'Generate'}
          </Button>
          {workflowData && (
            <Button
              onClick={handlePushToN8n}
              disabled={pushing}
              variant="outline"
              className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
            >
              {pushing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Push to n8n
            </Button>
          )}
        </div>

        {result && (
          <pre className="bg-slate-950 border border-white/5 rounded-lg p-4 text-xs text-white/70 overflow-auto max-h-[300px] font-mono">
            {result}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
