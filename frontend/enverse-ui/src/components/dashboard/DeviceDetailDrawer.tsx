import { motion, AnimatePresence } from "framer-motion"
import { X, Activity, Zap, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, IndianRupee, Sparkles } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type Props = {
  isOpen: boolean
  onClose: () => void
  device: any
}

export default function DeviceDetailDrawer({ isOpen, onClose, device }: Props) {
  if (!device) return null

  // 🟢 CONSUMER-FRIENDLY AI LOGIC
  const getHealthContext = (score: number) => {
    if (score >= 90) return "Excellent. This device is running efficiently with no energy wastage."
    if (score >= 70) return "Good. Minor usage spikes detected, but within acceptable range."
    return "Attention. This device is consuming significantly more power than its historical baseline."
  }

  const getTrendContext = (trend: number) => {
    if (trend > 10) return "Usage has increased compared to yesterday. Check if the device was running longer than usual."
    if (trend < -10) return "Efficiency improved. You used this device less than yesterday."
    return "Usage is stable. Consumption is consistent with your daily patterns."
  }

  // 🟢 HUMAN-FIRST INSIGHTS (No Jargon)
  const getAiAnalysis = () => {
    return [
      {
        icon: Sparkles,
        title: "Pattern Recognition",
        // Replaces "Signal Isolation"
        text: "This device is behaving normally based on how it usually runs in your home."
      },
      {
        icon: device.trendPercent > 5 ? TrendingUp : CheckCircle2,
        title: "Usage Insight",
        // Replaces "Behavioral Pattern"
        text: getTrendContext(device.trendPercent)
      }
    ]
  }

  const getCategory = (name: string) => {
    if (name.includes("AC") || name.includes("Fridge")) return "Heavy Appliance"
    if (name.includes("Light")) return "Lighting"
    if (name.includes("Washing")) return "Utility"
    return "Electronics"
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Warm Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1a1614]/40 backdrop-blur-sm z-[60]"
          />

          {/* Premium Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full md:w-[550px] bg-[#fffbf7] shadow-2xl z-[70] flex flex-col border-l border-white/50"
          >
            {/* Header - Navy & Gold */}
            <div className="shrink-0 bg-[#0f172a] p-8 flex justify-between items-center z-50 relative overflow-hidden">
              {/* Gold Glow Effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-amber-400 shadow-lg">
                  <Zap size={28} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-none">{device.displayName}</h2>
                  <p className="text-[11px] font-bold text-amber-500/80 uppercase tracking-widest mt-1.5">
                    Category: {getCategory(device.displayName)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white z-10">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content - Warm Sand Theme */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-0 bg-[#fffbf7]">
              
              {/* 1. Health Score - Gold/Navy Theme */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-amber-100/50 shadow-[0_20px_40px_rgba(217,119,6,0.05)] relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Efficiency Score</h3>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    device.healthScore < 75 
                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {device.healthScore < 75 ? 'Needs Attention' : 'Excellent'}
                  </span>
                </div>
                
                <div className="flex items-baseline gap-2 relative z-10">
                  <span className={`text-8xl font-black tracking-tighter ${
                    device.healthScore < 75 ? 'text-rose-500' : 'text-[#0f172a]'
                  }`}>
                    {device.healthScore}
                  </span>
                  <span className="text-2xl font-bold text-slate-300">/100</span>
                </div>
                <p className="text-sm font-medium text-slate-500 mt-4 leading-relaxed relative z-10 border-t border-slate-50 pt-4">
                  {getHealthContext(device.healthScore)}
                </p>
              </div>

              {/* 2. 24H Load Profile */}
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-amber-500" /> Usage Signature
                </h3>
                <div className="h-64 w-full bg-white border border-slate-100 rounded-[2rem] p-4 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={device.history}>
                      <defs>
                        <linearGradient id="colorDetail" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        interval={3} 
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#0f172a', color: '#fff'}}
                        itemStyle={{color: '#fbbf24'}}
                        formatter={(value: any) => [`${Number(value).toFixed(2)} kWh`, "Energy"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="kwh" 
                        stroke="#d97706" 
                        strokeWidth={3} 
                        fill="url(#colorDetail)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Cost & Trend */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-amber-200 transition-colors">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    <IndianRupee size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Cost Impact</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{device.contribution}%</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">of monthly total</p>
                </div>
                
                <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-amber-200 transition-colors">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    {device.trendPercent > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">Trend</span>
                  </div>
                  <p className={`text-3xl font-black ${device.trendPercent > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {device.trendPercent > 0 ? '+' : ''}{device.trendPercent}%
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">vs. Yesterday</p>
                </div>
              </div>

              {/* 4. AI Insights (Concierge Style) */}
              <div className="bg-[#0f172a] text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
                
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 relative z-10">
                  <Sparkles size={14} className="text-amber-400" /> Enverse AI Analysis
                </h3>
                
                <div className="space-y-6 relative z-10">
                  {getAiAnalysis().map((insight, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1 p-2 bg-white/10 rounded-xl h-fit">
                        <insight.icon className="text-amber-400" size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">{insight.title}</h4>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                          {insight.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}