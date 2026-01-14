import { Zap, Cpu, ShieldCheck } from "lucide-react"

type KpiCardsProps = {
  totalEnergy: number
  activeDevices: number
  anomalies: number
}

function Card({ title, value, unit, icon: Icon, color, sub, alertCount }: { title: string; value: string | number; unit?: string; icon: any; color: string; sub: string; alertCount?: number }) {
  return (
    <div className="premium-card p-4 sm:p-6 md:p-10 flex flex-col justify-between min-h-[140px] sm:min-h-[180px] md:min-h-[220px] relative group overflow-hidden">
      {/* Decorative Blur for WOW factor */}
      <div className={`absolute -right-4 -bottom-4 w-20 h-20 blur-3xl opacity-10 rounded-full ${color}`} />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 md:gap-4">
          <div className={`p-2 md:p-3.5 rounded-xl ${color} bg-opacity-20`}>
            <Icon size={18} className="text-slate-900" strokeWidth={2.5} />
          </div>
          <p className="text-slate-800 text-[9px] md:text-xs font-black uppercase tracking-widest truncate">{title}</p>
        </div>
        {/* Status indicator hides on very tiny screens to save space */}
        <div className="hidden xs:flex items-center gap-1 px-2 py-0.5 bg-white rounded-full border border-slate-100">
           <div className={`w-1 h-1 rounded-full ${alertCount && alertCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
           <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{sub}</span>
        </div>
      </div>
      
      <div className="mt-2 md:mt-0 relative z-10">
        <div className="flex items-baseline gap-1 md:gap-2">
          {/* FONT SCALING: Essential for responsiveness (Rule #4) */}
          <span className="text-2xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none tabular-nums">
            {value}
          </span>
          {unit && <span className="text-amber-700 font-bold text-[10px] md:text-sm lowercase shrink-0">{unit}</span>}
        </div>
        
        {title.toLowerCase().includes("security") && (
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-4">
                <div 
                    className={`h-full transition-all duration-1000 ${alertCount && alertCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: alertCount && alertCount > 0 ? '100%' : '0%' }} 
                />
            </div>
        )}
      </div>
    </div>
  )
}

function KpiCards({ totalEnergy, activeDevices, anomalies }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
      {/* Changed title to 'Monthly Usage' for professional context */}
      <Card title="Monthly Usage" value={totalEnergy} unit="kWh" icon={Zap} color="bg-amber-400" sub="Estimated" />
      <Card title="Active Devices" value={activeDevices} icon={Cpu} color="bg-blue-400" sub="Synced" />
      <Card title="Security Alerts" value={anomalies} icon={ShieldCheck} color="bg-rose-400" sub={anomalies > 0 ? "Check" : "Secure"} alertCount={anomalies} />
    </div>
  )
}

export default KpiCards