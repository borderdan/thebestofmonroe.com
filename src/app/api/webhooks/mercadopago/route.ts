import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const url = new URL(req.url);
    const dataId = url.searchParams.get('data.id') || body?.data?.id;
    const type = url.searchParams.get('type') || body?.type;

    // 1. Verify Signature
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (secret) {
      if (!xSignature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 403 });
      }
      const parts = xSignature.split(',');
      let ts = '', v1 = '';
      parts.forEach(part => {
        const [key, val] = part.split('=', 2);
        if (key === 'ts') ts = val;
        if (key === 'v1') v1 = val;
      });

      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
      
      if (hmac !== v1) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    // 2. Process Update (Idempotent)
    if (type === 'payment' && dataId) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
      });
      const paymentData = await mpRes.json();

      if (paymentData.external_reference) {
        // Idempotency check
        const { data: existing } = await supabaseAdmin
          .from('transactions')
          .select('payment_status')
          .eq('id', paymentData.external_reference)
          .single();

        if (existing?.payment_status !== paymentData.status) {
           await supabaseAdmin
            .from('transactions')
            .update({
              payment_status: paymentData.status,
              external_payment_id: paymentData.id.toString()
            })
            .eq('id', paymentData.external_reference);
        }
      }
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    // Return 500 so MP retries
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

