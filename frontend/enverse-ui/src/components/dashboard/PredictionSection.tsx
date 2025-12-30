import React, { useEffect, useState } from "react"
import { fetchNilmExplanation } from "../../nilmApi"
import ApplianceChart from "./ApplianceChart"

/* ================= Prediction Section ================= */

function PredictionSection() {
  const [power, setPower] = useState<string>("")
  const [duration, setDuration] = useState<string>("")
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /* ---------- NILM Explainable AI State ---------- */
  const [nilmExplanation, setNilmExplanation] = useState<string[]>([])
  const [applianceBreakdown, setApplianceBreakdown] =
  useState<Record<string, number>>({})

  const [nilmLoading, setNilmLoading] = useState<boolean>(false)

  /* ---------- ML Forecast State (XGBoost) ---------- */
  const [forecast, setForecast] = useState<{
    next_day_kwh: number
    next_week_kwh: number
    next_month_kwh: number
  }>({
    next_day_kwh: 0,
    next_week_kwh: 0,
    next_month_kwh: 0,
  })

  /* ---------- Fetch ML Forecast ---------- */
  useEffect(() => {
    fetch("http://127.0.0.1:8000/energy/forecast")
      .then(res => res.json())
      .then(data => {
        if (data.forecast) {
          setForecast(data.forecast)
        }
      })
      .catch(err => {
        console.error("Forecast fetch failed:", err)
      })
  }, [])

  /* ---------- Fetch NILM Explainable AI ---------- */
  useEffect(() => {
    setNilmLoading(true)

    fetchNilmExplanation()
  .then(data => {
    if (data.explanations) {
      setNilmExplanation(data.explanations)
    }

    if (data.appliance_breakdown_percent) {
      setApplianceBreakdown(data.appliance_breakdown_percent)
    }
  })

      .catch(() => {
        setNilmExplanation([])
      })
      .finally(() => {
        setNilmLoading(false)
      })
  }, [])

  /* ---------- What-If Prediction ---------- */
  const predict = async () => {
    setError(null)
    setResult(null)

    if (!power || !duration) {
      setError("Please enter both values")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/energy/predict?power_watts=${Number(
          power
        )}&duration_minutes=${Number(duration)}`
      )

      if (!res.ok) throw new Error("Server error")

      const data = await res.json()
      setResult(Number(data.predicted_energy_kwh))
    } catch {
      setError("Prediction failed")
    } finally {
      setLoading(false)
    }
  }

  /* -------- Forecast calculations (SMART & SAFE) -------- */
  const baselineMonthlyEnergy = 13.608

  const dailyForecast =
    result !== null && !isNaN(result)
      ? result
      : forecast.next_day_kwh || baselineMonthlyEnergy / 30

  const weeklyForecast =
    result !== null
      ? dailyForecast * 7
      : forecast.next_week_kwh || dailyForecast * 7

  const monthlyForecast =
    result !== null
      ? dailyForecast * 30
      : forecast.next_month_kwh || baselineMonthlyEnergy

  /* ---------- Electricity Bill (India) ---------- */
  const TARIFF_PER_KWH = 4.17
  const estimatedBill = (monthlyForecast * TARIFF_PER_KWH).toFixed(2)

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-8">

      <h3 className="text-lg font-semibold text-gray-800">
        What-If Energy Prediction
      </h3>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-300 rounded-xl">
          ⚡ <span className="text-sm font-semibold text-blue-800">XGBoost Model</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-xl">
          📊 <span className="text-sm font-semibold text-green-800">MAE: 0.33</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-xl text-sm text-gray-700">
          Trained on household energy data
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="Power (Watts)"
          className="border rounded-lg px-3 py-2 w-full"
          value={power}
          onChange={e => setPower(e.target.value)}
        />
        <input
          type="number"
          placeholder="Duration (Minutes)"
          className="border rounded-lg px-3 py-2 w-full"
          value={duration}
          onChange={e => setDuration(e.target.value)}
        />
      </div>

      <button
        onClick={predict}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {loading ? "Predicting..." : "Predict Energy"}
      </button>

      {result !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          Predicted Energy: <strong>{result.toFixed(3)} kWh</strong>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-center">
          {error}
        </div>
      )}

      <div className="border-t pt-6 space-y-4">
        <h4 className="text-md font-semibold text-gray-700">
          Estimated Energy Forecast (ML-Based)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ForecastCard label="Next Day" value={dailyForecast.toFixed(2)} />
          <ForecastCard label="Next Week" value={weeklyForecast.toFixed(2)} />
          <ForecastCard label="Next Month" value={monthlyForecast.toFixed(2)} />
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex flex-col sm:flex-row sm:justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-800">
              Estimated Monthly Electricity Bill (India)
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              Calculated using ML-predicted monthly energy usage and Indian tariff.
            </p>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ₹{estimatedBill}
          </div>
        </div>

        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            Why is my electricity bill high?
          </h4>

          {nilmLoading && (
            <p className="text-sm text-gray-500">
              Analyzing appliance usage patterns...
            </p>
          )}

          {!nilmLoading && nilmExplanation.length === 0 && (
            <p className="text-sm text-gray-500">
              No explainable insights available.
            </p>
          )}

          <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
            {nilmExplanation.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-2">
        <span className="font-semibold">ℹ️</span>
        <p>
          These predictions are generated using an <strong>XGBoost machine learning model</strong>.
          Explanations are derived from NILM-based appliance disaggregation.
        </p>
      </div>

    </div>
    
  )
}

function ForecastCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border rounded-lg p-4 text-center bg-white">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-xl font-bold mt-1">{value} kWh</p>
    </div>
  )
}

export default PredictionSection
