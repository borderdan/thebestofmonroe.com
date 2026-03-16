import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BillingForm } from './billing-form'

export default async function BillingSettingsPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch business settings
  const { data: userData } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  let initialData = {}

  if (userData?.business_id) {
    const { data: business } = await supabase
      .from('businesses')
      .select('rfc, regimen_fiscal, csd_password, facturama_api_user')
      .eq('id', userData.business_id)
      .single()

    if (business) {
      initialData = {
        rfc: business.rfc || '',
        regimen_fiscal: business.regimen_fiscal || '',
        has_csd: !!business.csd_password,
        has_api: !!business.facturama_api_user
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
        <p className="text-muted-foreground">
          Configura tus credenciales del SAT para emitir facturas electrónicas.
        </p>
      </div>

      <BillingForm initialData={initialData} />
    </div>
  )
}
