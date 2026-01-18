import { useEffect, useState } from "react"
import { Activity, ShieldCheck, Zap, BrainCircuit } from "lucide-react"

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

  const getCardProps = (modelName: string) => {
    const isIso = modelName.toLowerCase().includes("isolation")
    return {
      spanClass: isIso ? "lg:col-span-1" : "lg:col-span-2",
      isIso
    }
  }

  const sortedKeys = Object.keys(data).sort((a, b) => {
    if (a.includes("Forecast")) return -1
    if (b.includes("Forecast")) return 1
    if (a.includes("NILM")) return -1
    if (b.includes("NILM")) return 1
    return 0
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {sortedKeys.map((key) => {
        const run = data[key]
        const { spanClass, isIso } = getCardProps(run.model)
        
        const reliability = run.metrics.Explained_Variance_Pct ?? (run.metrics.R2_Score * 100)
        const isHighConf = reliability > 90

        return (
          <div 
            key={run.model} 
            className={`bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${spanClass}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  run.model.includes("Forecast") ? "bg-amber-50 text-amber-600" : 
                  isIso ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                }`}>
                  {run.model.includes("Forecast") ? <Zap size={18} /> : 
                   isIso ? <BrainCircuit size={18} /> : <Activity size={18} />}
                </div>
                <div className="min-w-0">
                  <h4 className={`font-black uppercase tracking-tight text-slate-900 truncate ${isIso ? "text-[10px]" : "text-sm"}`}>
                    {isIso ? "Anomaly Detector" : run.model}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                    {isIso ? "Unsupervised" : "Supervised"}
                  </p>
                </div>
              </div>
              
              {!isIso && isHighConf && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 shrink-0">
                  <ShieldCheck size={12} />
                  <span className="text-[9px] font-black uppercase tracking-wider">Verified</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reliability</span>
                <span className={`font-black text-slate-900 tracking-tighter ${isIso ? "text-2xl" : "text-3xl"}`}>
                  {reliability.toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${isHighConf ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${reliability}%` }}
                />
              </div>
            </div>

            {!isIso ? (
              <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4 mt-auto">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">R² Score</p>
                  <p className="text-xs font-black text-slate-700">{run.metrics.R2_Score}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">RMSE</p>
                  <p className="text-xs font-black text-slate-700">{run.metrics.RMSE}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">MAE</p>
                  <p className="text-xs font-black text-slate-700">{run.metrics.MAE}</p>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-50 pt-3 mt-auto">
                 <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                    Active. Monitoring deviation from learned baseline patterns.
                 </p>
              </div>
            )}
            
            {!isIso && (
                <div className="mt-3 text-[8px] text-slate-300 font-medium text-right truncate">
                    Updated: {run.timestamp.split(" ")[0]}
                </div>
            )}
          </div>
        )
      })}
    </div>
  )
}