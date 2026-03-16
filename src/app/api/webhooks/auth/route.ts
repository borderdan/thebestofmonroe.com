import { NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/services/email';
import { WelcomeTemplate } from '@/emails/WelcomeTemplate';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { record, type } = payload;

    if (type === 'INSERT' && record.id) {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/es/app`;
      // Ensure your businesses table has a contact_email column, or adjust to fetch from auth.users
      const targetEmail = record.email || record.contact_email; 
      
      if (targetEmail) {
        await sendTransactionalEmail({
          to: targetEmail,
          subject: 'Welcome to The Best of Monroe',
          templateName: 'WelcomeTemplate',
          businessId: record.id,
          react: WelcomeTemplate({ 
            businessName: record.name || 'Valued Partner', 
            dashboardUrl 
          }),
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Auth Webhook Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}