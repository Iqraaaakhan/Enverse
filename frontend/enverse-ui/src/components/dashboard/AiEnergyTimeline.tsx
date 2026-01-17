import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, History } from "lucide-react"

type TimelineResponse = {
  delta_kwh: number
  delta_cost: number
  primary_device: string
  ai_explanation: string[]
}

export default function AiEnergyTimeline() {
  const [data, setData] = useState<TimelineResponse | null>(null)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/energy/ai-timeline")
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  if (!data || !data.ai_explanation?.length) return null

  const increase = data.delta_kwh > 0

  return (
    <div className="h-full p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <History size={16} className="text-slate-400" />
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Historical Context</h4>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${increase ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {increase ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Change</p>
                <p className={`text-sm font-black ${increase ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {increase ? '+' : ''}{data.delta_kwh} kWh
                </p>
            </div>
        </div>

        <ul className="space-y-2 pl-2 border-l-2 border-slate-100">
            {data.ai_explanation.map((line, i) => (
            <li key={i} className="text-sm font-medium text-slate-600 pl-3 leading-relaxed">
                {line}
            </li>
            ))}
        </ul>
      </div>
    </div>
  )
}