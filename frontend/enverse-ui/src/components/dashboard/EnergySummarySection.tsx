import { Zap, BarChart3 } from "lucide-react"
import AiReasoningPanel from "./AiReasoningPanel"

type Props = {
  devices: Record<string, number>
}

export default function EnergySummarySection({ devices }: Props) {
  const entries = Object.entries(devices ?? {}).sort((a, b) => b[1] - a[1])
  const maxUsage = Math.max(...Object.values(devices ?? {}), 1)

  if (!entries.length) {
    return (
      <div className="premium-card p-8 text-center text-slate-400">
        No appliance usage data available yet.
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl">
          <BarChart3 size={20} />
        </div>
        <div>
          <h3 className="text-xl md:text-3xl font-black uppercase italic">
            Analytics
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Disaggregation Logs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {entries.map(([name, energy]) => (
          <div key={name} className="premium-card p-6 group">
            <div className="flex justify-between mb-4">
              <div className="flex gap-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Zap size={16} />
                </div>
                <div>
                  <h4 className="font-black">{name}</h4>
                  <p className="text-[8px] uppercase text-slate-400">
                    NILM Verified
                  </p>
                </div>
              </div>

              <span className="font-black">
                {energy.toFixed(3)}{" "}
                <span className="text-amber-600 text-xs">kWh</span>
              </span>
            </div>
<div className="mt-8">
  <AiReasoningPanel />
</div>

            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${(energy / maxUsage) * 100}%` }}
              />
            </div>
          </div>
          
        ))}
      </div>
    </div>
  )
}
