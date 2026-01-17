import { useEffect, useState } from "react"
import { Brain } from "lucide-react"

export default function AiInsightsPanel() {
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/energy/ai-insights")
      .then(res => res.json())
      .then(data => {
        setInsights(Array.isArray(data.ai_insights) ? data.ai_insights : [])
      })
      .catch(() => setInsights([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-xl bg-amber-600 text-white">
          <Brain size={18} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-tight">
          AI Energy Reasoning
        </h3>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Analyzing energy patterns…</p>
      ) : insights.length ? (
        <ul className="space-y-3 text-sm text-slate-700">
          {insights.map((insight, i) => (
            <li key={i} className="leading-relaxed">
              • {insight}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">
          No insights available at the moment.
        </p>
      )}
    </div>
  )
}
