import { ResponsiveContainer, BarChart, Bar, XAxis } from "recharts"
import { Moon, Sun } from "lucide-react"

type Props = {
  day: number
  night: number
}

export default function DayNightMiniChart({ day, night }: Props) {
  const data = [
    { name: "Day", value: day, icon: Sun },
    { name: "Night", value: night, icon: Moon },
  ]

  return (
    <div className="premium-card p-6">
      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
        Day vs Night Usage
      </h4>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <Bar
            dataKey="value"
            radius={[8, 8, 8, 8]}
            fill="#d97706"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
