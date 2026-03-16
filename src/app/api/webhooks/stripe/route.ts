import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { sendTransactionalEmail } from '@/lib/services/email';
import { ReceiptTemplate } from '@/emails/ReceiptTemplate';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature')!;
    
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // 1. Initial Checkout Completed: Map Customer ID and establish subscription
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const businessId = session.metadata?.business_id;

      if (businessId && session.customer && session.subscription) {
        // Map the Stripe Customer ID to the tenant
        await supabaseAdmin
          .from('businesses')
          .update({ stripe_customer_id: session.customer.toString() })
          .eq('id', businessId);
      }
    }

    // 2. Payment Succeeded: Activate/Renew Subscription
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscriptionId = (invoice as any).subscription as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
      const businessId = subscription.metadata?.business_id;
      // Extract plan_id from metadata or use pro as default
      const planId = subscription.metadata?.plan_id || 'pro';
      
      if (businessId) {
        // Retrieve business to get the name
        const { data: business } = await supabaseAdmin
          .from('businesses')
          .select('name')
          .eq('id', businessId)
          .single();

        await supabaseAdmin
          .from('tenant_subscriptions')
          .upsert({ 
            business_id: businessId,
            plan_id: planId,
            status: 'active',
            external_subscription_id: subscription.id,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          }, { onConflict: 'business_id' });
          // Note: The database trigger 'on_subscription_status_change' will automatically sync modules.config

        const customerEmail = invoice.customer_email;
        if (customerEmail && business) {
          try {
            await sendTransactionalEmail({
              to: customerEmail,
              subject: 'Your The Best of Monroe Subscription Receipt',
              templateName: 'ReceiptTemplate',
              react: ReceiptTemplate({
                businessName: business.name || 'Valued Customer',
                planName: planId.toUpperCase(),
                amount: new Intl.NumberFormat('en-MX', { style: 'currency', currency: invoice.currency }).format(invoice.amount_paid / 100),
                invoiceUrl: invoice.hosted_invoice_url || '#'
              }),
              businessId: businessId
            });
          } catch (emailError) {
            console.error('Failed to send receipt email, but payment succeeded:', emailError);
            // We intentionally swallow this error to return 200 to Stripe
          }
        }
      }
    }

    // 3. Subscription Canceled or Deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      
      await supabaseAdmin
        .from('tenant_subscriptions')
        .update({ status: 'canceled' })
        .eq('external_subscription_id', subscription.id);
        // Note: The database trigger handles reverting modules.config
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Stripe Webhook Error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
