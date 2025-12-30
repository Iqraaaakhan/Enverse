import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

type Props = {
  devices: Record<string, number>
}

const COLORS = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#ec4899", // pink
  "#a855f7", // violet
]

function DeviceEnergyCharts({ devices }: Props) {
  const data = Object.entries(devices)
    .map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((s, d) => s + d.value, 0)

  const pieData = data.slice(0, 6).map(d => ({
    ...d,
    percent: (d.value / total) * 100,
  }))

  return (
    <div className="space-y-10">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ================= BAR CHART ================= */}
        <div className="bg-[#111827] border border-[#1f2933] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-100">
            Highest Energy Consumers
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Appliance-wise energy usage (kWh)
          </p>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={pieData}
              layout="vertical"
              margin={{ left: 90, right: 40 }}
            >
              <defs>
                <linearGradient id="barGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>

              <XAxis
                type="number"
                unit=" kWh"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />

              <Bar
                dataKey="value"
                fill="url(#barGlow)"
                barSize={26}
                radius={[0, 6, 6, 0]}
                isAnimationActive
                animationDuration={900}
                label={{
                  position: "right",
                  formatter: (v: number) => `${v} kWh`,
                  fill: "#e5e7eb",
                  fontSize: 12,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ================= DONUT CHART ================= */}
        <div className="bg-[#111827] border border-[#1f2933] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-100">
            Energy Share Distribution
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Percentage contribution of appliances
          </p>

          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="percent"
                innerRadius={75}
                outerRadius={120}
                paddingAngle={3}
                label={({ percent }) => `${percent.toFixed(0)}%`}
                labelLine={false}
                isAnimationActive
                animationDuration={900}
              >
                {pieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* LEGEND */}
          <div className="mt-4 space-y-1 text-sm">
            {pieData.map((d, i) => (
              <div
                key={d.name}
                className="flex items-center gap-2 text-gray-300"
              >
                <span
                  className="inline-block w-3 h-3 rounded"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="flex-1">{d.name}</span>
                <span className="text-gray-400">
                  {d.percent.toFixed(1)}% · {d.value} kWh
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center font-semibold">
        Device-level consumption estimated using NILM-based energy disaggregation.
      </p>
    </div>
  )
}

export default DeviceEnergyCharts
