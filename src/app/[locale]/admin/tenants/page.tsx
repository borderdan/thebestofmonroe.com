import { getAllTenants } from '@/lib/actions/admin'
import { TenantManagement } from '@/components/admin/tenant-management'

export default async function AdminTenantsPage() {
  const tenants = await getAllTenants()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-zinc-100">TENANT MANAGEMENT</h1>
        <p className="text-zinc-500 font-medium">Control subscription tiers and platform access.</p>
      </div>

      <TenantManagement tenants={tenants} />
    </div>
  )
}
