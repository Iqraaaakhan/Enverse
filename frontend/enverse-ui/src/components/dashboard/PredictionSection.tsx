import React, { useEffect, useState } from "react"
import { BrainCircuit, Calculator, Info, Sparkles, TrendingUp, Wallet, Zap, ShieldCheck } from "lucide-react"

function PredictionSection() {
  const [power, setPower] = useState<string>("")
  const [duration, setDuration] = useState<string>("")
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Combined State for ML Data
  const [forecast, setForecast] = useState({ 
    next_day_kwh: 0, 
    next_week_kwh: 0, 
    next_month_kwh: 0, 
    mae: "0.33",
    explanations: [] as string[]
  })
  const [nilmLoading, setNilmLoading] = useState<boolean>(true)

  /* ---------- Master Data Fetch (Rule #5: Real-time Sync) ---------- */
  useEffect(() => {
    setNilmLoading(true)
    fetch("http://127.0.0.1:8000/energy/forecast")
      .then(res => res.json())
      .then(data => {
        if (data.status === "ml_prediction") {
          setForecast({
            ...data.forecast,
            mae: data.mae || "0.33",
            explanations: data.explanations || []
          })
        }
      })
      .catch(console.error)
      .finally(() => setNilmLoading(false))
  }, [])

  /* ---------- What-If Prediction Logic ---------- */
  const predict = async () => {
    setError(null); setResult(null)
    if (!power || !duration) return setError("Please enter both values")
    setLoading(true)
    try {
      const res = await fetch(`http://127.0.0.1:8000/energy/predict?power_watts=${Number(power)}&duration_minutes=${Number(duration)}`)
      const data = await res.json()
      setResult(Number(data.predicted_energy_kwh))
    } catch { setError("Prediction failed") } finally { setLoading(false) }
  }

  // Display Logic
  const displayDay = result !== null ? result : forecast.next_day_kwh
  const displayWeek = result !== null ? result * 7 : forecast.next_week_kwh
  const displayMonth = result !== null ? result * 30 : forecast.next_month_kwh
  const TARIFF_PER_KWH = 4.17
  const estimatedBill = (displayMonth * TARIFF_PER_KWH).toFixed(2)

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-xl shadow-amber-200"><BrainCircuit size={24} /></div>
             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">Estimation Engine Active</p>
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">AI Estimation</h2>
        </div>
        <div className="flex flex-wrap gap-2">
           <div className="bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">XGBoost v1.0</span>
           </div>
           <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">MAE: {forecast.mae}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="premium-card p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none"><Calculator size={200} /></div>
            <div className="flex items-center justify-between mb-10 border-b border-slate-50 pb-6">
               <div className="flex items-center gap-3">
                  <TrendingUp className="text-amber-600" size={20} />
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Behavioral Analysis</h4>
               </div>
               {/* New Context Badge - Professional & Subtle */}
               <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                  <ShieldCheck size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Pattern-based Occupancy</span>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Consumption Power</label>
                <div className="relative">
                   <input type="number" placeholder="Watts" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-black text-slate-900 text-xl" value={power} onChange={e => setPower(e.target.value)} />
                   <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">W</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Usage Duration</label>
                <div className="relative">
                   <input type="number" placeholder="Minutes" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-black text-slate-900 text-xl" value={duration} onChange={e => setDuration(e.target.value)} />
                   <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Min</span>
                </div>
              </div>
            </div>
            <button onClick={predict} disabled={loading} className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-2xl active:scale-95 disabled:opacity-50">
              {loading ? "Running Inference..." : "Run AI Estimation"}
            </button>
           {result !== null && (
  <div className="mt-10 p-10 bg-amber-50 rounded-[2.5rem] border border-amber-100 animate-in zoom-in-95 duration-500 flex flex-col md:flex-row items-center justify-between gap-6">
     <div>
        {/* Added 'Single Event' to make it understandable */}
        <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Estimated Consumption (Single Event)</p>
        <div className="flex items-baseline gap-2">
           <span className="text-7xl font-black text-slate-900 tracking-tighter tabular-nums">{result.toFixed(3)}</span>
           <span className="text-lg font-black text-amber-600 uppercase">kWh</span>
        </div>
     </div>
     <div className="text-right">
        <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed italic max-w-[200px]">
          This is the AI's estimate for this specific usage duration.
        </p>
     </div>
  </div>
)}
            {error && <div className="mt-6 text-rose-500 font-bold text-sm bg-rose-50 p-5 rounded-2xl border border-rose-100">{error}</div>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[ 
              { l: 'Next Day', v: displayDay }, 
              { l: 'Next Week', v: displayWeek }, 
              { l: 'Next Month', v: displayMonth } 
            ].map((f, i) => (
              <div key={i} className="premium-card p-8 flex flex-col gap-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.l}</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{Number(f.v).toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-amber-600 uppercase italic">kWh</span>
                 </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="premium-card p-10 bg-slate-900 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 p-4 opacity-10"><Wallet size={120} /></div>
             <div className="flex items-center gap-3 mb-8">
                <Wallet className="text-amber-400" size={20} />
                <h4 className="text-sm font-black uppercase tracking-widest">Monthly Bill Est.</h4>
             </div>
             <div className="flex items-baseline gap-3 mb-8">
                <span className="text-6xl font-black tracking-tighter tabular-nums">₹{estimatedBill}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">INR</span>
             </div>
             <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">Calculated using Indian Tariff @ ₹4.17 per unit</p>
             </div>
          </div>

          <div className="premium-card p-10">
            <div className="flex items-center gap-3 mb-8">
              <Info className="text-blue-500" size={20} />
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">AI Observations</h4>
            </div>
            <ul className="space-y-6">
              {nilmLoading ? <p className="text-xs font-bold text-slate-400 italic">Analyzing disaggregation...</p> : 
               forecast.explanations.map((ex, i) => (
                <li key={i} className="flex gap-4 group">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed transition-colors group-hover:text-slate-900">{ex}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PredictionSection