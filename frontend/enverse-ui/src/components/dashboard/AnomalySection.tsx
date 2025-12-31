import { ShieldAlert, Clock, AlertTriangle, Cpu } from "lucide-react"

type Anomaly = {
  timestamp: string; device_name: string; energy_kwh: number; threshold_kwh: number; reason: string;
}

function AnomalySection({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) {
    return (
      <div className="premium-card p-10 md:p-20 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
        <div className="p-6 bg-emerald-50 rounded-full text-emerald-600 mb-6 shadow-inner"><ShieldAlert size={40} /></div>
        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase">System Secure</h3>
        <p className="text-slate-400 mt-2 text-[10px] md:text-xs uppercase tracking-widest font-bold">Zero Violations in current cycle</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <div className="p-3.5 bg-rose-600 text-white rounded-2xl shadow-xl"><ShieldAlert size={20} /></div>
        <div>
          <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Security</h3>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Incident Reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {anomalies.map((a, i) => (
          <div key={i} className="premium-card p-6 md:p-10 border-l-4 md:border-l-8 border-l-rose-500 flex flex-col gap-6 group">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><AlertTriangle size={24} /></div>
                  <div>
                     <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-full leading-none">Breach</span>
                        <span className="text-slate-400 text-[9px] font-bold flex items-center gap-1"><Clock size={10} /> {a.timestamp}</span>
                     </div>
                     <h4 className="text-xl font-black text-slate-900 leading-none">{a.device_name}</h4>
                  </div>
               </div>
               
               <div className="flex gap-6 md:gap-10 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-10 w-full sm:w-auto">
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Actual</p>
                     <p className="text-xl font-black text-slate-900 tabular-nums leading-none">{a.energy_kwh}<span className="text-[9px] ml-0.5">kWh</span></p>
                  </div>
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Limit</p>
                     <p className="text-lg font-bold text-slate-300 leading-none line-through">{a.threshold_kwh}kWh</p>
                  </div>
               </div>
            </div>
            <p className="text-xs md:text-sm font-bold text-slate-500 italic border-t border-slate-50 pt-4">“{a.reason}”</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnomalySection