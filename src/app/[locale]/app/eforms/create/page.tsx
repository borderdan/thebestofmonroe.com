'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EFormsBuilder } from '@/components/forms/builder'
import { BuilderField } from '@/components/forms/builder/types'
import { toast } from 'sonner'

export default function EFormsCreatePage() {
  const router = useRouter()
  const { locale } = useParams()
  const supabase = createClient()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (jsonSchema: any, uiSchema: any, builderFields: BuilderField[]) => {
    if (!title) return toast.error('Please enter a form title')
    
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userData } = await supabase.from('users').select('business_id').eq('id', user?.id).single()
    
    if (!userData?.business_id) {
       toast.error("No business attached to your account.")
       setSaving(false)
       return
    }

    const { error } = await supabase.from('eforms').insert({
      business_id: userData.business_id,
      title,
      description,
      fields_schema: builderFields, // Keep builder state for re-editing
      json_schema: jsonSchema,      // Standard RJSF schema
      ui_schema: uiSchema           // Standard RJSF UI schema
    })

    setSaving(false)
    if (error) {
      toast.error('Error saving form: ' + error.message)
    } else {
      toast.success('Form created successfully')
      router.push(`/${locale as string}/app/eforms`)
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -mt-6 -mx-8">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Link href={`/${locale as string}/app/eforms`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Design E-Form</h1>
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
          onSave={handleSave}
          isSaving={saving}
          fullHeight
        />
      </div>
    </div>
  )
}
