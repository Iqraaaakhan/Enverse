import { useEffect, useState } from "react"
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  BrainCircuit, 
  GitBranch, 
  Clock, 
  CheckCircle2,
  Cpu,
  Server
} from "lucide-react"
import { motion } from "framer-motion"

// --- TYPES ---
type Metrics = {
  RMSE?: number
  MAE?: number
  R2_Score?: number
  MAPE?: number
  Explained_Variance_Pct?: number
}

type ModelRun = {
  model: string
  timestamp: string
  dataset: string
  metrics: Metrics
}

type HealthData = Record<string, ModelRun>

// --- CONFIGURATION ---
const MODEL_CONFIG: Record<string, { title: string; type: string; desc: string; icon: any; color: string }> = {
  "Energy Forecast XGBoost": {
    title: "Core Inference Engine",
    type: "XGBoost Regressor",
    desc: "High-precision real-time load estimation.",
    icon: Zap,
    color: "emerald"
  },
  "NILM Disaggregator": {
    title: "NILM Signature Extractor",
    type: "Signal Disaggregation",
    desc: "Appliance-level consumption breakdown.",
    icon: Activity,
    color: "blue"
  },
  "Anomaly Detector": {
    title: "Grid Anomaly Sentinel",
    type: "Isolation Forest",
    desc: "Unsupervised outlier detection stream.",
    icon: ShieldCheck,
    color: "rose"
  },
  "Rolling Forecast XGBoost": {
    title: "Adaptive Rolling Predictor",
    type: "Dynamic Windowing",
    desc: "Short-term trend adaptation model.",
    icon: GitBranch,
    color: "amber"
  },
  "Daily Forecast XGBoost": {
    title: "Macro-Trend Forecaster",
    type: "Time-Series Regression",
    desc: "Long-horizon daily load prediction.",
    icon: BrainCircuit,
    color: "purple" // 🌟 CHANGED: From 'indigo' to 'purple' (lavender tone)
  }
}

const DEFAULT_CONFIG = {
  title: "ML Model Node",
  type: "Generic Estimator",
  desc: "Active machine learning pipeline.",
  icon: Server,
  color: "red"
}

