import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkMatch() {
  const { data: businesses } = await supabase.from('businesses').select('id, name');
  const { data: inspections } = await supabase.from('restaurant_inspections').select('name, score, grade').order('inspection_date', { ascending: false });

  let matchCount = 0;
  const matches = [];

  if (businesses && inspections) {
    for (const b of businesses) {
      // Find first inspection that matches the name (fuzzy or exact)
      const bName = b.name.toUpperCase().trim();
      const ins = inspections.find(i => i.name && i.name.toUpperCase().includes(bName) || bName.includes(i.name.toUpperCase()));
      if (ins) {
        matchCount++;
        matches.push({ bName: b.name, insName: ins.name, score: ins.score, grade: ins.grade });
      }
    }
  }

  console.log('Matches:', matchCount);
  console.log('Sample Matches:', matches.slice(0, 10));
}

checkMatch()