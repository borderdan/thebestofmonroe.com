import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testImprovedLogic() {
  let allBusinesses: any[] = []
  let from = 0
  const step = 1000
  let hasMore = true
  while (hasMore) {
    const { data: bizData } = await supabase.from('businesses').select('*').range(from, from + step - 1)
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
    const { data: insData } = await supabase.from('restaurant_inspections').select('name, address, score, grade').range(from, from + step - 1).order('inspection_date', { ascending: true })
    if (insData && insData.length > 0) {
      allInspections = [...allInspections, ...insData]
      if (insData.length < step) hasMore = false
      else from += step
    } else {
      hasMore = false
    }
  }

  const healthLookupByName = new Map<string, { score: number, grade: string }>()
  const healthLookupByAddr = new Map<string, { score: number, grade: string }>()
  
  const normalizeMatch = (str: string) => {
    if (!str) return ""
    return str.toUpperCase()
      .replace(/&/g, 'AND')
      .replace(/[^A-Z0-9]/g, ' ')
      .replace(/\b(LLC|INC|CORP|LTD|PA|PLC|CO|COMPANY|RESTAURANT|GRILL|BAR|GRILLE|CAFE|KITCHEN|STEAKHOUSE|PIZZA|MEXICAN|AMERICAN|SHOP|MARKET|FOOD|DELI|DELICATESSEN|EXPRESS)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const normalizeAddr = (addr: string) => {
    if (!addr) return ""
    return addr.toUpperCase()
      .split(',')[0]
      .replace(/[^A-Z0-9]/g, ' ')
      .replace(/\b(SUITE|STE|UNIT|BLVD|AVE|ST|RD|LN|HWY|WAY|DR|CIR|CT|PL|PKWY|TRL|ROUTE|RT|EAST|WEST|NORTH|SOUTH|E|W|N|S)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  for (const ins of allInspections) {
    if (ins.name && ins.score !== null) {
      const nameKey = normalizeMatch(ins.name)
      const addrKey = normalizeAddr(ins.address)
      const val = { score: ins.score, grade: ins.grade }
      if (nameKey) healthLookupByName.set(nameKey, val)
      if (addrKey) healthLookupByAddr.set(addrKey, val)
    }
  }

  let matchCount = 0;
  for (const biz of allBusinesses) {
    const bNorm = normalizeMatch(biz.name)
    const bAddr = normalizeAddr(biz.location?.street)
    let healthInfo = (bNorm ? healthLookupByName.get(bNorm) : null) || (bAddr ? healthLookupByAddr.get(bAddr) : null)
    
    if (!healthInfo && bNorm && bNorm.length > 3) {
      for (const [key, val] of healthLookupByName.entries()) {
        if (key.length > 3 && (key.includes(bNorm) || bNorm.includes(key))) {
          healthInfo = val
          break
        }
      }
    }
    if (!healthInfo && bAddr && bAddr.length > 5) {
      for (const [key, val] of healthLookupByAddr.entries()) {
        if (key.length > 5 && (key.includes(bAddr) || bAddr.includes(key))) {
          healthInfo = val
          break
        }
      }
    }
    if (healthInfo) matchCount++;
  }

  console.log('Final Match Count:', matchCount);
}

testImprovedLogic()