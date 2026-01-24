import { useEffect, useState } from "react"
import { Brain, CheckCircle2, AlertTriangle, Moon, Zap } from "lucide-react"
import { getDeviceDisplayName } from "../../utils/deviceAliases"
import { getApiUrl, API_ENDPOINTS } from '../../config/api'

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
    fetch(getApiUrl(API_ENDPOINTS.AI_INSIGHTS))
      .then(res => res.json())
      .then((data: InsightResponse) => {
        setInsights(data.ai_insights || [])
      })
      .catch(() => setInsights([]))
      .finally(() => setLoading(false))
  }, [])

  const renderInsight = (data: InsightData, index: number) => {
    switch (data.type) {
      case 'dominant_load':
        return (
          <div key={index} className="flex gap-5 group items-start">
            <div className="mt-1 p-2 bg-amber-50 rounded-xl text-amber-600">
              <Zap size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-slate-600 leading-relaxed">
                <span className="text-lg font-black text-slate-900">{getDeviceDisplayName(data.device)}</span> is the primary consumer, accounting for <span className="text-lg font-black text-slate-900">{data.percentage}%</span> of total energy.
              </p>
            </div>
          </div>
        )

      case 'consumption_status':
        const isHigh = data.status === 'high'
        return (
          <div key={index} className="flex gap-5 group items-start">
            <div className={`mt-1 p-2 rounded-xl ${isHigh ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isHigh ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-slate-600 leading-relaxed">
                Consumption <span className="font-bold text-slate-800">({data.total_kwh} kWh)</span> is {isHigh ? 'above' : 'consistent with'} the historical baseline for this system.
              </p>
            </div>
          </div>
        )

      case 'night_usage':
        return (
          <div key={index} className="flex gap-5 group items-start">
            <div className="mt-1 p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Moon size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-slate-600 leading-relaxed">
                Night-time usage is <span className="text-lg font-black text-slate-900">{data.percentage.toFixed(0)}%</span> of total. {data.percentage > 40 ? "Check for devices left in standby." : "Optimal sleep mode detected."}
              </p>
            </div>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="h-full p-8 flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <Brain size={20} className="text-amber-600" />
        <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">Pattern Recognition</h4>
      </div>

      <div className="space-y-8 flex-1">
        {loading ? (
          <div className="flex items-center gap-3 text-base font-medium text-slate-400 animate-pulse">
            <div className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
            Analyzing usage patterns...
          </div>
        ) : insights.map((insight, i) => renderInsight(insight, i))}
      </div>
    </div>
  )
}