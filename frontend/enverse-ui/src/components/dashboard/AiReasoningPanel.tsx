import { useEffect, useState } from "react"
import { Brain, CheckCircle2, AlertTriangle, Moon, Zap } from "lucide-react"
// ✅ FIXED IMPORT PATH
import { getDeviceDisplayName } from "../../utils/deviceAliases"

// Define the structure of the Raw Backend Response
type InsightData = 
  | { type: 'dominant_load'; device: string; value: number; percentage: number }
  | { type: 'consumption_status'; status: 'high' | 'normal'; total_kwh: number; driver?: string }
  | { type: 'night_usage'; percentage: number }

type InsightResponse = {
  ai_insights: InsightData[]
}

export default function AiReasoningPanel() {
  const [insights, setInsights] = useState<InsightData[]>([])
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

  // --- TEXT GENERATION LOGIC ---
  const renderInsight = (data: InsightData, index: number) => {
    switch (data.type) {
      
      case 'dominant_load':
        return (
          <div key={index} className="flex gap-4 group">
            <Zap size={20} className="text-amber-500 shrink-0 mt-1" />
            <p className="text-sm font-medium text-slate-700 leading-normal">
              {/* ✅ APPLY ALIAS HERE */}
              <span className="font-bold">{getDeviceDisplayName(data.device)}</span> is the primary consumer, accounting for <span className="font-bold">{data.percentage}%</span> of total energy.
            </p>
          </div>
        )

     // ... inside renderInsight ...

      case 'consumption_status':
        const isHigh = data.status === 'high'
        const driverName = data.driver ? getDeviceDisplayName(data.driver) : "primary load"
        
        return (
          <div key={index} className="flex gap-4 group">
            {isHigh ? (
              <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-1" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-1" />
            )}
            <p className="text-sm font-medium text-slate-700 leading-normal">
              {isHigh 
                ? `High consumption detected (${data.total_kwh} kWh). Usage is significantly driven by ${driverName}.`
                // ✅ FIXED: Safer phrasing. "Optimal" -> "Consistent with historical baseline"
                : `Consumption (${data.total_kwh} kWh) is consistent with the historical baseline for this system.`
              }
            </p>
          </div>
        )

      case 'night_usage':
        const isNightHigh = data.percentage > 40
        return (
          <div key={index} className="flex gap-4 group">
            <Moon size={20} className={isNightHigh ? "text-indigo-500" : "text-slate-400"} />
            <p className="text-sm font-medium text-slate-700 leading-normal">
              {isNightHigh
                // ✅ FIXED: Added .toFixed(0)
                ? `Night-time usage is ${data.percentage.toFixed(0)}% of total. Check for devices left in standby.`
                : `Night-time usage is ${data.percentage.toFixed(0)}%, indicating efficient overnight operations.`
              }
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full p-6 md:p-8 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Brain size={18} className="text-amber-600" />
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Pattern Recognition</h4>
      </div>

      <div className="space-y-4 flex-1">
        {loading ? (
          <div className="flex items-center gap-3 text-sm font-medium text-slate-400 animate-pulse">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            Analyzing usage patterns...
          </div>
        ) : insights.length ? (
          insights.map((insight, i) => renderInsight(insight, i))
        ) : (
          <p className="text-sm text-slate-400 italic">System calibrating...</p>
        )}
      </div>
    </div>
  )
}