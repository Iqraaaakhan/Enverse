import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

type Props = {
  data: Record<string, number>
}

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"]

function ApplianceChart({ data }: Props) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }))

  if (chartData.length === 0) return null

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, value }) => `${name} (${value}%)`}
          >
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          {/* Tooltip → shows kWh */}
          <Tooltip
            formatter={(value) => {
              const num = typeof value === "number" ? value : Number(value)
              return [`${num.toFixed(2)} kWh`, "Energy"]
            }}
          />

          {/* Legend → shows % */}
          <Legend
            formatter={(value, entry) => {
              const payloadValue =
                typeof entry?.payload?.value === "number"
                  ? entry.payload.value
                  : Number(entry?.payload?.value)

              return `${value} (${payloadValue.toFixed(1)}%)`
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ApplianceChart
