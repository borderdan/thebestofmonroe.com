'use server'

import * as Sentry from '@sentry/nextjs';

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/rbac'
import { getSessionWithProfile, type ActionResult } from '@/lib/supabase/helpers'
import { updateRoleSchema, inviteUserSchema } from '@/lib/schemas/team'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logActivity } from '@/lib/activity'

export async function getTeamMembers() {
  try {
    const { supabase, profile } = await getSessionWithProfile()

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, role, created_at')
      .eq('business_id', profile.business_id)
      .order('created_at', { ascending: true })

    if (error) return { success: false as const, error: error.message }

    return { success: true as const, data: data || [] }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to fetch team'
    return { success: false as const, error: message }
  }
}

export async function updateUserRole(values: unknown): Promise<ActionResult> {
  try {
    const { supabase, profile } = await requireRole('owner')
    const { userId, newRole } = updateRoleSchema.parse(values)

    if (userId === profile.business_id) {
      return { success: false, error: 'Cannot change your own role' }
    }

    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/users', 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to update role'
    return { success: false, error: message }
  }
}

export async function inviteTeamMember(values: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireRole('owner')
    const { email, role, fullName } = inviteUserSchema.parse(values)

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return { success: false, error: 'Service role key not configured' }
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
      serviceRoleKey
    )

    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        business_id: profile.business_id,
        role,
        full_name: fullName,
      },
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/users', 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to invite member'
    return { success: false, error: message }
  }
}

export async function removeTeamMember(userId: string): Promise<ActionResult> {
  try {
    const { supabase, profile, user } = await requireRole('owner')

    if (userId === user.id) {
      return { success: false, error: 'Cannot remove yourself from the team' }
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/users', 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to remove member'
    return { success: false, error: message }
  }
}

export async function updateUserPermissions(userId: string, permissions: Record<string, boolean>): Promise<ActionResult> {
  try {
    const { supabase, profile } = await requireRole('owner')

    const { error } = await supabase
      .from('users')
      .update({ permissions })
      .eq('id', userId)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }

    await logActivity('team_permissions_update', { target_user_id: userId })
    revalidatePath('/[locale]/app/users', 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to update permissions'
    return { success: false, error: message }
  }
}
