import { Zap, BarChart3 } from "lucide-react"

function EnergySummarySection({ devices }: { devices: Record<string, number> }) {
  const deviceEntries = Object.entries(devices).sort((a, b) => b[1] - a[1]);
  const maxUsage = Math.max(...Object.values(devices));

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl"><BarChart3 size={20} /></div>
        <div>
          <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Analytics</h3>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Disaggregation Logs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {deviceEntries.map(([name, energy]) => (
          <div key={name} className="premium-card p-6 md:p-8 flex flex-col justify-between group">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300"><Zap size={16} /></div>
                <div>
                  <h4 className="text-sm md:text-lg font-black text-slate-900 tracking-tight leading-none">{name}</h4>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1.5 leading-none">NILM Verified</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl md:text-2xl font-black text-slate-900 tabular-nums leading-none">{energy.toFixed(3)}</span>
                <span className="text-[9px] font-black text-amber-600 uppercase">kWh</span>
              </div>
            </div>

            <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
               <div className="h-full bg-slate-900 rounded-full transition-all duration-1000 group-hover:bg-amber-500" style={{ width: `${(energy / maxUsage) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EnergySummarySection