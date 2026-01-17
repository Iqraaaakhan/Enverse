import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  ShieldAlert,
  Cpu,
  Menu,
  X,
  Radio,
  Waves,
  FileBarChart,
  Activity
} from "lucide-react"
import type { DashboardResponse } from "./types/dashboard"

import KpiCards from "./components/dashboard/KpiCards"
import DeviceEnergyCharts from "./components/dashboard/DeviceEnergyCharts"
import EnergySummarySection from "./components/dashboard/EnergySummarySection"
import AnomalySection from "./components/dashboard/AnomalySection"
import PredictionSection from "./components/dashboard/PredictionSection"
import AiIntelligenceHub from "./components/dashboard/AiIntelligenceHub"

import ChatBot from "./components/dashboard/ChatBot"

type Section = "dashboard" | "summary" | "anomalies" | "prediction"

function App() {
  const [raw, setRaw] = useState<DashboardResponse | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>("dashboard")
  
  // REAL BACKEND STATUS STATE
  const [systemStatus, setSystemStatus] = useState("Offline")
  const [aiStatus, setAiStatus] = useState("Inactive")

  // 1. Fetch Dashboard Data
  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard")
      .then(res => res.json())
      .then(setRaw)
      .catch(console.error)
  }, [])

  // 2. Fetch System Health (REAL BACKEND CONNECTION)
  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then(res => res.json())
      .then(data => {
        setSystemStatus(data.status === "ok" ? "Online" : "Error")
        setAiStatus(data.ai_models === "active" ? "Active" : "Loading")
      })
      .catch(() => {
        setSystemStatus("Offline")
        setAiStatus("Unreachable")
      })
  }, [])

  if (!raw) {
    return (
      <div className="h-screen flex items-center justify-center font-black text-amber-600 animate-pulse bg-[#fcfaf7] tracking-[0.4em] text-2xl">
        ENVERSE AI
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fdfcfb] w-full overflow-x-hidden font-sans text-slate-900 bg-grid-pattern">

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Waves size={24} className="text-slate-900" />
          <h1 className="font-black uppercase italic text-xl tracking-tighter">ENVERSE</h1>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 bg-slate-900 text-white rounded-lg"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SIDEBAR (Shrunk to w-56 for more chart space) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative w-56 bg-white border-r border-slate-100 p-4 flex flex-col transition-transform duration-300 ease-in-out h-screen shadow-xl md:shadow-none`}
      >
        <div className="hidden md:flex items-center gap-3 mb-10 mt-4 px-2">
          <div className="p-2 bg-slate-900 text-white rounded-lg shadow-md">
            <Waves size={22} />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter text-slate-900">
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
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 group ${
                activeSection === id
                  ? "bg-slate-900 text-white shadow-lg"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={20} className={activeSection === id ? "text-amber-400" : "text-slate-400 group-hover:text-slate-900"} />
              <span className="uppercase tracking-wider text-xs">
                {label}
              </span>
            </button>
          ))}
        </nav>

        {/* REAL BACKEND STATUS WIDGET */}
        <div className="mt-auto pt-6 border-t border-slate-50">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine Status</p>
                <Activity size={14} className={systemStatus === "Online" ? "text-emerald-500" : "text-rose-500"} />
            </div>
            <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${systemStatus === "Online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                <span className="text-sm font-bold text-slate-700">{systemStatus}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium">
                AI Models: {aiStatus}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 w-full overflow-x-hidden h-screen overflow-y-auto">
        
        {/* HEADER - RESTORED TO "DASHBOARD" */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
              Dashboard
            </h2>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              Real-time Energy Intelligence
            </p>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-slate-100 shadow-sm">
                <Radio size={16} className="text-amber-600 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider">NILM Active</span>
             </div>
          </div>
        </header>

        {/* DYNAMIC CONTENT AREA */}
        <div className="space-y-6 pb-20">
          
          {activeSection === "dashboard" && (
            <div className="flex flex-col gap-6">
              
              {/* 1. KPIs (Top Row) - Compacted */}
              <KpiCards />

              {/* 2. CHARTS (Side by Side) */}
              <DeviceEnergyCharts 
                devices={data.deviceEnergy} 
                activeCount={data.activeDevices} 
              />

              {/* 3. AI CONSOLE (Bottom Row) - Fog Removed */}
              <AiIntelligenceHub />
              
            </div>
          )}

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