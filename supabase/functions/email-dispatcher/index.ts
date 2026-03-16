import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function dispatchAndLog(businessId: string, to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'system@yourdomain.com', // Replace with verified domain
        to,
        subject,
        html
      })
    })

    if (!res.ok) throw new Error(`Resend API Error: ${await res.text()}`)
    const data = await res.json()

    // Phase 11 Integration: Audit trail
    await supabaseAdmin.from('email_logs').insert({
      business_id: businessId,
      recipient_email: to,
      subject: subject,
      delivery_status: 'sent',
      provider_id: data.id,
      error_message: null
    })
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error'
    // Phase 11 Integration: Failure logging
    await supabaseAdmin.from('email_logs').insert({
      business_id: businessId,
      recipient_email: to,
      subject: subject,
      delivery_status: 'failed',
      error_message: errMessage
    })
    throw error
  }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  try {
    const payload = await req.json()
    const { type, table, record }: { type: string; table: string; record: Record<string, unknown> } = payload

    if (table === 'transactions' && type === 'UPDATE') {
      if (record.status === 'completed' && record.customer_id) {
        const { data: customer } = await supabaseAdmin
          .from('crm_customers')
          .select('email, first_name, businesses(name)')
          .eq('id', record.customer_id)
          .single()

        if (customer) {
          const typedCustomer = customer as { email: string; first_name: string; businesses: { name: string } | { name: string }[] }
          const businessName = Array.isArray(typedCustomer.businesses) ? typedCustomer.businesses[0].name : typedCustomer.businesses.name
          const html = `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
              <h2 style="color: #111827; margin-bottom: 16px;">Receipt from ${businessName}</h2>
              <p style="color: #374151; font-size: 16px;">Hello ${typedCustomer.first_name},</p>
              <p style="color: #374151; font-size: 16px;">Your payment of <strong style="color: #111827;">$${(record.total as number).toFixed(2)}</strong> was processed successfully.</p>
            </div>
          `
          await dispatchAndLog(record.business_id as string, typedCustomer.email, `Receipt - ${businessName}`, html)
        }
      }
    }

    if (table === 'crm_customers' && type === 'INSERT') {
      if (record.email) {
        const { data: business } = await supabaseAdmin
          .from('businesses')
          .select('name')
          .eq('id', record.business_id)
          .single()

        if (business) {
          const typedBusiness = business as { name: string }
          const html = `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; text-align: center;">
              <h1 style="color: #111827;">Welcome to ${typedBusiness.name}</h1>
              <p style="color: #374151; font-size: 16px;">Hi ${record.first_name}, thank you for joining us.</p>
            </div>
          `
          await dispatchAndLog(record.business_id as string, record.email as string, `Welcome to ${typedBusiness.name}`, html)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errMessage }), { status: 500 })
  }
})
