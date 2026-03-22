'use server'

import { getSessionWithProfile } from '@/lib/supabase/helpers'
import { satConfigSchema } from '@/lib/schemas/sat-config'

export async function updateSatConfig(formData: FormData) {
  const { supabase, profile } = await getSessionWithProfile()
  if (!profile) return { success: false, error: 'Unauthorized' }

  const values = {
    rfc: formData.get('rfc') as string,
    regimen_fiscal: formData.get('regimen_fiscal') as string,
    csd_password: formData.get('csd_password') as string | undefined,
    facturama_api_user: formData.get('facturama_api_user') as string | undefined,
    facturama_api_password: formData.get('facturama_api_password') as string | undefined,
  }

  const parsed = satConfigSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: 'Invalid data' }

  // Update logic using Supabase
  const updateData: Record<string, string> = {
    rfc: parsed.data.rfc,
    regimen_fiscal: parsed.data.regimen_fiscal,
  }

  if (parsed.data.csd_password) updateData.csd_password = parsed.data.csd_password
  if (parsed.data.facturama_api_user) updateData.facturama_api_user = parsed.data.facturama_api_user
  if (parsed.data.facturama_api_password) updateData.facturama_api_password = parsed.data.facturama_api_password

  const { error } = await supabase
    .from('businesses')
    .update(updateData)
    .eq('id', profile.business_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
