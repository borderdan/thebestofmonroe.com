import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function GlobalSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-zinc-100">GLOBAL SETTINGS</h1>
        <p className="text-zinc-500 font-medium">Manage platform-wide configuration and feature flags.</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Beta Features</CardTitle>
            <CardDescription className="text-zinc-500">
              Enable experimental features globally for all tenants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-200">AI Analytics</p>
                <p className="text-sm text-zinc-500">Allow AI generation of sales insights.</p>
              </div>
              <Button variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300">Disabled</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-200">Advanced n8n Flows</p>
                <p className="text-sm text-zinc-500">Expose complex automation triggers.</p>
              </div>
              <Button variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400">Enabled</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Maintenance Mode</CardTitle>
            <CardDescription className="text-zinc-500">
              Lock down the platform for database migrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Enable Maintenance Mode</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
