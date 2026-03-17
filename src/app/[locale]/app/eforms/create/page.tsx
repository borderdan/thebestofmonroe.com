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
    <div className="flex flex-col h-[calc(100vh-80px)] -mt-6 -mx-8 bg-slate-50/50">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 h-14 border-b bg-card/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-4">
          <Link href={`/${locale as string}/app/eforms`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full transition-all hover:bg-primary/10 hover:text-primary active:scale-90">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-black uppercase tracking-widest text-primary/70 leading-none mb-1">E-Form Designer</h1>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="Name your masterpiece..." 
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
            {saving ? 'Saving...' : 'Publish Form'}
          </Button>
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
