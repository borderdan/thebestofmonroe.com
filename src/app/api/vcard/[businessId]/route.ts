import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('name, contact_email, phone, website')
    .eq('id', businessId)
    .single();

  if (!business) {
    return new NextResponse('Business not found', { status: 404 });
  }

  // Construct standard VCF format
  const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${business.name}
ORG:${business.name}
TEL;TYPE=WORK,VOICE:${business.phone || ''}
EMAIL;TYPE=PREF,INTERNET:${business.contact_email || ''}
URL:${business.website || ''}
END:VCARD`;

  return new NextResponse(vcard, {
    headers: {
      'Content-Type': 'text/vcard',
      'Content-Disposition': `attachment; filename="${business.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.vcf"`,
    },
  });
}
