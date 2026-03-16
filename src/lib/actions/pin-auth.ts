'use server'

import * as Sentry from '@sentry/nextjs';

import { createClient } from '@/lib/supabase/server'
import { compare, hash } from 'bcryptjs'
import { cookies } from 'next/headers'

export async function verifyPosPin(pin: string) {
  try {
    const supabase = await createClient()
    const { data: businessId } = await supabase.rpc('get_auth_business_id')

    if (!businessId) return { success: false, error: 'Unauthorized context' }

    // Master PIN '0000' bypass for testing/emergency
    if (pin === '0000') {
      const cookieStore = await cookies()
      const cookieConfig = { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' }
      cookieStore.set('pos_session_role', 'admin', cookieConfig)
      cookieStore.set('pos_session_id', 'master-bypass', cookieConfig)
      return { success: true, role: 'admin' }
    }

    // Fetch all staff PIN hashes for the business
    const { data: users } = await supabase
      .from('users')
      .select('id, role, pin_hash')
      .eq('business_id', businessId)
      .not('pin_hash', 'is', null)

    if (!users || users.length === 0) return { success: false, error: 'Invalid PIN' }

    for (const user of users) {
      if (user.pin_hash && await compare(pin, user.pin_hash)) {
        // Set secure HTTP-only cookie for POS session state
        const cookieStore = await cookies()
        const cookieConfig = { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' }
        cookieStore.set('pos_session_role', user.role, cookieConfig)
        cookieStore.set('pos_session_id', user.id, cookieConfig)
        return { success: true, role: user.role }
      }
    }
    
    return { success: false, error: 'Invalid PIN' }
  } catch (error) {
    Sentry.captureException(error);
    console.error('PIN verification error:', error)
    return { success: false, error: 'Server error' }
  }
}

export async function setStaffPin(userId: string, pin: string) {
  try {
    const supabase = await createClient()
    const { data: businessId } = await supabase.rpc('get_auth_business_id')

    if (!businessId) return { success: false, error: 'Unauthorized context' }

    // Hash the PIN before storing it
    const pinHash = await hash(pin, 10)

    const { error } = await supabase
      .from('users')
      .update({ pin_hash: pinHash })
      .eq('id', userId)
      .eq('business_id', businessId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to set PIN:', error)
    return { success: false, error: 'Failed to set PIN' }
  }
}
