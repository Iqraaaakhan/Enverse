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
    <div className="h-full p-8 flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <History size={20} className="text-slate-500" />
        <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">Historical Context</h4>
      </div>

      <div className="space-y-8 flex-1">
        {/* Big Ticker Card */}
        <div className={`flex items-center gap-6 p-6 rounded-2xl border ${increase ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className={`p-4 rounded-xl ${increase ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {increase ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Net Change</p>
                <p className={`text-4xl font-black tracking-tight ${increase ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {increase ? '+' : ''}{data.delta_kwh} <span className="text-lg text-slate-400 font-bold">kWh</span>
                </p>
            </div>
        </div>

        {/* Text Explanations */}
        <div className="space-y-4 pl-2">
            {data.ai_explanation.slice(0, 3).map((line, i) => (
            <div key={i} className="flex gap-4 items-start">
                {/* Custom Bullet */}
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
             <p
          className={`text-base leading-relaxed ${
          line.toLowerCase().includes("saving") || line.includes("₹")
         ? "font-bold text-slate-900"
         : "font-medium text-slate-600"
  }`}
>
  {line.replace(/^[^\w]+/, '')}
</p>

            </div>
            ))}
        </div>
      </div>
    </div>
  )
}