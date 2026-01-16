import { useEffect, useState } from "react"
import { Zap, Calendar, TrendingUp, Brain, IndianRupee } from "lucide-react"

/* ------------------ TYPES ------------------ */
type ForecastResponse = {
  tomorrow_kwh: number | null
  next_week_kwh: number | null
  next_month_kwh: number | null
  next_year_kwh: number | null
}

export default function PredictionSection() {
  /* ------------------ STATE ------------------ */
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [observations, setObservations] = useState<string[]>([])

  const [baseBill, setBaseBill] = useState<number | null>(null)
  const [whatIfBill, setWhatIfBill] = useState<number | null>(null)
  const [whatIfDelta, setWhatIfDelta] = useState<number | null>(null)

  // What-If inputs
  const [device, setDevice] = useState("HVAC")
  const [duration, setDuration] = useState<number | "">("")
  const [power, setPower] = useState<number | "">("")
  const [loading, setLoading] = useState(false)

  const TARIFF = 8.5

  /* ------------------ AUTO LOAD : REAL ML ------------------ */
  useEffect(() => {
    fetch("http://127.0.0.1:8000/energy/forecast")
      .then(res => res.json())
      .then(data => {
        const f = data.forecast
        const b = data.billing

        setForecast({
          tomorrow_kwh: f?.next_day_kwh ?? null,
          next_week_kwh: f?.next_week_kwh ?? null,
          next_month_kwh: f?.next_month_kwh ?? null,
          next_year_kwh:
            typeof f?.next_month_kwh === "number"
              ? f.next_month_kwh * 12
              : null,
        })

        setBaseBill(
          typeof b?.estimated_bill_rupees === "number"
            ? b.estimated_bill_rupees
            : null
        )

        const insights: string[] = []
        if (Array.isArray(data.explanations)) insights.push(...data.explanations)
        if (f?.next_month_kwh)
          insights.push(
            `Projected average daily usage is ${(f.next_month_kwh / 30).toFixed(
              1
            )} kWh/day.`
          )

        setObservations(insights)
      })
  }, [])

  /* ------------------ WHAT-IF (FIXED & WORKING) ------------------ */
  const runWhatIf = async () => {
    if (!duration) return
    setLoading(true)

    try {
      const res = await fetch("http://127.0.0.1:8000/api/estimate-energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliance: device,
          usage_duration_minutes: Number(duration),
          power_watts: power ? Number(power) : null,
        }),
      })

      const data = await res.json()
      const incrementalKwh = Number(data.estimated_kwh)

      const baseKwh = forecast?.next_month_kwh ?? 0
      const newKwh = baseKwh + incrementalKwh

      const newBill = newKwh * TARIFF
      const delta = baseBill ? newBill - baseBill : null

      setWhatIfBill(newBill)
      setWhatIfDelta(delta)
    } finally {
      setLoading(false)
    }
  }

  /* ------------------ UI ------------------ */
  return (
    <div className="space-y-10 pb-24">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-600 text-white rounded-xl">
          <Zap size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase">Predictive Intel</h2>
          <p className="text-xs text-slate-400 uppercase">
            Real ML-Based Energy Forecast
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

        {/* LEFT */}
        <div className="xl:col-span-8 space-y-6">

          {/* WHAT-IF */}
          <div className="bg-white rounded-3xl p-8 border">
            <h3 className="font-black uppercase text-sm mb-4 flex gap-2">
              <Brain size={16} /> What-If Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={device} onChange={e => setDevice(e.target.value)} className="input">
                <option value="HVAC">Air Conditioner (HVAC)</option>
                <option value="Refrigerator">Refrigerator</option>
                <option value="Washing Machine">Washing Machine</option>
                <option value="Geyser">Water Heater (Geyser)</option>
                <option value="Smart TV">Television</option>
                <option value="Lighting">Lighting</option>
              </select>

              <input
                type="number"
                placeholder="Usage duration (minutes)"
                value={duration}
                onChange={e => setDuration(e.target.value ? Number(e.target.value) : "")}
                className="input"
              />

              <input
                type="number"
                placeholder="Power (watts, optional)"
                value={power}
                onChange={e => setPower(e.target.value ? Number(e.target.value) : "")}
                className="input"
              />
            </div>

            <button
              onClick={runWhatIf}
  disabled={loading || !duration}
              className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-xl font-black"
            >
              {loading ? "Predicting…" : "Predict Impact"}
            </button>
          </div>

          {/* FORECAST */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ForecastCard title="Tomorrow" value={forecast?.tomorrow_kwh} />
            <ForecastCard title="Next Week" value={forecast?.next_week_kwh} />
            <ForecastCard title="Next Month" value={forecast?.next_month_kwh} />
            <ForecastCard title="Next Year" value={forecast?.next_year_kwh} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="xl:col-span-4 space-y-6">

          {/* BILL */}
          <div className="bg-slate-900 text-white rounded-3xl p-8">
            <p className="text-xs uppercase text-slate-400">Monthly Bill</p>
            <div className="flex items-center gap-2 text-4xl font-black">
              <IndianRupee size={22} />
              {whatIfBill ?? baseBill ?? "--"}
            </div>

            {whatIfDelta && (
              <p className="text-amber-400 text-sm mt-2">
                ▲ Impact +₹{whatIfDelta.toFixed(2)}
              </p>
            )}
          </div>

          {/* AI OBS */}
          <div className="bg-white rounded-3xl p-6 border">
            <h4 className="font-black uppercase text-sm mb-3 flex gap-2">
              <Brain size={16} /> AI Observations
            </h4>
            <ul className="space-y-2 text-sm">
              {observations.map((o, i) => (
                <li key={i}>• {o}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------ CARD ------------------ */
function ForecastCard({ title, value }: { title: string; value: number | null | undefined }) {
  return (
    <div className="bg-white rounded-2xl p-5 border">
      <p className="text-xs uppercase text-slate-400">{title}</p>
      <p className="text-2xl font-black">
        {typeof value === "number" ? `${value.toFixed(2)} kWh` : "--"}
      </p>
    </div>
  )
}
