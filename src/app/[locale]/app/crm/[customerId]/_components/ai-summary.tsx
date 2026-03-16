import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export function AiSummary({ customer }: { customer: { ai_summary?: string; [key: string]: unknown; lead_score?: number; } }) {
  if (!customer.ai_summary) return null

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5 mb-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="h-24 w-24 text-emerald-500" />
      </div>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Sparkles className="h-4 w-4 text-emerald-500" />
        <CardTitle className="text-sm font-semibold text-emerald-700">AI Intelligence Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-emerald-900 leading-relaxed font-medium">
          {customer.ai_summary}
        </p>
        {customer.lead_score && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Lead Quality:</span>
            <div className="h-2 w-32 bg-emerald-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${customer.lead_score * 10}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-700">{customer.lead_score}/10</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
