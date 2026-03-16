import { ArchitectClient } from '@/components/architect/architect-client'
import { getBlueprints } from '@/lib/actions/blueprints'

export default async function ArchitectPage() {
  const result = await getBlueprints()
  const blueprints = result.success ? result.data || [] : []

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1400px] mx-auto w-full h-full">
      <ArchitectClient initialBlueprints={blueprints} />
    </div>
  )
}
