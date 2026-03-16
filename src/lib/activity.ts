'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function logActivity(action: string, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single()

    const head = await headers()
    const ip = head.get('x-forwarded-for') || 'unknown'
    const ua = head.get('user-agent') || 'unknown'

    await supabase.from('activity_log').insert({
      business_id: profile?.business_id,
      user_id: user.id,
      action,
      metadata,
      ip_address: ip,
      user_agent: ua
    })
  } catch (error) {
    // Activity logs should never interrupt the main execution flow
    console.error('Failed to log activity:', error)
  }
}
