'use server';

import type { getSessionWithProfile, requireModuleAccess } from '@/lib/supabase/helpers';


import { revalidatePath } from 'next/cache';
import { linkDataSchema, ProfileLinkData } from '@/lib/schemas/links';

export async function createLink(data: ProfileLinkData) {
  const { supabase, profile } = await getSessionWithProfile();
  await requireModuleAccess('links');

  // Validate data
  const validated = linkDataSchema.parse(data);

  const { error } = await supabase
    .from('entities')
    .insert({
      business_id: profile.business_id,
      type: 'profile_link',
      data: validated,
      sort_order: validated.order_index,
      is_active: validated.is_active
    });

  if (error) {
    console.error('Error creating link:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/[locale]/app/links');
  return { success: true };
}

export async function updateLink(id: string, data: Partial<ProfileLinkData>) {
  const { supabase, profile } = await getSessionWithProfile();
  await requireModuleAccess('links');
  
  const { error } = await supabase
    .from('entities')
    .update({
      data: data,
      sort_order: data.order_index,
      is_active: data.is_active
    })
    .eq('id', id)
    .eq('type', 'profile_link')
    .eq('business_id', profile.business_id);

  if (error) {
    console.error('Error updating link:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/[locale]/app/links');
  return { success: true };
}

export async function deleteLink(id: string) {
  const { supabase, profile } = await getSessionWithProfile();
  await requireModuleAccess('links');

  const { error } = await supabase
    .from('entities')
    .delete()
    .eq('id', id)
    .eq('type', 'profile_link')
    .eq('business_id', profile.business_id);

  if (error) {
    console.error('Error deleting link:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/[locale]/app/links');
  return { success: true };
}

export async function reorderLinks(updates: { id: string, order_index: number }[]) {
  const { supabase, profile } = await getSessionWithProfile();
  await requireModuleAccess('links');

  // Perform multiple updates (not truly batched in Supabase JS but efficient enough)
  const results = await Promise.all(
    updates.map(update => 
      supabase
        .from('entities')
        .update({ sort_order: update.order_index })
        .eq('id', update.id)
        .eq('type', 'profile_link')
        .eq('business_id', profile.business_id)
    )
  );

  const error = results.find(r => r.error);
  if (error) {
    console.error('Error reordering links:', error.error);
    return { success: false, error: error.error?.message };
  }

  revalidatePath('/[locale]/app/links');
  return { success: true };
}