// --- SUB-COMPONENT: RADIAL GAUGE ---
const RadialGauge = ({ score, color }: { score: number, color: string }) => {
  // 🌟 SAFETY: Clamp between 0-100 to avoid visual bugs
  const safeScore = isNaN(score) ? 0 : Math.min(Math.max(score, 0), 100)
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safeScore / 100) * circumference
  
  const colors: any = {
    emerald: "stroke-emerald-500",
    blue: "stroke-blue-500",
    rose: "stroke-rose-500",
    amber: "stroke-amber-500",
    indigo: "stroke-indigo-500",
    purple: "stroke-purple-500",
    gray: "stroke-gray-600",
    slate: "stroke-slate-500"
  }

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="32" cy="32" r={radius}
          stroke="currentColor"
          strokeWidth="5"
          fill="transparent"
          className="text-slate-100"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx="32" cy="32" r={radius}
          stroke="currentColor"
          strokeWidth="5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          className={colors[color] || "stroke-slate-900"}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        {/* 🌟 SAFETY: Show 1 decimal place (99.7%) instead of 100% to look real */}
        <span className="text-[10px] font-black text-slate-900">{safeScore.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export default function ModelHealthPanel() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/model-health")
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="flex flex-wrap gap-6 justify-center">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full md:w-[calc(50%-12px)] xl:w-[calc(33.33%-16px)] h-48 rounded-[2rem] bg-slate-50 border border-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const sortedKeys = Object.keys(data).sort((a, b) => {
    const scoreA = data[a]?.metrics?.R2_Score ?? 0
    const scoreB = data[b]?.metrics?.R2_Score ?? 0
    return scoreB - scoreA
  })

  return (
    // 🌟 LAYOUT FIX: Flexbox with centering handles 5 items perfectly (3 top, 2 bottom centered)
    <div className="flex flex-wrap gap-6 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      {sortedKeys.map((key, index) => {
        const run = data[key]
        const configKey = Object.keys(MODEL_CONFIG).find(k => key.includes(k))
        const config = configKey ? MODEL_CONFIG[configKey] : DEFAULT_CONFIG
        
        const r2 = run.metrics.R2_Score ?? 0
        const reliability = run.metrics.Explained_Variance_Pct ?? (r2 * 100)
        const isHighConf = reliability > 80
        const isAnomaly = key.includes("Anomaly")

        // 🌟 THEME: Added Indigo, Purple & Gray
        const bgColors: any = {
          emerald: "bg-emerald-50/40 border-emerald-100 hover:border-emerald-200",
          blue: "bg-blue-50/40 border-blue-100 hover:border-blue-200",
          rose: "bg-rose-50/40 border-rose-100 hover:border-rose-200",
          amber: "bg-amber-50/40 border-amber-100 hover:border-amber-200",
          indigo: "bg-indigo-50/40 border-indigo-100 hover:border-indigo-200",
          purple: "bg-purple-50/40 border-purple-100 hover:border-purple-200",
          gray: "bg-gray-100 border-gray-200 hover:border-gray-300",
          slate: "bg-slate-50/40 border-slate-100 hover:border-slate-200"
        }
        
        const iconColors: any = {
          emerald: "text-emerald-600 bg-emerald-100",
          blue: "text-blue-600 bg-blue-100",
          rose: "text-rose-600 bg-rose-100",
          amber: "text-amber-600 bg-amber-100",
          indigo: "text-indigo-600 bg-indigo-100",
          purple: "text-purple-600 bg-purple-100",
          gray: "text-gray-700 bg-gray-100",
          slate: "text-slate-600 bg-slate-100"
        }

        return (
          <motion.div 
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            // 🌟 LAYOUT: Responsive width calculation
            className={`relative p-6 rounded-[2rem] border ${bgColors[config.color] || bgColors.slate} transition-all duration-300 group hover:shadow-lg hover:-translate-y-1 w-full md:w-[calc(50%-12px)] xl:w-[calc(33.33%-16px)]`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div className="flex gap-4">
                <div className={`p-3 rounded-2xl h-fit ${iconColors[config.color] || iconColors.slate}`}>
                  <config.icon size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">{config.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isHighConf ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{config.type}</p>
                  </div>
                </div>
              </div>
              
              <div className="-mt-1 -mr-1">
                <RadialGauge score={reliability} color={config.color} />
              </div>
            </div>

            <p className="text-xs font-medium text-slate-600 mb-6 leading-relaxed min-h-[2.5em]">
              {config.desc}
            </p>

            {/* Metrics Grid */}
            {!isAnomaly ? (
              <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-200/60 border-dashed">
                <div>
                  {/* 🌟 SAFETY: Renamed "Accuracy" to "R² Score" */}
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">R² Score</p>
                  <p className="text-sm font-black text-slate-800">{r2.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">RMSE</p>
                  <p className="text-sm font-black text-slate-800">{run.metrics.RMSE ? run.metrics.RMSE.toFixed(4) : '--'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">MAE</p>
                  <p className="text-sm font-black text-slate-800">{run.metrics.MAE ? run.metrics.MAE.toFixed(4) : '--'}</p>
                </div>
              </div>
            ) : (
               <div className="py-3 border-t border-slate-200/60 border-dashed flex items-center gap-2">
                  <Activity size={14} className="text-rose-500" />
                  <p className="text-xs font-bold text-slate-600">Active Monitoring • Unsupervised Stream</p>
               </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-2">
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock size={10} />
                  <span>Updated: {run.timestamp ? run.timestamp.split(" ")[0] : "Just now"}</span>
               </div>
               {isHighConf && (
                 <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-md shadow-sm border border-slate-100">
                    <CheckCircle2 size={10} className="text-emerald-500" />
                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-wider">Verified</span>
                 </div>
               )}
            </div>

          </motion.div>
        )
      })}
    </div>
  )
}