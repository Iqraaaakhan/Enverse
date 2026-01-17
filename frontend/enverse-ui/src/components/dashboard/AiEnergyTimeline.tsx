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
    <div className="h-full p-6 md:p-8 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <History size={18} className="text-slate-600" />
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Historical Context</h4>
      </div>

      <div className="space-y-4 flex-1">
        <div className={`flex items-center gap-4 p-4 rounded-lg border ${increase ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className={`p-3 rounded-lg ${increase ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {increase ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Net Change</p>
                <p className={`text-lg font-black ${increase ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {increase ? '+' : ''}{data.delta_kwh} kWh
                </p>
            </div>
        </div>

        <div className="space-y-2 pl-4 border-l-2 border-slate-200">
            {data.ai_explanation.slice(0, 3).map((line, i) => (
            <p key={i} className="text-sm font-medium text-slate-700 leading-normal">
                {line}
            </p>
            ))}
        </div>
      </div>
    </div>
  )
}