// Folder: frontend/enverse-ui/src/components/dashboard
// File: DeviceEnergyCharts.tsx

import { AreaChart, Area, XAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { Activity, PieChart as PieIcon, Zap, Info } from "lucide-react"

type Props = { devices: Record<string, number>; activeCount: number }

// Industry Standard: Dynamic Color Generator
// Generates a spectrum of colors based on the number of devices, ensuring no two look exactly alike
const generateColors = (count: number) => {
  const baseColors = [
    "#d97706", "#b45309", "#92400e", "#78350f", "#451a03", // Ambers/Browns
    "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", // Slates
    "#059669", "#047857", "#065f46", "#064e3b",             // Emeralds
    "#b91c1c", "#991b1b", "#7f1d1d"                         // Reds
  ];
  // If we have more devices than base colors, cycle through them
  return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="premium-card p-4 shadow-2xl border-none !bg-white/95 backdrop-blur-lg z-[200]">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Sensor Detail</p>
        <p className="text-sm font-black text-slate-900 mb-2 leading-none">{data.name}</p>
        <div className="flex items-center gap-2">
           <Zap size={14} className="text-amber-500 fill-amber-500" />
           <p className="text-lg font-black text-slate-900">{data.value} <span className="text-[10px] text-amber-700 font-extrabold uppercase font-sans">kWh</span></p>
        </div>
      </div>
    );
  }
  return null;
};

function DeviceEnergyCharts({ devices, activeCount }: Props) {
  // 1. Transform Data
  const chartData = Object.entries(devices).map(([name, value]) => ({ 
    name, 
    value: Number(value.toFixed(2)) 
  }));
  
  // 2. Sort by value (highest usage first) for better visualization
  chartData.sort((a, b) => b.value - a.value);

  const total = chartData.reduce((s, d) => s + d.value, 0);
  
  // 3. NO SLICING - Show all devices
  const pieData = chartData.map(d => ({ 
    ...d, 
    percent: total > 0 ? (d.value / total) * 100 : 0 
  }));

  const COLORS = generateColors(pieData.length);

  const formatXAxis = (tickItem: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640 && tickItem.length > 8) {
      return `${tickItem.substring(0, 6)}..`;
    }
    return tickItem;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
      
      {/* 1. LOAD PROFILE (Area Chart) */}
      <div className="premium-card p-5 md:p-10 relative group">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-600 shadow-sm"><Activity size={20} /></div>
              <div>
                 <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">Load Profile</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Real-time disaggregation</p>
              </div>
           </div>
           <Info size={18} className="text-slate-200 hidden sm:block" />
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ bottom: 0, left: -20, right: 0, top: 10 }}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/><stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} 
                interval={0} // Show all labels
                angle={-45}
                textAnchor="end"
                height={60}
                tickFormatter={formatXAxis}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d97706', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#d97706" 
                strokeWidth={3} 
                fill="url(#usageGradient)" 
                animationDuration={1500} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. RESOURCE MIX (Pie Chart with Scrollable Legend) */}
      <div className="premium-card p-5 md:p-10 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200"><PieIcon size={20} /></div>
           <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">Mix Analysis</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                {activeCount} Active Nodes
              </p>
           </div>
        </div>

        <div className="flex flex-col xl:flex-row items-center gap-8 h-full">
          {/* Chart Circle */}
          <div className="relative h-[250px] w-full xl:w-1/2 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  innerRadius="60%" 
                  outerRadius="85%" 
                  paddingAngle={3} 
                  dataKey="value" 
                  stroke="none" 
                  cornerRadius={6}
                >
                  {pieData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i]} className="hover:opacity-80 transition-opacity duration-300" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-4xl font-black text-slate-900 tracking-tighter">{activeCount}</span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Devices</span>
            </div>
          </div>

          {/* Scrollable Legend for 16+ Devices */}
          <div className="w-full xl:w-1/2 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors">
                   <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                      <span className="text-[10px] sm:text-xs font-bold text-slate-600 group-hover:text-slate-900 uppercase tracking-wider truncate">
                        {d.name}
                      </span>
                   </div>
                   <div className="flex items-center gap-2 flex-shrink-0">
                     <span className="text-[10px] font-medium text-slate-400">{d.value.toFixed(1)} kWh</span>
                     <span className="text-xs font-black text-slate-900 tabular-nums w-10 text-right">
                       {d.percent.toFixed(1)}%
                     </span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceEnergyCharts