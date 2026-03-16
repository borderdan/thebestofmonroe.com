import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function resolveEntities() {
  console.log("Starting Monroe Entity Resolution (Golden Record Engine)...");

  // 1. Fetch current businesses
  const { data: businesses } = await supabase.from('businesses').select('*');
  
  // 2. Fetch recent permits for cross-referencing
  const { data: permits } = await supabase.from('community_feed').select('*').eq('type', 'permit');

  if (!businesses) return;

  for (const biz of businesses) {
    // Check if a canonical record already exists
    const { data: existing } = await supabase
      .from('canonical_entities')
      .select('*')
      .eq('slug', biz.slug)
      .maybeSingle();

    // Weighted Resolution: CityView (Permits) > Google > Scraping
    const relatedPermits = permits?.filter(p => 
      p.raw_data.address?.toLowerCase().includes(biz.location?.street?.toLowerCase())
    ) || [];

    const officialData = relatedPermits.length > 0 ? relatedPermits[0].raw_data : {};
    
    // Confidence & Vitality Calculation
    let confidence = 0.5;
    if (biz.google_place_id) confidence += 0.2;
    if (relatedPermits.length > 0) confidence += 0.3;

    const payload = {
      slug: biz.slug,
      name: biz.name,
      legal_name: officialData.legal_name || biz.name,
      type: 'business',
      category: biz.category,
      address: biz.location?.street || biz.address,
      official_data: officialData,
      commercial_data: biz,
      confidence_score: Math.min(confidence, 1.0),
      source_labels: ['google', relatedPermits.length > 0 ? 'cityview' : null].filter(Boolean)
    };

    const { error } = await supabase
      .from('canonical_entities')
      .upsert(payload, { onConflict: 'slug' });

    if (error) console.error(`Error resolving entity ${biz.name}:`, error.message);
  }

  console.log("Entity resolution complete.");
}

resolveEntities().catch(console.error);
