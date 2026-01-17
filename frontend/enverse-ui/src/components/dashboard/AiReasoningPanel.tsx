import { useEffect, useState } from "react"
import { Brain, CheckCircle2 } from "lucide-react"

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
    <div className="h-full p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-slate-400" />
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Pattern Recognition</h4>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 animate-pulse">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            Processing Neural Patterns...
          </div>
        ) : insights.length ? (
          insights.map((insight, i) => (
            <div key={i} className="flex gap-3 group">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                {insight}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 italic">System calibrating...</p>
        )}
      </div>
    </div>
  )
}