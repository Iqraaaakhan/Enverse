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
import DeviceEnergyCharts from "./components/dashboard/DeviceEnergyCharts"
import EnergySummarySection from "./components/dashboard/EnergySummarySection"
import AnomalySection from "./components/dashboard/AnomalySection"
import PredictionSection from "./components/dashboard/PredictionSection"
import AiReasoningPanel from "./components/dashboard/AiReasoningPanel"
import AiEnergyTimeline from "./components/dashboard/AiEnergyTimeline"

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
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 bg-slate-900 text-white rounded-lg"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-0 z-[100] md:relative transition-transform duration-500 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 w-64 bg-white border-r border-slate-100 p-6 flex flex-col`}
      >
        <button
          onClick={() => setMenuOpen(false)}
          className="md:hidden absolute top-6 right-6"
        >
          <X size={22} />
        </button>

        <div className="hidden md:flex items-center gap-2 mb-12 mt-4">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <Waves size={20} />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter text-slate-900">
            ENVERSE
          </h1>
        </div>

        <nav className="space-y-2 flex-1">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveSection(id as Section)
                setMenuOpen(false)
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 ${
                activeSection === id
                  ? "bg-slate-900 text-white shadow-lg translate-x-1"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <Icon size={18} />
              <span className="uppercase tracking-widest text-[10px] md:text-xs">
                {label}
              </span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-300 text-center uppercase tracking-widest">
            v2.0 Stable
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 sm:p-8 md:p-12 lg:p-16 w-full overflow-x-hidden">
        <header className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Engine Active
            </p>
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.8]">
              EN
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700/40 to-amber-900/10">
                VERSE
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-slate-100 shadow-sm">
            <Radio size={16} className="text-amber-600 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase leading-none">
                NILM Scan
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Live Feed
              </span>
            </div>
          </div>
        </header>

        <div className="space-y-12 md:space-y-16">
       <>
  <KpiCards
    totalEnergy={data.totalEnergy}
    activeDevices={data.activeDevices}
    anomalies={data.anomalyCount}
  />

  <AiReasoningPanel />

  {/* FEATURE 2: Explainable AI Timeline */}
  <AiEnergyTimeline />

  <DeviceEnergyCharts
    devices={data.deviceEnergy}
    activeCount={data.activeDevices}
  />
</>



          {activeSection === "summary" && (
            <EnergySummarySection devices={data.deviceEnergy} />
          )}

          {activeSection === "anomalies" && (
            <AnomalySection anomalies={data.anomalies} />
          )}

          {activeSection === "prediction" && <PredictionSection />}
        </div>
      </main>

      <ChatBot />
    </div>
  )
}

export default App
