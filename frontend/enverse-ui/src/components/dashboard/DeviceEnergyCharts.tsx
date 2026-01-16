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
} from "recharts"
import { Activity, PieChart as PieIcon, Info, Zap } from "lucide-react"

type Props = {
  devices: Record<string, number>
  activeCount: number
}

// EARTH TONE PALETTE
const COLORS = [
  "#d97706", // Amber 600
  "#92400e", // Amber 800
  "#b45309", // Amber 700
  "#334155", // Slate 700
  "#0f172a", // Slate 900
  "#047857", // Emerald 700
  "#15803d", // Green 700
  "#ea580c", // Orange 600
  "#78350f", // Amber 900
  "#475569", // Slate 600
  "#ca8a04", // Yellow 600
  "#854d0e", // Yellow 800
]

// Custom Tooltip for Area Chart
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-slate-900 text-white border border-slate-800 p-4 rounded-2xl shadow-2xl min-w-[160px] z-50">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
        {d.name}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tighter">
          {d.value.toFixed(2)}
        </span>
        <span className="text-xs font-bold text-amber-500">kWh</span>
      </div>
    </div>
  )
}

// Active Shape for Pie Chart (Expands on Hover)
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8} // Expands outward
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 6}
        outerRadius={innerRadius - 2}
        fill={fill}
      />
    </g>
  )
}

export default function DeviceEnergyCharts({ devices, activeCount }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  // 1. Data Transformation
  const rawData = Object.entries(devices || {}).map(([name, value]) => ({
    name,
    value: Number(value),
  }))
  
  rawData.sort((a, b) => b.value - a.value)
  const totalEnergy = rawData.reduce((acc, curr) => acc + curr.value, 0)

  
  // Calculate percentage correctly (0-100 scale)
  const data = rawData.map(item => ({
    ...item,
    percent: totalEnergy > 0 ? (item.value / totalEnergy) * 100 : 0
  }))

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  // Determine what to show in the center
  const activeItem = data[activeIndex] || {}

  if (!data.length) {
    return (
      <div className="premium-card p-12 flex flex-col items-center justify-center text-center opacity-50">
        <Activity size={48} className="text-slate-300 mb-4" />
        <p className="text-lg font-bold text-slate-400">System initializing...</p>
      </div>
    )
  }

  const CustomTick = (props: any) => {
    const { x, y, payload } = props
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="#64748b"
          fontSize={11}
          fontWeight={700}
          transform="rotate(-35)"
        >
          {payload.value.length > 10 ? `${payload.value.slice(0, 8)}..` : payload.value}
        </text>
      </g>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
      
      {/* --- LEFT: AREA CHART --- */}
      <div className="premium-card p-8 flex flex-col h-[550px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
               <Activity size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                Load Profile
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                Consumption Curve
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
            <Info size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Real-time</span>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 50 }}>
              <defs>
                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={<CustomTick />} 
                interval={0} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d97706', strokeWidth: 2 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#d97706"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorEnergy)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- RIGHT: INTERACTIVE MIX ANALYSIS --- */}
      <div className="premium-card p-8 flex flex-col h-[650px] lg:h-[550px]">
        <div className="flex items-center gap-4 mb-8 shrink-0">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
             <PieIcon size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
              Distribution
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">
              {activeCount} Active Nodes
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 flex-1 min-h-0">
          
          {/* 1. INTERACTIVE DONUT CHART */}
          <div className="relative h-[280px] w-full lg:w-[50%] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={105}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  stroke="none"
                  paddingAngle={2}
                >
                  {data.map((_, i) => (
                    <Cell 
                      key={`cell-${i}`} 
                      fill={COLORS[i % COLORS.length]} 
                      className="transition-all duration-300 outline-none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* DYNAMIC CENTER LABEL */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <div className="text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                   {activeItem.name ? "Selected" : "Total"}
                 </p>
                 <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                      {activeItem.percent ? activeItem.percent.toFixed(1) : "100"}%
                    </span>
                    <span className="text-xs font-bold text-amber-600 mt-1 uppercase tracking-wider truncate max-w-[120px]">
                      {activeItem.name || "Load Share"}
                    </span>
                 </div>
               </div>
            </div>
          </div>

          {/* 2. PREMIUM SIDE LIST */}
          <div className="flex-1 w-full h-full overflow-hidden flex flex-col border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
             <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-3 shrink-0">
                <span>Device Name</span>
                <span>Usage Share</span>
             </div>
             
             <div className="overflow-y-auto pr-3 custom-scrollbar space-y-2 flex-1">
                {data.map((d, i) => (
                  <div 
                    key={d.name} 
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`group flex items-center justify-between py-3 px-3 rounded-xl transition-all cursor-pointer ${activeIndex === i ? 'bg-slate-900 shadow-lg scale-[1.02]' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div 
                        className={`w-3 h-3 rounded-full shrink-0 ${activeIndex === i ? 'ring-2 ring-white' : ''}`} 
                        style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                      />
                      <span className={`text-sm font-bold truncate ${activeIndex === i ? 'text-white' : 'text-slate-700'}`}>
                        {d.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-black tabular-nums ${activeIndex === i ? 'text-amber-400' : 'text-slate-900'}`}>
                        {d.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
             </div>
             
             {/* Fade effect */}
             <div className="h-8 bg-gradient-to-t from-white to-transparent shrink-0 pointer-events-none -mt-8 z-10" />
          </div>

        </div>
      </div>
    </div>
  )
}