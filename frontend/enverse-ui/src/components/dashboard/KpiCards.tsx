import { useEffect, useState } from "react"
import { Zap, Cpu, ShieldCheck, TrendingUp } from "lucide-react"

function Card({ title, value, unit, icon: Icon, color, sub }: any) {
  return (
    <div className="premium-card p-6 flex flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-black uppercase">{title}</span>
      </div>

      <div className="mt-4">
        <span className="text-4xl font-black">{value}</span>
        {unit && <span className="ml-1 text-sm text-amber-700">{unit}</span>}
      </div>

      <span className="text-xs text-slate-400 uppercase mt-2">{sub}</span>
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
        // --- TOTAL ENERGY ---
        setTotalEnergy(Number(data.total_energy_kwh || 0))

        // --- ACTIVE DEVICES ---
        setActiveDevices(
          data.device_wise_energy_kwh
            ? Object.keys(data.device_wise_energy_kwh).length
            : 0
        )

        // --- ANOMALIES ---
        setAnomalies(Array.isArray(data.anomalies) ? data.anomalies.length : 0)

        // --- NIGHT USAGE (DERIVED, NOT FAKE) ---
        if (Array.isArray(data.raw_records)) {
          const night = data.raw_records.filter((r: any) => r.is_night === 1).length
          const total = data.raw_records.length || 1
          setNightRatio(Math.round((night / total) * 100))
        }
      })
      .catch(err => {
        console.error("Dashboard KPI fetch failed", err)
      })
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        title="Total Energy (Month)"
        value={totalEnergy.toFixed(1)}
        unit="kWh"
        icon={Zap}
        color="bg-amber-400"
        sub="Single Home"
      />

      <Card
        title="Active Devices"
        value={activeDevices}
        icon={Cpu}
        color="bg-blue-400"
        sub="Detected"
      />

      <Card
        title="Security Alerts"
        value={anomalies}
        icon={ShieldCheck}
        color="bg-rose-400"
        sub={anomalies > 0 ? "Attention Required" : "Normal"}
      />

      <Card
        title="Night Usage"
        value={nightRatio}
        unit="%"
        icon={TrendingUp}
        color="bg-emerald-400"
        sub="Behavioral Insight"
      />
    </div>
  )
}
