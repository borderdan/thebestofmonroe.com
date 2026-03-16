import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  try {
    const body: { data?: { id?: string }; payment_intent_id?: string } = await req.json()
    const externalRef = body.data?.id || body.payment_intent_id

    if (!externalRef) return new Response('Missing reference', { status: 400 })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Using service role to bypass RLS since this is a server-to-server webhook
    const { error } = await supabaseAdmin
      .from('transactions')
      .update({ payment_status: 'completed', status: 'completed' })
      .eq('external_payment_id', externalRef)

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errMessage }), { status: 500 })
  }
})
