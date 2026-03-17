'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { EFormsBuilder } from '@/components/forms/builder'
import { BuilderField } from '@/components/forms/builder/types'
import { toast } from 'sonner'

export default function EFormsEditPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const id = params.id as string
  const supabase = createClient()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [initialFields, setInitialFields] = useState<BuilderField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadForm() {
      const { data, error } = await supabase
        .from('eforms')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        toast.error('Error loading form')
        router.push(`/${locale}/app/eforms`)
      } else {
        setTitle(data.title)
        setDescription(data.description || '')
        setInitialFields(data.fields_schema || [])
      }
      setLoading(false)
    }
    loadForm()
  }, [id, locale, router, supabase])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (jsonSchema: any, uiSchema: any, builderFields: BuilderField[]) => {
    if (!title) return toast.error('Please enter a form title')
    
    setSaving(true)
    const { error } = await supabase
      .from('eforms')
      .update({
        title,
        description,
        fields_schema: builderFields,
        json_schema: jsonSchema,
        ui_schema: uiSchema,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    setSaving(false)
    if (error) {
      toast.error('Error updating form: ' + error.message)
    } else {
      toast.success('Form updated successfully')
      router.push(`/${locale}/app/eforms`)
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -mt-6 -mx-8 bg-slate-50/50">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 h-14 border-b bg-card/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/app/eforms`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full transition-all hover:bg-primary/10 hover:text-primary active:scale-90">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-black uppercase tracking-widest text-primary/70 leading-none mb-1">E-Form Editor</h1>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="Edit your masterpiece..." 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="w-80 h-7 text-lg font-bold bg-transparent border-none p-0 focus-visible:ring-0 placeholder:opacity-30"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => handleSave(null, null, [])} // Temporary wrapper for toolbar save logic
            disabled={saving || !title}
            className="h-9 rounded-full px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {saving ? 'Saving...' : 'Update Form'}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative bg-slate-50">
        <EFormsBuilder 
          initialFields={initialFields}
          onSave={handleSave}
          isSaving={saving}
          fullHeight
        />
      </div>
    </div>
  )
}
