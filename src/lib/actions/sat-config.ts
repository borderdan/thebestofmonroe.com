'use server'

import { type ActionResult } from '@/lib/supabase/helpers';

import * as Sentry from '@sentry/nextjs';

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { satConfigSchema } from '@/lib/schemas/sat-config'
import { encrypt } from '@/lib/security/encryption'

export async function updateSatConfig(formData: FormData) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('No autorizado')

    // Get the user's business ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('business_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.business_id) {
      throw new Error('No se encontró el negocio del usuario')
    }

    if (userData.role !== 'owner' && userData.role !== 'manager') {
      throw new Error('No tienes permisos para realizar esta acción')
    }

    const rawData = {
      rfc: formData.get('rfc'),
      regimen_fiscal: formData.get('regimen_fiscal'),
      csd_password: formData.get('csd_password'),
      facturama_api_user: formData.get('facturama_api_user'),
      facturama_api_password: formData.get('facturama_api_password'),
    }

    const validatedData = satConfigSchema.parse(rawData)

    // Encrypt sensitive fields
    const encryptedCsdPassword = encrypt(validatedData.csd_password)
    const encryptedFacturamaUser = encrypt(validatedData.facturama_api_user)
    const encryptedFacturamaPassword = encrypt(validatedData.facturama_api_password)

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        rfc: validatedData.rfc,
        regimen_fiscal: validatedData.regimen_fiscal,
        csd_password: encryptedCsdPassword,
        facturama_api_user: encryptedFacturamaUser,
        facturama_api_password: encryptedFacturamaPassword,
      })
      .eq('id', userData.business_id)

    if (updateError) {
      Sentry.addBreadcrumb({
        category: 'sat-config',
        message: 'Update error: ' + JSON.stringify(updateError),
        level: 'error',
      });
      throw new Error('Error al actualizar la configuración SAT')
    }

    revalidatePath('/[locale]/app/settings/billing', 'page')
    
    return { success: true }
  } catch (error: unknown) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
    Sentry.addBreadcrumb({
      category: 'sat-config',
      message: 'Configuración SAT Error: ' + message,
      level: 'error',
    });
    return { success: false, error: message };
  }
}
