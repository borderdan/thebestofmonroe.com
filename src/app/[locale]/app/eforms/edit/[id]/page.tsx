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
    <div className="flex flex-col h-[calc(100vh-80px)] -mt-6 -mx-8">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/app/eforms`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Edit E-Form</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Input 
            placeholder="Form Title..." 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            className="w-64 h-8 bg-slate-50 border-slate-200"
          />
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
