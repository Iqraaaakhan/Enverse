import { useEffect, useState } from "react"
import type { DashboardResponse } from "./types/dashboard"

import MobileHeader from "./components/layout/MobileHeader"

import KpiCards from "./components/dashboard/KpiCards"
import AnomalySection from "./components/dashboard/AnomalySection"
import EnergySummarySection from "./components/dashboard/EnergySummarySection"
import PredictionSection from "./components/dashboard/PredictionSection"
import DeviceEnergyCharts from "./components/dashboard/DeviceEnergyCharts"

/* ---------------- App ---------------- */

type Section = "dashboard" | "summary" | "anomalies" | "prediction"

function App() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>("dashboard")

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard")
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  if (!data) return <div className="p-10">Loading…</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100">
      <MobileHeader onMenu={() => setMenuOpen(true)} />

      <div className="flex">
        {/* ---------------- Mobile Drawer ---------------- */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />

            <aside className="relative w-64 h-full bg-white p-6 shadow-2xl rounded-r-2xl">
              <h2 className="text-sm text-gray-400 mb-6">MENU</h2>

              <ul className="space-y-2 font-medium">
                {(["dashboard", "summary", "anomalies", "prediction"] as Section[]).map(
                  section => (
                    <li
                      key={section}
                      className={`px-3 py-2 rounded-lg cursor-pointer transition ${
                        activeSection === section
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-slate-100"
                      }`}
                      onClick={() => {
                        setActiveSection(section)
                        setMenuOpen(false)
                      }}
                    >
                      {section === "dashboard"
                        ? "Dashboard"
                        : section === "summary"
                        ? "Energy Summary"
                        : section === "anomalies"
                        ? "Anomalies"
                        : "Prediction"}
                    </li>
                  )
                )}
              </ul>
            </aside>
          </div>
        )}

        {/* ---------------- Desktop Sidebar ---------------- */}
        <aside className="hidden md:block w-64 bg-white p-6 border-r">
          <h2 className="text-sm text-gray-400 mb-4">MENU</h2>
          <ul className="space-y-3 font-medium">
            {(["dashboard", "summary", "anomalies", "prediction"] as Section[]).map(
              section => (
                <li
                  key={section}
                  className={`cursor-pointer ${
                    activeSection === section ? "text-blue-600" : ""
                  }`}
                  onClick={() => setActiveSection(section)}
                >
                  {section === "dashboard"
                    ? "Dashboard"
                    : section === "summary"
                    ? "Energy Summary"
                    : section === "anomalies"
                    ? "Anomalies"
                    : "Prediction"}
                </li>
              )
            )}
          </ul>
        </aside>

        {/* ---------------- Main Content ---------------- */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto">
          
          {activeSection === "dashboard" && (
            <div className="space-y-8">
              <KpiCards
                totalEnergy={data.total_energy_kwh}
                activeDevices={data.active_devices}
                anomalies={data.anomaly_count}
              />

              <DeviceEnergyCharts
                devices={data.device_wise_energy_kwh}
              />
            </div>
          )}

          {activeSection === "summary" && (
            <EnergySummarySection
              devices={data.device_wise_energy_kwh}
            />
          )}

          {activeSection === "anomalies" && (
            <AnomalySection
              anomalies={data.anomalies}
            />
          )}

          {activeSection === "prediction" && <PredictionSection />}

        </main>
      </div>
    </div>
  )
}

export default App
