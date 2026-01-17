import { useEffect, useState } from "react"
import { Brain, CheckCircle2 } from "lucide-react"

type InsightResponse = {
  ai_insights: string[]
}

/* Refine insight wording for clarity (frontend presentation only) */
const improveInsightWording = (insight: string): string => {
  // INSIGHT 1: Top device consumption
  // Pattern: "🔌 {Device} is the largest consumption category at X% of total energy."
  // → "🔌 {Device} uses X% of your total energy."
  if (insight.includes("is the largest consumption category at") && insight.includes("% of total energy")) {
    const match = insight.match(/^🔌\s(.+?)\sis the largest consumption category at\s([\d.]+)%\sof total energy\.$/)
    if (match) {
      return `🔌 ${match[1]} accounts for ${match[2]}% of your total energy.`
    }
  }

  // INSIGHT 2A: Below typical range
  // Pattern: "✅ This billing period's consumption (X kWh) is Y% below typical Indian household (250–350 kWh range)."
  // → "✅ At X kWh, your consumption is Y% below the typical household range (250–350 kWh/period)."
  if (insight.includes("✅") && insight.includes("below typical Indian household")) {
    const match = insight.match(/^✅\sThis billing period's consumption\s\((\d+)\skWh\)\sis\s([\d.]+)%\sbelow typical Indian household\s\(250–350\skWh\srange\)\.$/)
    if (match) {
      return `✅ At ${match[1]} kWh, your consumption is ${match[2]}% below the typical household range (250–350 kWh/period).`
    }
  }

  // INSIGHT 2B: Above typical range
  // Pattern: "⚠️ This billing period's consumption (X kWh) exceeds typical range (250–350 kWh) by Y%."
  // → "⚠️ At X kWh, your consumption exceeds the typical household range (250–350 kWh/period) by Y%."
  if (insight.includes("⚠️") && insight.includes("exceeds typical range")) {
    const match = insight.match(/^⚠️\sThis billing period's consumption\s\((\d+)\skWh\)\sexceeds typical range\s\(250–350\skWh\)\sby\s([\d.]+)%\.$/)
    if (match) {
      return `⚠️ At ${match[1]} kWh, your consumption exceeds the typical household range (250–350 kWh/period) by ${match[2]}%.`
    }
  }

  // INSIGHT 2C: Within typical range
  // Pattern: "✓ This billing period's consumption (X kWh) is within typical Indian household range (250–350 kWh)."
  // → "✓ At X kWh, your consumption is within the typical household range (250–350 kWh/period)."
  if (insight.includes("✓") && insight.includes("within typical Indian household range")) {
    const match = insight.match(/^✓\sThis billing period's consumption\s\((\d+)\skWh\)\sis within typical Indian household range\s\(250–350\skWh\)\.$/)
    if (match) {
      return `✓ At ${match[1]} kWh, your consumption is within the typical household range (250–350 kWh/period).`
    }
  }

  // INSIGHT 3: Day/night usage patterns
  // Pattern: "📊 Alert: After-hours consumption is X% higher than daytime." OR "📊 Notice: After-hours usage is slightly higher than daytime."
  // → "📊 Energy usage is higher during after-hours periods (X% increase vs. daytime)." OR "📊 After-hours consumption is slightly elevated compared to daytime."
  if (insight.includes("📊") && insight.toLowerCase().includes("after-hours")) {
    if (insight.includes("Alert:")) {
      const match = insight.match(/^📊\sAlert:\sAfter-hours consumption is\s(\d+)%\shigher than daytime\.$/)
      if (match) {
        return `📊 After-hours energy usage is ${match[1]}% higher than daytime consumption.`
      }
    } else if (insight.includes("Notice:")) {
      return `📊 After-hours usage is slightly higher than daytime consumption.`
    }
  }

  // Fallback: return original insight unchanged
  return insight
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
    <div className="h-full p-6 md:p-8 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Brain size={18} className="text-amber-600" />
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Pattern Recognition</h4>
      </div>

      <div className="space-y-3 flex-1">
        {loading ? (
          <div className="flex items-center gap-3 text-sm font-medium text-slate-400 animate-pulse">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            Processing Neural Patterns...
          </div>
        ) : insights.length ? (
          insights.slice(0, 3).map((insight, i) => (
            <div key={i} className="flex gap-4 group">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-1 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-slate-700 leading-normal">
                {insight}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400 italic">System calibrating...</p>
        )}
      </div>
    </div>
  )
}