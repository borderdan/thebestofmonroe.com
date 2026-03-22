'use server'


import { revalidatePath } from 'next/cache'
import { CustomerSchema, NoteSchema } from '@/lib/schemas/crm'
import { triggerAutomation } from './automations'

export async function createCustomer(values: unknown): Promise<ActionResult> {
  try {
    await requireModuleAccess('crm')
    const { supabase, profile } = await getSessionWithProfile()
    const validated = CustomerSchema.parse(values)

    const { error } = await supabase.from('crm_customers').insert({
      business_id: profile.business_id,
      first_name: validated.first_name,
      last_name: validated.last_name,
      email: validated.email || null,
      phone: validated.phone || null,
      status: validated.status,
    })

    if (error) return { success: false, error: error.message }

    await triggerAutomation(profile.business_id, 'crm_customer_new', {
      first_name: validated.first_name,
      last_name: validated.last_name,
      email: validated.email,
      phone: validated.phone,
      status: validated.status
    })

    revalidatePath('/[locale]/app/crm', 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to create customer'
    return { success: false, error: message }
  }
}

export async function updateCustomer(id: string, values: unknown): Promise<ActionResult> {
  try {
    await requireModuleAccess('crm')
    const { supabase, profile } = await getSessionWithProfile()
    const validated = CustomerSchema.parse(values)

    const { error } = await supabase
      .from('crm_customers')
      .update({
        first_name: validated.first_name,
        last_name: validated.last_name,
        email: validated.email || null,
        phone: validated.phone || null,
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/crm', 'page')
    revalidatePath(`/[locale]/app/crm/${id}`, 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to update customer'
    return { success: false, error: message }
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  try {
    await requireModuleAccess('crm')
    const { supabase, profile } = await getSessionWithProfile()

    const { error } = await supabase
      .from('crm_customers')
      .delete()
      .eq('id', id)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/crm', 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to delete customer'
    return { success: false, error: message }
  }
}

export async function updateCustomerStatus(id: string, status: string): Promise<ActionResult> {
  try {
    await requireModuleAccess('crm')
    const { supabase, profile } = await getSessionWithProfile()

    const { error } = await supabase
      .from('crm_customers')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/crm', 'page')
    revalidatePath(`/[locale]/app/crm/${id}`, 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to update status'
    return { success: false, error: message }
  }
}

export async function addCustomerNote(customerId: string, values: unknown): Promise<ActionResult> {
  try {
    await requireModuleAccess('crm')
    const { supabase, profile, user } = await getSessionWithProfile()
    const validated = NoteSchema.parse(values)

    const { error } = await supabase.from('crm_notes').insert({
      business_id: profile.business_id,
      customer_id: customerId,
      author_id: user.id,
      content: validated.content,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/[locale]/app/crm/${customerId}`, 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to add note'
    return { success: false, error: message }
  }
}

export async function deleteCustomerNote(noteId: string, customerId: string): Promise<ActionResult> {
  try {
    await requireModuleAccess('crm')
    const { supabase, profile } = await getSessionWithProfile()

    const { error } = await supabase
      .from('crm_notes')
      .delete()
      .eq('id', noteId)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/[locale]/app/crm/${customerId}`, 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to delete note'
    return { success: false, error: message }
  }
}
