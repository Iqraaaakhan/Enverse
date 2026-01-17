import { useEffect, useState } from "react"
import { Zap, Cpu, ShieldCheck, TrendingUp } from "lucide-react"

// Updated Card: Compact padding (p-4), but LARGE fonts for examiners
function Card({ title, value, unit, icon: Icon, color, sub }: any) {
  return (
    <div className="premium-card p-4 flex flex-col justify-between h-full relative overflow-hidden group border border-slate-100">
      {/* Decorative background blur */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${color} opacity-10 group-hover:scale-150 transition-transform duration-700`} />
      
      <div className="flex items-center gap-2 relative z-10">
        <div className={`p-2.5 rounded-lg ${color} bg-opacity-20 text-slate-800`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
      </div>

      <div className="mt-3 relative z-10">
        <div className="flex items-baseline">
            <span className="text-4xl font-black text-slate-900 tracking-tight">{value}</span>
            {unit && <span className="ml-2 text-base font-bold text-amber-600">{unit}</span>}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 relative z-10">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
            {sub}
        </span>
      </div>
    </div>
  )
}

export default function KpiCards() {
  const [totalEnergy, setTotalEnergy] = useState(0)
  const [activeDevices, setActiveDevices] = useState(0)
  const [anomalies, setAnomalies] = useState(0)
  const [nightRatio, setNightRatio] = useState(0)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard")
      .then(res => res.json())
      .then(data => {
        setTotalEnergy(Number(data.total_energy_kwh || 0))
        setActiveDevices(
          data.device_wise_energy_kwh
            ? Object.keys(data.device_wise_energy_kwh).length
            : 0
        )
        setAnomalies(Array.isArray(data.anomalies) ? data.anomalies.length : 0)
        
        if (Array.isArray(data.raw_records)) {
          const night = data.raw_records.filter((r: any) => r.is_night === 1).length
          const total = data.raw_records.length || 1
          setNightRatio(Math.round((night / total) * 100))
        } else if (data.night_usage_percent) {
            setNightRatio(data.night_usage_percent)
        }
      })
      .catch(err => {
        console.error("Dashboard KPI fetch failed", err)
      })
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Total Energy"
        value={totalEnergy.toFixed(1)}
        unit="kWh"
        icon={Zap}
        color="bg-amber-400"
        sub="Current Month Cycle"
      />

      <Card
        title="Active Nodes"
        value={activeDevices}
        icon={Cpu}
        color="bg-blue-400"
        sub="NILM Disaggregated"
      />

      <Card
        title="Security"
        value={anomalies}
        icon={ShieldCheck}
        color="bg-rose-400"
        sub={anomalies > 0 ? "Threats Detected" : "System Secure"}
      />

      <Card
        title="Night Load"
        value={nightRatio}
        unit="%"
        icon={TrendingUp}
        color="bg-emerald-400"
        sub="Behavioral Pattern"
      />
    </div>
  )
}