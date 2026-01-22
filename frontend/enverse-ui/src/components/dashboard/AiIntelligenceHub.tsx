import AiReasoningPanel from "./AiReasoningPanel"
import AiEnergyTimeline from "./AiEnergyTimeline"
import ModelHealthPanel from "./ModelHealthPanel"
import { Sparkles, Terminal, Cpu } from "lucide-react"
import { motion } from "framer-motion"

export default function AiIntelligenceHub() {
  return (
    <div className="space-y-8">
      {/* 🌟 VFX: Glowing Border Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative group"
      >
        {/* Animated Gradient Border */}
<div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-orange-300 to-pink-300 rounded-[2.5rem] opacity-40 group-hover:opacity-75 blur-md transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                
        <div className="relative w-full bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20">
                <Terminal size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                  Enverse Intelligence Console
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                  Real-time Inference Stream
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100/50 shadow-sm">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Analysis</span>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            <div className="p-2 bg-white/50">
               <AiReasoningPanel />
            </div>
            <div className="p-2 bg-white/50">
               <AiEnergyTimeline />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Model Health */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400">
            <Cpu size={18} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">ML Pipeline Health</h3>
          <div className="h-px flex-1 bg-slate-200/60"></div>
        </div>
        <ModelHealthPanel />
      </div>
    </div>
  )
}
