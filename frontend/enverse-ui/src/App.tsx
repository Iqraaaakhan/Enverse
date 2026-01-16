import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  ShieldAlert,
  Cpu,
  Menu,
  X,
  Radio,
  Waves,
  FileBarChart
} from "lucide-react"

import type { DashboardResponse } from "./types/dashboard"

import KpiCards from "./components/dashboard/KpiCards"
import AnomalySection from "./components/dashboard/AnomalySection"
import EnergySummarySection from "./components/dashboard/EnergySummarySection"
import PredictionSection from "./components/dashboard/PredictionSection"
import DeviceEnergyCharts from "./components/dashboard/DeviceEnergyCharts"
import ChatBot from "./components/dashboard/ChatBot"

type Section = "dashboard" | "summary" | "anomalies" | "prediction"

function App() {
  const [raw, setRaw] = useState<DashboardResponse | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>("dashboard")

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard")
      .then(res => res.json())
      .then(setRaw)
      .catch(console.error)
  }, [])

  if (!raw) {
    return (
      <div className="h-screen flex items-center justify-center font-black text-amber-600 animate-pulse bg-[#fcfaf7] tracking-[0.4em]">
        ENVERSE
      </div>
    )
  }

  /* 🔥 SINGLE SOURCE OF TRUTH (THIS FIXES EVERYTHING) */
  const data = {
    totalEnergy: raw.total_energy_kwh ?? 0,
    activeDevices: raw.active_devices ?? 0,
    anomalyCount: raw.anomaly_count ?? 0,
    deviceEnergy: raw.device_wise_energy_kwh ?? {},
    anomalies: raw.anomalies ?? []
  }

  const nav = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "summary", label: "Analytics", icon: FileBarChart },
    { id: "anomalies", label: "Security", icon: ShieldAlert },
    { id: "prediction", label: "Predictor", icon: Cpu }
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fdfcfb] w-full overflow-x-hidden">

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white border-b border-slate-100 sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <Waves size={20} />
          <h1 className="font-black uppercase italic">ENVERSE</h1>
        </div>
        <button onClick={() => setMenuOpen(true)} className="p-2 bg-slate-900 text-white rounded-lg">
          <Menu size={20} />
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-0 z-[100] md:relative transition-transform duration-500 ${
        menuOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 w-80 bg-white border-r border-slate-100 p-8`}>

        <button onClick={() => setMenuOpen(false)} className="md:hidden absolute top-6 right-6">
          <X size={22} />
        </button>

        <nav className="space-y-2 mt-20">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveSection(id as Section); setMenuOpen(false) }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition ${
                activeSection === id
                  ? "bg-slate-900 text-white"
                  : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              <span className="uppercase tracking-widest text-xs">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 sm:p-8 md:p-14 lg:p-20">

        <header className="mb-16 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Engine Active
            </p>
            <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter">
              EN<span className="text-amber-900 opacity-40">VERSE</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border">
            <Radio size={14} className="text-amber-600 animate-pulse" />
            <span className="text-xs font-black uppercase">NILM Scan</span>
          </div>
        </header>

        <div className="space-y-16">
          {activeSection === "dashboard" && (
            <>
              <KpiCards
                totalEnergy={data.totalEnergy}
                activeDevices={data.activeDevices}
                anomalies={data.anomalyCount}
              />

              <DeviceEnergyCharts
                devices={data.deviceEnergy}
                activeCount={data.activeDevices}
              />
            </>
          )}

          {activeSection === "summary" && (
            <EnergySummarySection devices={data.deviceEnergy} />
          )}

          {activeSection === "anomalies" && (
            <AnomalySection anomalies={data.anomalies} />
          )}

          {activeSection === "prediction" && (
            <PredictionSection />
          )}
        </div>
      </main>

      <ChatBot />
    </div>
  )
}

export default App
