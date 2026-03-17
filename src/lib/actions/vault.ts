'use server';

import { getSessionWithProfile, requireModuleAccess, type ActionResult } from '@/lib/supabase/helpers';

import * as Sentry from '@sentry/nextjs';

import { revalidatePath } from 'next/cache';

export async function updateSubmissionStatus(id: string, newStatus: 'new' | 'read' | 'archived'): Promise<ActionResult> {
  try {
    await requireModuleAccess('vault');
    const { supabase, profile } = await getSessionWithProfile();

    const { error } = await supabase
      .from('vault_submissions')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('business_id', profile.business_id);

    if (error) {
      console.error('Error updating submission status:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/[locale]/app/vault', 'page');
    return { success: true };
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to update submission status';
    return { success: false, error: message };
  }
}

export async function createSubmission(formId: string, payload: Record<string, any>): Promise<ActionResult> {
  try {
    await requireModuleAccess('vault');
    const { supabase, profile } = await getSessionWithProfile();

    const { error } = await supabase
      .from('vault_submissions')
      .insert({
        business_id: profile.business_id,
        form_id: formId,
        payload,
        status: 'new'
      });

    if (error) {
      console.error('Error creating submission:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/[locale]/app/vault', 'page');
    return { success: true };
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to create submission';
    return { success: false, error: message };
  }
}
