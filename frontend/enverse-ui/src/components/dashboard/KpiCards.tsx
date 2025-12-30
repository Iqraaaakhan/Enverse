type KpiCardsProps = {
  totalEnergy: number
  activeDevices: number
  anomalies: number
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

function KpiCards({
  totalEnergy,
  activeDevices,
  anomalies,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card title="Total Energy" value={`${totalEnergy} kWh`} />
      <Card title="Active Devices" value={activeDevices} />
      <Card title="Anomalies" value={anomalies} />
    </div>
  )
}

export default KpiCards
