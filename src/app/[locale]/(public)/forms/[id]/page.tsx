import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { FormRenderer } from '@/components/forms/form-renderer'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string, any>

export default async function PublicEFormPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string, locale: string }>
  searchParams: Promise<{ success?: string }>
}) {
  const { id, locale } = await params
  const { success } = await searchParams
  const supabase = await createClient()

  const { data: form } = await supabase
    .from('eforms')
    .select('*, businesses(name, brand_color)')
    .eq('id', id)
    .single()

  if (!form || !form.is_active) notFound()

  // Business context
  const business = form.businesses as AnyObject | null
  const businessName = business?.name || 'Local Business'
  const brandColor = business?.brand_color || '#3b82f6'

  // Generate a fallback schema if json_schema is empty (backwards compatibility)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonSchema: any = (form.json_schema as any) || {
    title: form.title,
    type: "object",
    properties: {}
  }

  // Handle submit server action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function submitForm(formData: any) {
    'use server'
    const { triggerAutomation } = await import('@/lib/actions/automations')
    const supabaseServer = await createClient()
    
    // Insert vault submission
    const { error } = await supabaseServer.from('vault_submissions').insert({
      business_id: form.business_id,
      form_id: form.id,
      payload: formData
    })

    if (error) {
      console.error('Submission error:', error)
      return
    }

    // Fire automations for this form submission
    try {
      await triggerAutomation(form.business_id, 'eform_submission', {
        form_id: form.id,
        form_title: form.title,
        business_id: form.business_id,
        payload: formData,
        submitted_at: new Date().toISOString(),
      })
    } catch (automationError) {
      // Don't block redirect on automation failure
      console.error('Automation trigger error:', automationError)
    }

    redirect(`/${locale}/forms/${id}?success=true`)
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-1.5 rounded-full text-white text-sm font-bold shadow-md mb-4" style={{ backgroundColor: brandColor }}>
            {businessName}
          </div>
        </div>

        {success ? (
          <Card className="border-green-200 shadow-xl overflow-hidden ring-4 ring-green-500/10">
            <CardHeader className="bg-green-50 text-center pb-8 pt-10">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 italic text-2xl font-bold">
                <Check className="w-8 h-8" />
              </div>
              <CardTitle className="text-3xl text-green-900">Submitted!</CardTitle>
              <CardDescription className="text-green-700 text-lg mt-2">Thank you. Your information has been securely received.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="shadow-2xl border-0 ring-1 ring-slate-200 overflow-hidden">
            <div className="h-2 w-full" style={{ backgroundColor: brandColor }} />
            <CardHeader className="pb-8 pt-8 px-8">
              <CardTitle className="text-3xl font-extrabold">{form.title}</CardTitle>
              {form.description && <CardDescription className="text-base mt-2">{form.description}</CardDescription>}
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <FormRenderer 
                schema={jsonSchema}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                uiSchema={(form.ui_schema as any) || {}}
                onSubmit={submitForm}
                brandColor={brandColor}
              />
            </CardContent>
            <CardFooter className="bg-slate-50 px-8 py-4 border-t">
              <p className="text-xs text-muted-foreground flex items-center">
                🔒 Secured by The Best of Monroe Vault
              </p>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  )
}

