import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import * as React from 'react';

// Clients are instantiated securely inside the function or exported safely
const getResendClient = () => new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

interface SendEmailParams {
  to: string;
  subject: string;
  templateName: string;
  react: React.ReactElement;
  businessId?: string;
}

export async function sendTransactionalEmail({ to, subject, templateName, react, businessId }: SendEmailParams) {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail) {
      throw new Error('RESEND_FROM_EMAIL environment variable is not set');
    }

    const { data, error } = await getResendClient().emails.send({
      from: fromEmail,
      to,
      subject,
      react,
    });

    if (error) throw error;

    // Log success
    await getSupabaseAdmin().from('email_logs').insert({
      business_id: businessId || null,
      recipient_email: to,
      subject,
      template_name: templateName,
      delivery_status: 'sent'
    });

    return { success: true, id: data?.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Log failure
    await getSupabaseAdmin().from('email_logs').insert({
      business_id: businessId || null,
      recipient_email: to,
      subject,
      template_name: templateName,
      delivery_status: 'failed',
      error_message: message
    });
    
    console.error(`Email sending failed to ${to}:`, error);
    return { success: false, error: message };
  }
}
