import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Edge runtime for minimum latency on physical hardware taps
export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guid: string; locale: string }> }
) {
  const resolvedParams = await params;
  const { guid, locale } = resolvedParams || {};

  if (!guid) {
    return NextResponse.redirect(new URL(`/${locale || 'en'}/directory`, request.url));
  }

  const { data: tag, error } = await supabase
    .from('nfc_tags')
    .select('status, target_type, target_url, business_id, businesses(slug)')
    .eq('guid', guid)
    .single();

  if (error || !tag) {
    // If tag doesn't exist, it's potentially a new hardware - redirect to claim
    return NextResponse.redirect(new URL(`/${locale || 'en'}/claim?guid=${guid}`, request.url));
  }

  if (tag.status === 'unclaimed') {
    return NextResponse.redirect(new URL(`/${locale || 'en'}/claim?guid=${guid}`, request.url));
  }

  if (tag.status === 'inactive') {
    return NextResponse.redirect(new URL(`/${locale || 'en'}/directory`, request.url));
  }

  // Route to POS Menu
  if (tag.target_type === 'pos_menu') {
    return NextResponse.redirect(new URL(`/${locale || 'en'}/app/pos`, request.url));
  }

  // Route to Native E-Form
  if (tag.target_type === 'eform' && tag.target_url) {
    return NextResponse.redirect(new URL(`/${locale || 'en'}/forms/${tag.target_url}`, request.url));
  }

  // Route based on hardware configuration
  if (tag.target_type === 'custom_url' && tag.target_url) {
    // Ensure URL has protocol
    const url = tag.target_url.startsWith('http') ? tag.target_url : `https://${tag.target_url}`;
    return NextResponse.redirect(new URL(url));
  }

  // Default: Route to tenant's Smart Profile / Directory page
  const business = tag.businesses as unknown as { slug: string } | null;
  const slug = business?.slug;
  if (slug) {
    return NextResponse.redirect(new URL(`/${locale || 'en'}/directory/${slug}`, request.url));
  }

  // Fallback
  return NextResponse.redirect(new URL(`/${locale || 'en'}/directory`, request.url));
}
