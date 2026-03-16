'use server';

import { type ActionResult } from '@/lib/supabase/helpers';

import * as Sentry from '@sentry/nextjs';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateSubmissionStatus(id: string, newStatus: 'new' | 'read' | 'archived') {
  const supabase = await createClient();

  const { error } = await supabase
    .from('vault_submissions')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('Error updating submission status:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/[locale]/app/vault', 'page');
  return { success: true };
}
