'use server'

import { type ActionResult } from '@/lib/supabase/helpers';

import * as Sentry from '@sentry/nextjs';

import { createClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, Preference } from 'mercadopago'

// Clients are initialized inside the function body to prevent startup crashes when env vars are missing

export interface GuestCartItem {
  entity_id: string
  item_name: string
  price_at_time: number
  quantity: number
}

export async function createGuestCheckoutPreference(
  businessId: string,
  items: GuestCartItem[],
  locale: string
) {
  try {
    if (!items.length) throw new Error('Cart is empty')

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! 
    })

    // 1. Calculate total server-side to prevent client tampering
    const total = items.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)

    // 2. Create pending transaction (user_id is intentionally null for guests)
    const { data: tx, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        business_id: businessId,
        user_id: null, 
        total: total,
        payment_method: 'mercadopago',
        payment_status: 'pending'
      })
      .select('id')
      .single()

    if (txError) throw new Error(`Transaction creation failed: ${txError.message}`)

    // 3. Insert line items
    const txItems = items.map(item => ({
      transaction_id: tx.id,
      entity_id: item.entity_id,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      item_name: item.item_name
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('transaction_items')
      .insert(txItems)

    if (itemsError) throw new Error(`Item insertion failed: ${itemsError.message}`)

    // 4. Generate MercadoPago Preference
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!
    const preference = new Preference(client)
    
    const response = await preference.create({
      body: {
        items: items.map(item => ({
          id: item.entity_id,
          title: item.item_name,
          quantity: item.quantity,
          unit_price: item.price_at_time,
          currency_id: 'MXN'
        })),
        external_reference: tx.id, // Maps to MercadoPago webhook
        metadata: { business_id: businessId },
        back_urls: {
          success: `${baseUrl}/${locale}/checkout/success`,
          failure: `${baseUrl}/${locale}/checkout/failure`,
          pending: `${baseUrl}/${locale}/checkout/pending`
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`
      }
    })

    return { init_point: response.init_point }
  } catch (error: unknown) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
