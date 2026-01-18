import { useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  Label
} from "recharts"
import { Activity, PieChart as PieIcon, Info } from "lucide-react"
// ✅ IMPORT THE ALIAS UTILITY
import { getDeviceDisplayName } from "../../utils/deviceAliases"

type Props = {
  devices: Record<string, number>
  activeCount: number
}

const COLORS = [
  "#d97706", "#92400e", "#b45309", "#334155", "#0f172a", 
  "#047857", "#15803d", "#ea580c", "#78350f", "#475569"
]

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-slate-900 text-white border border-slate-800 p-4 rounded-xl shadow-xl min-w-[150px] z-50">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
        {/* ✅ APPLY ALIAS HERE */}
        {d.displayName}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black tracking-tighter">
          {d.value.toFixed(2)}
        </span>
        <span className="text-xs font-bold text-amber-500">kWh</span>
      </div>
    </div>
  )
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 4}
        outerRadius={innerRadius - 1}
        fill={fill}
      />
    </g>
  )
}

export default function DeviceEnergyCharts({ devices, activeCount }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  const rawData = Object.entries(devices || {}).map(([name, value]) => ({
    name, // Keep original name for key
    displayName: getDeviceDisplayName(name), // ✅ Add display name
    value: Number(value),
  }))
  
  rawData.sort((a, b) => b.value - a.value)
  const totalEnergy = rawData.reduce((acc, curr) => acc + curr.value, 0)

  const data = rawData.map(item => ({
    ...item,
    percent: totalEnergy > 0 ? (item.value / totalEnergy) * 100 : 0
  }))

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const activeItem = data[activeIndex] || {}

  const CustomTick = (props: any) => {
    const { x, y, payload } = props
    // ✅ APPLY ALIAS HERE
    const label = getDeviceDisplayName(payload.value)
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={14} textAnchor="end" fill="#64748b" fontSize={10} fontWeight={600} transform="rotate(-35)">
          {label.length > 12 ? `${label.slice(0, 10)}..` : label}
        </text>
      </g>
    )
  }

  if (!data.length) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      
      {/* LEFT: AREA CHART */}
      <div className="premium-card p-6 flex flex-col h-[450px]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Activity size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
                Appliance Consumption
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Cumulative Energy Distribution
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
            <Info size={14} className="text-slate-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Live</span>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 45 }}>
              <defs>
                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={<CustomTick />} interval={0} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}>
                 <Label value="Energy (kWh)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
              </YAxis>
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d97706', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="value" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorEnergy)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RIGHT: PIE CHART */}
      <div className="premium-card p-6 flex flex-col h-[450px]">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-md">
            <PieIcon size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
              Distribution
            </h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              {activeCount} Active Nodes
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 flex-1 min-h-0">
          <div className="relative h-[240px] w-full sm:w-[55%] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  stroke="none"
                  paddingAngle={3}
                >
                  {data.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} className="transition-all duration-300 outline-none"/>
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <div className="text-center">
                 <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                   {activeItem.percent ? activeItem.percent.toFixed(0) : "100"}%
                 </span>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {/* ✅ APPLY ALIAS HERE */}
                    {activeItem.displayName || "Load"}
                 </p>
               </div>
            </div>
          </div>

          <div className="flex-1 w-full h-full overflow-hidden flex flex-col border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4">
             <div className="overflow-y-auto pr-2 custom-scrollbar space-y-1.5 flex-1">
                {data.map((d, i) => (
                  <div 
                    key={d.name} 
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`group flex items-center justify-between py-3 px-3 rounded-lg transition-all cursor-pointer ${activeIndex === i ? 'bg-slate-900 shadow-md scale-[1.02]' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0`} style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className={`text-xs font-bold truncate ${activeIndex === i ? 'text-white' : 'text-slate-700'}`}>
                        {/* ✅ APPLY ALIAS HERE */}
                        {d.displayName}
                      </span>
                    </div>
                    <span className={`text-xs font-black ${activeIndex === i ? 'text-amber-400' : 'text-slate-900'}`}>{d.percent.toFixed(0)}%</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}