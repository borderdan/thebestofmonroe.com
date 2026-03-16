import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DirectoryClientWrapper } from './client-wrapper'

export default async function DirectoryPage() {
  const supabase = await createClient()

  const { data: entities } = await supabase
    .from('entities')
    .select('*')
    .eq('type', 'directory')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Directory</h1>
          <p className="text-muted-foreground">Manage your public-facing listings and staff cards.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> New Entry
        </Button>
      </div>

      <DirectoryClientWrapper initialData={entities || []} />
    </div>
  )
}
