import { useEffect, useState } from "react"
import { Activity, CheckCircle2, ShieldCheck, Zap } from "lucide-react"

type Metrics = {
  RMSE: number
  MAE: number
  R2_Score: number
  MAPE: number
  Explained_Variance_Pct?: number
}

type ModelRun = {
  model: string
  timestamp: string
  dataset: string
  metrics: Metrics
}

type HealthData = Record<string, ModelRun>

export default function ModelHealthPanel() {
  const [data, setData] = useState<HealthData | null>(null)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/model-health")
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  if (!data || Object.keys(data).length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {Object.values(data).map((run) => {
        // Use "Model Reliability" derived from R2
        const reliability = run.metrics.Explained_Variance_Pct ?? (run.metrics.R2_Score * 100)
        const isHighConf = reliability > 90

        return (
          <div key={run.model} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${run.model.includes("Forecast") ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                  {run.model.includes("Forecast") ? <Zap size={18} /> : <Activity size={18} />}
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">{run.model}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{run.dataset}</p>
                </div>
              </div>
              {isHighConf && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                  <ShieldCheck size={12} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Verified</span>
                </div>
              )}
            </div>

            {/* Main Stat: Reliability */}
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model Reliability</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">{reliability.toFixed(2)}%</span>
              </div>
              {/* Sleek Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${isHighConf ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${reliability}%` }}
                />
              </div>
            </div>

            {/* Technical Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">R² Score</p>
                <p className="text-sm font-black text-slate-700">{run.metrics.R2_Score}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">RMSE</p>
                <p className="text-sm font-black text-slate-700">{run.metrics.RMSE}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">MAE</p>
                <p className="text-sm font-black text-slate-700">{run.metrics.MAE}</p>
              </div>
            </div>
            
            <div className="mt-3 text-[9px] text-slate-300 font-medium text-right">
                Last trained: {run.timestamp}
            </div>
          </div>
        )
      })}
    </div>
  )
}