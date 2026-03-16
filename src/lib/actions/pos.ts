'use server'

import * as Sentry from '@sentry/nextjs';

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSessionWithProfile, type ActionResult } from '@/lib/supabase/helpers'

const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
})

const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  paymentMethod: z.string().optional().default('cash'),
  customerId: z.string().uuid().optional(),
  pointsToRedeem: z.number().int().nonnegative().optional().default(0),
  giftCardCode: z.string().optional(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

export async function processTransaction(input: unknown): Promise<ActionResult<{ transactionId: string }>> {
  try {
    const { supabase, user, profile } = await getSessionWithProfile()
    const { items, paymentMethod, customerId, pointsToRedeem, giftCardCode } = checkoutSchema.parse(input)

    // Server-side total calculation (never trust client totals)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const taxRate = 0.16 // Default 16% IVA
    let total = Math.round((subtotal * (1 + taxRate)) * 100) / 100

    let redemptionDiscount = 0
    let pointsEarned = 0

    // 0. Process Loyalty if Customer is attached
    if (customerId) {
      const { data: loyaltyConfig } = await supabase
        .from('loyalty_configs')
        .select('*')
        .eq('business_id', profile.business_id)
        .eq('is_active', true)
        .single()

      if (loyaltyConfig) {
        // Handle Redemption
        if (pointsToRedeem > 0) {
          const { data: customer } = await supabase
            .from('crm_customers')
            .select('loyalty_points')
            .eq('id', customerId)
            .single()

          if (customer && customer.loyalty_points >= pointsToRedeem && pointsToRedeem >= (loyaltyConfig.min_points_to_redeem || 0)) {
            redemptionDiscount = Math.round((pointsToRedeem * Number(loyaltyConfig.redemption_ratio)) * 100) / 100
            total = Math.max(0, total - redemptionDiscount)
          }
        }

        // Calculate Earned Points (on the final total paid)
        pointsEarned = Math.floor(total * Number(loyaltyConfig.points_per_currency))
      }
    }

    // 0.5 Process Gift Card
    let amountToRedeem = 0
    if (paymentMethod === 'gift_card' && giftCardCode) {
      amountToRedeem = total
      const { data: gc, error } = await supabase
        .from('gift_cards')
        .select('current_balance, status')
        .eq('code', giftCardCode)
        .eq('business_id', profile.business_id)
        .single();
      
      if (error || !gc) throw new Error('Invalid Gift Card code')
      if (gc.status !== 'active') throw new Error('Gift Card is inactive or used')
      if (gc.current_balance < amountToRedeem) throw new Error('Insufficient Gift Card balance')
    }

    // 1. Insert the transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        business_id: profile.business_id,
        user_id: user.id,
        customer_id: customerId,
        total,
        status: 'completed',
        currency: 'MXN',
        payment_method: paymentMethod,
        metadata: {
          subtotal,
          tax: subtotal * taxRate,
          tax_rate: taxRate,
          item_count: items.length,
          loyalty: customerId ? {
            points_earned: pointsEarned,
            points_redeemed: pointsToRedeem,
            discount: redemptionDiscount
          } : undefined,
          gift_card_code: giftCardCode
        },
      })
      .select('id')
      .single()

    if (txError) return { success: false, error: txError.message }

    // 2. Process Loyalty Ledger Entries
    if (customerId && (pointsEarned > 0 || pointsToRedeem > 0)) {
      const loyaltyEntries = []
      
      if (pointsToRedeem > 0) {
        loyaltyEntries.push({
          business_id: profile.business_id,
          customer_id: customerId,
          transaction_id: transaction.id,
          points_change: -pointsToRedeem,
          type: 'redeem',
          description: `Redeemed for ${redemptionDiscount} MXN discount`
        })
      }

      if (pointsEarned > 0) {
        loyaltyEntries.push({
          business_id: profile.business_id,
          customer_id: customerId,
          transaction_id: transaction.id,
          points_change: pointsEarned,
          type: 'earn',
          description: `Earned from transaction ${transaction.id}`
        })
      }

      if (loyaltyEntries.length > 0) {
        await supabase.from('loyalty_transactions').insert(loyaltyEntries)
      }
    }

    // 2. Insert transaction items
    const txItems = items.map(item => ({
      transaction_id: transaction.id,
      entity_id: item.id,
      quantity: item.quantity,
      price_at_time: item.price,
      item_name: item.name,
    }))

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(txItems)

    if (itemsError) {
      // Transaction already created — log but don't fail silently
      Sentry.addBreadcrumb({
        category: 'pos',
        message: 'Failed to insert transaction items: ' + JSON.stringify(itemsError),
        level: 'error',
      });
    }

    // 2.5 Deduct Gift Card Balance Atomically
    if (paymentMethod === 'gift_card' && giftCardCode) {
      const { error: rpcError } = await supabase.rpc('redeem_gift_card', { 
        card_code: giftCardCode, 
        amount: amountToRedeem,
        tx_id: transaction.id
      });
      if (rpcError) {
        throw new Error(`Failed to redeem gift card: ${rpcError.message}`);
      }
    }

    // 3. Decrement stock for each item using the unified products table
    for (const item of items) {
      const { error: stockError } = await supabase.rpc('deduct_product_stock', {
        row_id: item.id,
        quantity_to_deduct: item.quantity
      })

      if (stockError) {
        Sentry.addBreadcrumb({
          category: 'pos',
          message: `Failed to decrement stock for product ${item.id}: ` + JSON.stringify(stockError),
          level: 'error',
        });
        
        // Check for the negative stock constraint violation
        if (stockError.message.includes('check_stock_not_negative')) {
          return { 
            success: false, 
            error: `Insufficient stock for ${item.name}. Another device may have sold it.` 
          }
        }
        
        return { success: false, error: `Stock error: ${stockError.message}` }
      }
    }

    revalidatePath('/[locale]/app', 'layout')
    return { success: true, data: { transactionId: transaction.id } }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to process transaction'
    return { success: false, error: message }
  }
}
