'use server'



import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');

export async function createCheckoutSession(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `The Best of Monroe Plan: ${planId.toUpperCase()}`,
          },
          unit_amount: 0, // In reality, this would be fetched from Stripe or hardcoded per plan
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/subscription?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/subscription?canceled=true`,
    metadata: {
      business_id: profile?.business_id,
      plan_id: planId,
    },
    subscription_data: {
        metadata: {
            business_id: profile?.business_id,
            plan_id: planId
        }
    }
  })

  if (session.url) {
    redirect(session.url)
  }
}

export async function createCustomerPortal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('users')
    .select('businesses(stripe_customer_id, id)')
    .eq('id', user.id)
    .single()

  const businessData = business?.businesses as unknown as { stripe_customer_id: string | null; id: string } | null;
  const customerId = businessData?.stripe_customer_id;

  if (!customerId) {
    throw new Error('No Stripe customer found for this business.')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/subscription`,
  })

  if (session.url) {
    redirect(session.url)
  }
}
