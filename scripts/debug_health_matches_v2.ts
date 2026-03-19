import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalize(name: string) {
  if (!name) return "";
  return name.toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Remove everything except alphanumeric
    .trim();
}

async function debugMatches() {
  let allBusinesses: any[] = []
  let from = 0
  const step = 1000
  let hasMore = true
  while (hasMore) {
    const { data: bizData } = await supabase.from('businesses').select('*').range(from, from + step - 1).order('name', { ascending: true })
    if (bizData && bizData.length > 0) {
      allBusinesses = [...allBusinesses, ...bizData]
      if (bizData.length < step) hasMore = false
      else from += step
    } else {
      hasMore = false
    }
  }
  
  let allInspections: any[] = []
  from = 0
  hasMore = true
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
  const matches = [];
  const possibleMatches = [];

  for (const b of allBusinesses) {
    const bNorm = normalize(b.name);
    
    let match = healthLookup.get(bNorm);
    if (!match) {
      // Fuzzy?
      for (const [key, val] of healthLookup.entries()) {
        if (key.includes(bNorm) || bNorm.includes(key)) {
          match = val;
          break;
        }
      }
    }

    if (match) {
      matchCount++;
      matches.push({ b: b.name, i: match.original });
    } else {
      // Find something that *looks* like a match
      if (bNorm.length > 4) {
        for (const [key, val] of healthLookup.entries()) {
          // Check if it shares some common words? Or just prefix?
          if (key.startsWith(bNorm.slice(0, 8))) {
             possibleMatches.push({ b: b.name, i: val.original });
             break;
          }
        }
      }
    }
  }

  console.log('Total Businesses:', allBusinesses.length);
  console.log('Match Count:', matchCount);
  console.log('Sample Matches:', matches.slice(0, 10));
  console.log('Possible missing matches:', possibleMatches.slice(0, 20));
  
  // Categorize businesses
  const cats = new Map();
  allBusinesses.forEach(b => cats.set(b.category, (cats.get(b.category) || 0) + 1));
  console.log('Categories:', Array.from(cats.entries()).sort((a,b) => b[1] - a[1]).slice(0, 20));
}

debugMatches()