import { DataSourcesTable } from '@/components/admin/data-sources-table'

export default async function AdminDataSourcesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-zinc-100">DATA SOURCES</h1>
        <p className="text-zinc-500 font-medium">Manage and monitor external API connections and automation scraping jobs.</p>
      </div>

      <DataSourcesTable />
    </div>
  )
}
