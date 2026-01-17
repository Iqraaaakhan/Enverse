import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

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
    <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-3">
        {increase ? (
          <TrendingUp className="text-amber-600" size={18} />
        ) : (
          <TrendingDown className="text-emerald-600" size={18} />
        )}
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">
          AI Energy Timeline
        </h2>
      </div>

      <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
        {data.ai_explanation.map((line, i) => (
          <li key={i}>• {line}</li>
        ))}
      </ul>

      <div className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Derived using ML + NILM + NLP
      </div>
    </section>
  )
}
