'use server'

import { createClient } from '@/lib/supabase/server';
import { triggerAutomation } from './automations'
import { revalidatePath } from 'next/cache'
import { getSessionWithProfile, requireModuleAccess } from '@/lib/supabase/helpers'

export async function submitNativeForm(formId: string, businessId: string, payload: Record<string, unknown>) {
  const supabase = await createClient();

  // Validate inputs
  if (!formId || !businessId || !payload) {
    throw new Error('Invalid submission data');
  }

  // Insert directly into the Data Vault
  const { error } = await supabase
    .from('vault_submissions')
    .insert({
      business_id: businessId,
      form_id: formId,
      payload: payload,
      status: 'new'
    });

  if (error) {
    console.error('Form submission failed:', error.message);
    throw new Error('Failed to submit form. Please try again.');
  }

  // Trigger automation for e-form submission
  await triggerAutomation(businessId, 'eform_submission', {
    form_id: formId,
    payload
  })

  return { success: true };
}

export async function deleteEForm(id: string) {
  try {
    await requireModuleAccess('eforms')
    const { supabase, profile } = await getSessionWithProfile()
    const { error } = await supabase
      .from('eforms')
      .delete()
      .eq('id', id)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }
    
    revalidatePath('/[locale]/app/eforms', 'page')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete eform'
    return { success: false, error: message }
  }
}