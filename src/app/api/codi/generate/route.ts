import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CodiPayload {
  amount: number
  concept: string
  businessId: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify authenticated session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, concept, businessId }: CodiPayload = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // 3. Register with Banxico Infrastructure as a Participant
    // In a real environment, this involves signing the request with participant certificates
    // and hitting the Banxico central switch or an authorized aggregator.
    
    const participantId = process.env.BANXICO_PARTICIPANT_ID || '00001'
    const terminalId = process.env.BANXICO_TERMINAL_ID || 'T001'

    const payload = {
      v: 1,
      ic: 0, // Intent code: Payment Request
      dn: concept, // Display Name
      cr: amount.toFixed(2), // Credit amount
      cc: 'MXN', // Currency code
      rf: businessId, // Reference
      pi: participantId, // Participant Identifier
      ti: terminalId, // Terminal Identifier
      ts: Date.now().toString(), // Timestamp
    }

    // Sign the payload (Stubbed for now)
    const signature = 'SIGNATURE_STUB' // This would be generated using crypto.sign(...)

    const finalPayload = {
      ...payload,
      s: signature
    }

    const encodedPayload = Buffer.from(JSON.stringify(finalPayload)).toString('base64')
    const deepLink = `codi://pay?payload=${encodedPayload}`

    // Log the generation for analytics
    await supabase.from('activity_log').insert({
      business_id: businessId,
      action: 'codi_generate',
      metadata: { amount, concept, deepLink }
    })

    return NextResponse.json({ 
      deepLink, 
      payload: encodedPayload,
      participantId,
      terminalId
    })
  } catch (error) {
    console.error('Failed to generate CoDi payload:', error)
    return NextResponse.json({ error: 'Failed to process participant registration' }, { status: 500 })
  }
}
