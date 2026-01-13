import { useEffect, useState } from "react"
import { LayoutDashboard, Activity, ShieldAlert, Cpu, Menu, X, Radio, Waves, FileBarChart } from "lucide-react"
import type { DashboardResponse } from "./types/dashboard"
import KpiCards from "./components/dashboard/KpiCards"
import AnomalySection from "./components/dashboard/AnomalySection"
import EnergySummarySection from "./components/dashboard/EnergySummarySection"
import PredictionSection from "./components/dashboard/PredictionSection"
import DeviceEnergyCharts from "./components/dashboard/DeviceEnergyCharts"
import ChatBot from "./components/dashboard/ChatBot"

type Section = "dashboard" | "summary" | "anomalies" | "prediction"

function App() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>("dashboard")

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard").then(res => res.json()).then(setData).catch(console.error)
  }, [])

  if (!data) return <div className="h-screen flex items-center justify-center font-black text-amber-600 animate-pulse bg-[#fcfaf7] tracking-[1em]">ENVERSE</div>

  const nav = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "summary", label: "Analytics", icon: FileBarChart },
    { id: "anomalies", label: "Security", icon: ShieldAlert },
    { id: "prediction", label: "Predictor", icon: Cpu }
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fdfcfb] w-full overflow-x-hidden">
      
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white border-b border-slate-100 sticky top-0 z-[60] w-full">
        <div className="flex items-center gap-2">
           <Waves className="text-slate-900" size={20} />
           <h1 className="font-black text-lg tracking-tighter italic uppercase text-slate-900">ENVERSE</h1>
        </div>
        <button onClick={() => setMenuOpen(true)} className="p-2 bg-slate-900 text-white rounded-lg shrink-0 active:scale-95">
          <Menu size={20}/>
        </button>
      </div>

      {/* SIDEBAR - Liquid scaling for mobile */}
      <aside className={`fixed inset-0 z-[100] md:relative md:translate-x-0 transition-all duration-500 transform ${menuOpen ? "translate-x-0 w-full" : "-translate-x-full w-80"} md:w-80 bg-white border-r border-slate-100 p-8 md:p-10 flex flex-col`}>
        
        <button onClick={() => setMenuOpen(false)} className="md:hidden absolute top-6 right-6 p-3 bg-slate-100 rounded-full text-slate-900 active:bg-slate-200 shadow-sm"><X size={24} /></button>

        <div className="mb-12 mt-10 md:mt-0">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-slate-900 rounded-2xl text-white shadow-xl"><Waves size={24} /></div>
             <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none whitespace-nowrap pr-4">
                EN<span className="font-bold text-amber-900 italic">VERSE</span>
             </h1>
          </div>
          <p className="text-[9px] md:text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] mt-3 ml-1">Energy Intelligence</p>
        </div>

        <nav className="space-y-2 flex-1">
          {nav.map(({id, label, icon: Icon}) => (
            <button key={id} onClick={() => { setActiveSection(id as Section); setMenuOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 ${activeSection === id ? "bg-slate-900 text-white shadow-2xl translate-x-1" : "text-slate-400 hover:bg-slate-50"}`}>
              <Icon size={18} className="shrink-0" />
              <span className="text-xs md:text-sm uppercase tracking-widest truncate">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-8 md:p-14 lg:p-20 w-full overflow-x-hidden">
        <header className="mb-12 md:mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></div>
              <p className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">Engine Active</p>
            </div>
            <div className="relative"> 
              <h2 className="text-4xl sm:text-7xl md:text-9xl font-black text-slate-900 tracking-tighter leading-none italic uppercase whitespace-nowrap pr-[0.2em]">
                EN<span className="text-amber-900 font-bold opacity-40">VERSE</span>
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-full shadow-sm border border-slate-100 self-start lg:self-auto">
            <Radio className="text-amber-600 animate-pulse shrink-0" size={16} />
            <div className="flex flex-col">
               <span className="text-[12px] font-black text-slate-900 leading-none uppercase italic">NILM Scan</span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 whitespace-nowrap">Real-time disaggregation</span>
            </div>
          </div>
        </header>

        <div className="space-y-12 md:space-y-16">
          {activeSection === "dashboard" && (
            <>
              <KpiCards totalEnergy={data.total_energy_kwh} activeDevices={data.active_devices} anomalies={data.anomaly_count} />
              <DeviceEnergyCharts devices={data.device_wise_energy_kwh} activeCount={data.active_devices} />
            </>
          )}
          {activeSection === "summary" && <EnergySummarySection devices={data.device_wise_energy_kwh} />}
          {activeSection === "anomalies" && <AnomalySection anomalies={data.anomalies} />}
          {activeSection === "prediction" && <PredictionSection />}
        </div>
      </main>

      {/* ELITE CHATBOT SIDEBAR PANEL */}
      <ChatBot />
    </div>
  )
}

export default App