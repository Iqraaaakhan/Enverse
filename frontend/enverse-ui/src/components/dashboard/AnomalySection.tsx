type Anomaly = {
  timestamp: string
  device_name: string
  energy_kwh: number
  threshold_kwh: number
  reason: string
}

function AnomalySection({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-500">No anomalies detected 🎉</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold">Detected Anomalies</h3>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-gray-500 text-sm">
              <th>Time</th>
              <th>Device</th>
              <th>Energy</th>
              <th>Threshold</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((a, i) => (
              <tr key={i} className="border-b last:border-none">
                <td>{a.timestamp}</td>
                <td className="font-medium">{a.device_name}</td>
                <td className="text-red-600">{a.energy_kwh}</td>
                <td>{a.threshold_kwh}</td>
                <td className="text-sm text-gray-600">{a.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {anomalies.map((a, i) => (
          <div key={i} className="border rounded-lg p-4">
            <p><b>Time:</b> {a.timestamp}</p>
            <p><b>Device:</b> {a.device_name}</p>
            <p className="text-red-600">
              <b>Energy:</b> {a.energy_kwh} kWh
            </p>
            <p><b>Threshold:</b> {a.threshold_kwh}</p>
            <p className="text-sm text-gray-600">{a.reason}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnomalySection
