import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalize(name: string) {
  return name.toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ') // Replace punctuation with space
    .replace(/\b(LLC|INC|CORP|LTD|PA|PLC|CO|COMPANY)\b/g, '') // Remove entity types
    .replace(/\s+/g, ' ') // Collapse spaces
    .trim();
}

async function debugMatches() {
  const { data: businesses } = await supabase.from('businesses').select('id, name, category');
  
  let allInspections: any[] = []
  let from = 0
  const step = 1000
  let hasMore = true
  while (hasMore) {
    const { data: insData } = await supabase.from('restaurant_inspections').select('name, score, grade').range(from, from + step - 1).order('inspection_date', { ascending: true })
    if (insData && insData.length > 0) {
      allInspections = [...allInspections, ...insData]
      if (insData.length < step) hasMore = false
      else from += step
    } else {
      hasMore = false
    }
  }

  const healthLookup = new Map<string, { score: number, grade: string, original: string }>()
  for (const ins of allInspections) {
    if (ins.name && ins.score) {
      const norm = normalize(ins.name);
      healthLookup.set(norm, { score: ins.score, grade: ins.grade, original: ins.name })
    }
  }

  let matchCount = 0;
  const missingRestaurants = [];

  if (businesses) {
    for (const b of businesses) {
      const bNorm = normalize(b.name);
      
      let match = healthLookup.get(bNorm);
      if (!match) {
        // Try partial match
        for (const [key, val] of healthLookup.entries()) {
          if (key.includes(bNorm) || bNorm.includes(key)) {
            match = val;
            break;
          }
        }
      }

      if (match) {
        matchCount++;
      } else if (b.category?.toLowerCase().includes('rest') || b.category?.toLowerCase().includes('food')) {
        missingRestaurants.push(b.name);
      }
    }
  }

  console.log('Total Businesses:', businesses?.length);
  console.log('Match Count with Improved Logic:', matchCount);
  console.log('Missing Restaurants (category contains "rest" or "food"):', missingRestaurants.length);
  console.log('Sample Missing Restaurants:', missingRestaurants.slice(0, 20));
  
  // Also check some random inspection names to see if we are missing any patterns
  console.log('Sample Inspection Names:', allInspections.slice(0, 10).map(i => i.name));
}

debugMatches()