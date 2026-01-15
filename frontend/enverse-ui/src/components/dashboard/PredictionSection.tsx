import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  Calculator,
  Info,
  Wallet,
  ShieldCheck,
  PlugZap,
  Clock,
  Thermometer
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

// Appliances supported by your ML Model
const APPLIANCES = [
  "HVAC",
  "Refrigerator",
  "Washing Machine",
  "Dishwasher",
  "Electronics",
  "Lighting"
];

function PredictionSection() {
  // Real AI Inputs
  const [appliance, setAppliance] = useState(APPLIANCES[0]);
  const [duration, setDuration] = useState("60");
  const [temperature, setTemperature] = useState("24");
  
  // Optional Physics Input
  const [power, setPower] = useState(""); 

  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forecast, setForecast] = useState({
    next_day_kwh: 0,
    next_week_kwh: 0,
    next_month_kwh: 0,
    mae: "—",
    explanations: [] as string[],
  });

  const [nilmLoading, setNilmLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/energy/forecast`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.forecast) {
          setForecast({
            next_day_kwh: data.forecast.next_day_kwh || 0,
            next_week_kwh: data.forecast.next_week_kwh || 0,
            next_month_kwh: data.forecast.next_month_kwh || 0,
            mae: data.mae || "—",
            explanations: data.explanations || [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setNilmLoading(false));
  }, []);

  const predict = async () => {
    setError(null);
    setResult(null);

    if (!duration) {
      setError("Please enter duration");
      return;
    }

    setLoading(true);

    try {
      // REAL AI PAYLOAD: Sending the actual selected appliance
      const payload = {
        appliance: appliance, 
        usage_duration_minutes: Number(duration),
        temperature_setting_C: Number(temperature),
        occupancy_flag: 1,
        season: "Summer",
        day_of_week: "Monday",
        holiday: 0,
      };

      const res = await fetch(`${API_BASE}/api/estimate-energy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();
      // Using 'estimated_kwh' because that is what main.py returns
      setResult(Number(data.estimated_kwh));
    } catch {
      setError("Prediction failed. Backend not responding.");
    } finally {
      setLoading(false);
    }
  };

  const displayMonth = result ? result * 30 : forecast.next_month_kwh;
 const kwhToBill = result !== null ? result : forecast.next_month_kwh;
const estimatedBill = (kwhToBill * 10).toFixed(2); // ₹10 per unit is realistic

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-xl">
              <BrainCircuit size={24} />
            </div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">
              Estimation Engine Active
            </p>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter">
            AI Estimator
          </h2>
        </div>

        <div className="flex gap-2">
          <div className="bg-white px-4 py-2 rounded-full border flex items-center gap-2 shadow-sm">
            <ShieldCheck size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase text-slate-600">
              Random Forest v1.0
            </span>
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
            <span className="text-[10px] font-black uppercase text-emerald-700">
              MAE: {forecast.mae}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="premium-card p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Calculator size={180} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 relative z-10">
              
              {/* Appliance Selector (Critical for Real AI) */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <PlugZap size={12} /> Device Type
                 </label>
                 <select 
                    value={appliance}
                    onChange={(e) => setAppliance(e.target.value)}
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-lg outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors text-slate-900"
                 >
                    {APPLIANCES.map(app => (
                        <option key={app} value={app}>{app}</option>
                    ))}
                 </select>
              </div>

              {/* Duration Input */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Clock size={12} /> Duration (Mins)
                 </label>
                 <input
                    type="number"
                    placeholder="60"
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-900"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                 />
              </div>

              {/* Temperature Input */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Thermometer size={12} /> Temp ({temperature}°C)
                 </label>
                 <input
                    type="range"
                    min="16"
                    max="32"
                    className="w-full h-16 bg-slate-50 rounded-3xl accent-amber-600 cursor-pointer p-4 border border-slate-100"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                 />
              </div>

              {/* Watts Input (Optional/Reference) */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rated Power (Watts)</label>
                 <input
                    type="number"
                    placeholder="Optional"
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-900"
                    value={power}
                    onChange={(e) => setPower(e.target.value)}
                 />
              </div>
            </div>

            <button
              onClick={predict}
              disabled={loading}
              className="w-full md:w-auto px-12 py-5 bg-slate-900 hover:bg-amber-600 text-white rounded-[1.8rem] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
            >
              {loading ? "Running Inference..." : "Run AI Estimation"}
            </button>

            {result !== null && (
              <div className="mt-10 p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] animate-in slide-in-from-bottom-4 fade-in duration-500">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">ML Prediction</p>
                <span className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter">
                  {result.toFixed(3)} <span className="text-2xl text-amber-600/50">kWh</span>
                </span>
              </div>
            )}

            {error && <div className="mt-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold">{error}</div>}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="premium-card p-10 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500 rounded-full blur-[80px] opacity-20"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 opacity-80">
                <Wallet size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Projected Cost</span>
              </div>
              <span className="text-5xl md:text-6xl font-black tracking-tighter">₹{estimatedBill}</span>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                {result 
                  ? "Based on this single session estimation." 
                  : "Based on your total monthly forecast."}
              </p>
            </div>
          </div>

          <div className="premium-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Info size={18} /></div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">AI Insights</span>
            </div>
            
            {nilmLoading ? (
              <div className="space-y-3">
                <div className="h-2 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                <div className="h-2 bg-slate-100 rounded w-1/2 animate-pulse"></div>
              </div>
            ) : (
              <ul className="space-y-4">
                {forecast.explanations.length > 0 ? forecast.explanations.map((e, i) => (
                  <li key={i} className="text-xs font-bold text-slate-600 leading-relaxed flex gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    {e}
                  </li>
                )) : (
                  <li className="text-xs text-slate-400 italic">No anomalies detected in current stream.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PredictionSection;