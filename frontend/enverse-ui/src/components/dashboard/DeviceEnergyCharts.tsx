import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { Activity, PieChart as PieIcon, Zap, Info } from "lucide-react"

type Props = { devices: Record<string, number>; activeCount: number }

const COLORS = ["#d97706", "#92400e", "#b45309", "#78350f", "#451a03", "#0f172a"]

// Industry Standard: Custom Tooltip with high contrast
const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="premium-card p-4 md:p-5 shadow-2xl border-none !bg-white/95 backdrop-blur-lg z-[200]">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Sensor Detail</p>
        <p className="text-base md:text-xl font-black text-slate-900 mb-2 leading-none">{data.name}</p>
        <div className="flex items-center gap-2">
           <Zap size={14} className="text-amber-500 fill-amber-500" />
           <p className="text-xl md:text-2xl font-black text-slate-900">{data.value} <span className="text-[10px] text-amber-700 font-extrabold uppercase font-sans">kWh</span></p>
        </div>
      </div>
    );
  }
  return null;
};

function DeviceEnergyCharts({ devices, activeCount }: Props) {
  // REAL DATA LOGIC
  const chartData = Object.entries(devices).map(([name, value]) => ({ 
    name, 
    value: Number(value.toFixed(2)) 
  }));
  
  const total = chartData.reduce((s, d) => s + d.value, 0);
  const pieData = [...chartData].sort((a,b) => b.value - a.value).slice(0, 6).map(d => ({ ...d, percent: (d.value / total) * 100 }));

  // Helper to prevent overlapping labels on mobile
  const formatXAxis = (tickItem: string) => {
    if (window.innerWidth < 640 && tickItem.length > 10) {
      return `${tickItem.substring(0, 8)}...`;
    }
    return tickItem;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
      
      {/* 1. LOAD PROFILE: Optimized for Mobile/Desktop */}
      <div className="premium-card p-5 md:p-14 relative group">
        <div className="flex items-center justify-between mb-8 md:mb-12">
           <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2.5 md:p-3.5 bg-amber-500/10 rounded-2xl text-amber-600 shadow-sm"><Activity size={20} /></div>
              <div>
                 <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Load Profile</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Real-time disaggregation</p>
              </div>
           </div>
           <Info size={18} className="text-slate-200 hidden sm:block" />
        </div>

        <div className="h-[280px] sm:h-[350px] md:h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ bottom: 40, left: -20, right: 10 }}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/><stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 800}} 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                interval={window.innerWidth < 768 ? 1 : 0} // Hides every other label on mobile to fix "mess"
                tickFormatter={formatXAxis}
              />
              <Tooltip content={<CustomTooltip total={total} />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#d97706" 
                strokeWidth={window.innerWidth < 768 ? 3 : 5} 
                fill="url(#usageGradient)" 
                animationDuration={2000} 
                activeDot={{ r: 6, fill: '#d97706', stroke: '#fff', strokeWidth: 2 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. RESOURCE MIX */}
      <div className="premium-card p-5 md:p-14">
        <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
           <div className="p-2.5 md:p-3.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200"><PieIcon size={20} /></div>
           <div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Mix Analysis</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Sensor Intelligence</p>
           </div>
        </div>

        <div className="flex flex-col xl:flex-row items-center gap-10 md:gap-16">
          <div className="relative h-[220px] sm:h-[280px] md:h-[350px] w-full xl:w-1/2 flex items-center justify-center">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
               <span className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none">{activeCount}</span>
               <span className="text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Devices</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius="72%" outerRadius="98%" paddingAngle={6} dataKey="percent" stroke="none" cornerRadius={10}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} className="hover:opacity-80 transition-opacity" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full xl:w-1/2 space-y-4 md:space-y-5">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex flex-col gap-1.5 group cursor-pointer">
                <div className="flex justify-between items-center text-[10px] sm:text-xs">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-lg" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="font-extrabold text-slate-600 group-hover:text-slate-900 uppercase tracking-widest truncate max-w-[120px]">{d.name}</span>
                   </div>
                   <span className="font-black text-slate-900 tabular-nums">{d.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                   <div className="h-full rounded-full transition-all duration-1000 group-hover:opacity-70" style={{ width: `${d.percent}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceEnergyCharts