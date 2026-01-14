import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  Calculator,
  Info,
  Sparkles,
  Wallet,
  ShieldCheck,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

function PredictionSection() {
  const [power, setPower] = useState("");
  const [duration, setDuration] = useState("");
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

    if (!power || !duration) {
      setError("Please enter both values");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        appliance: "Lighting",
        usage_duration_minutes: Number(duration),
        temperature_setting_C: 24,
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

      const data = await res.json();
      setResult(Number(data.estimated_kwh));
    } catch {
      setError("Prediction failed. Backend not responding.");
    } finally {
      setLoading(false);
    }
  };

  const displayDay = result ?? forecast.next_day_kwh;
  const displayWeek = result ? result * 7 : forecast.next_week_kwh;
  const displayMonth = result ? result * 30 : forecast.next_month_kwh;

  const estimatedBill = (displayMonth * 4.17).toFixed(2);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
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
          <h2 className="text-5xl font-black text-slate-900 uppercase italic">
            AI Estimation
          </h2>
        </div>

        <div className="flex gap-2">
          <div className="bg-white px-4 py-2 rounded-full border flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase">
              ML Active
            </span>
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-full border">
            <span className="text-[10px] font-black uppercase">
              MAE: {forecast.mae}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="premium-card p-10 relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
              <Calculator size={180} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <input
                type="number"
                placeholder="Watts"
                className="w-full p-5 bg-slate-50 rounded-3xl font-black text-xl"
                value={power}
                onChange={(e) => setPower(e.target.value)}
              />
              <input
                type="number"
                placeholder="Minutes"
                className="w-full p-5 bg-slate-50 rounded-3xl font-black text-xl"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <button
              onClick={predict}
              disabled={loading}
              className="px-12 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase"
            >
              {loading ? "Running Inference..." : "Run AI Estimation"}
            </button>

            {result !== null && (
              <div className="mt-10 p-10 bg-amber-50 rounded-[2.5rem]">
                <span className="text-7xl font-black">
                  {result.toFixed(3)} kWh
                </span>
              </div>
            )}

            {error && <div className="mt-6 text-rose-500">{error}</div>}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="premium-card p-10 bg-slate-900 text-white">
            <Wallet size={20} className="mb-4" />
            <span className="text-6xl font-black">₹{estimatedBill}</span>
          </div>

          <div className="premium-card p-10">
            <Info size={20} className="mb-4" />
            {nilmLoading ? (
              <p className="text-xs italic">Analyzing…</p>
            ) : (
              <ul className="text-xs space-y-2">
                {forecast.explanations.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PredictionSection;
