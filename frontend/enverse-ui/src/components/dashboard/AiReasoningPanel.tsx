import { useEffect, useState } from "react"
import { Brain, Sparkles } from "lucide-react"

type InsightResponse = {
  ai_insights: string[]
}

export default function AiReasoningPanel() {
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/energy/ai-insights")
      .then(res => res.json())
      .then((data: InsightResponse) => {
        setInsights(data.ai_insights || [])
      })
      .catch(() => setInsights([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-amber-600 text-white">
          <Brain size={18} />
        </div>
        <div>
          <h3 className="font-black uppercase text-sm tracking-widest">
            AI Reasoning
          </h3>
          <p className="text-xs text-slate-400">
            Explainable insights derived from ML & NILM
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 animate-pulse">
          Analyzing energy behavior…
        </p>
      ) : insights.length ? (
        <ul className="space-y-3 text-sm text-slate-600">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-2">
              <Sparkles size={14} className="text-amber-500 mt-1" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">
          No insights available at this moment.
        </p>
      )}
    </div>
  )
}
