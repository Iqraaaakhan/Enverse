import AiReasoningPanel from "./AiReasoningPanel"
import AiEnergyTimeline from "./AiEnergyTimeline"
import ModelHealthPanel from "./ModelHealthPanel" // Import
import { Sparkles, Terminal } from "lucide-react"

export default function AiIntelligenceHub() {
  return (
    <div className="space-y-6">
      {/* Main Console */}
      <div className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg shadow-md">
              <Terminal size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                Enverse Intelligence Console
              </h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Real-time Inference Stream
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white text-amber-700 rounded-full border border-amber-100 shadow-sm">
            <Sparkles size={14} />
            <span className="text-[11px] font-black uppercase tracking-widest">Live Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <div className="p-2 bg-white">
             <AiReasoningPanel />
          </div>
          <div className="p-2 bg-white">
             <AiEnergyTimeline />
          </div>
        </div>
      </div>

      {/* NEW: Model Health Section */}
      <ModelHealthPanel />
    </div>
  )
}