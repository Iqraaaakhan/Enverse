import { useEffect, useState, useRef, useCallback } from "react"
import { AlertTriangle, X, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getApiUrl, API_ENDPOINTS } from '../../config/api'

interface Alert {
  id: string
  device: string
  duration_hours: number
  severity: "warning" | "critical"
  message: string
  first_detected: string
  last_seen: string
  power_watts: number
  estimated_cost: number
}

interface AlertResponse {
  alert_count: number
  alerts: Alert[]
  last_checked: string
  monitoring_window_hours: number
}

export default function AlertNotifications() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [error, setError] = useState<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize AudioContext on component mount with resume attempt
  useEffect(() => {
    try {
      audioContextRef.current = new AudioContext()
      // Try to resume immediately in case it's suspended
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume()
      }
      console.log("✅ AudioContext ready")
    } catch {
      // Silent fail
    }
  }, [])

  // Listen for ANY user interaction to ensure audio can play
  useEffect(() => {
    const resumeAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => {})
      }
    }
    
    document.addEventListener("click", resumeAudio)
    document.addEventListener("keydown", resumeAudio)
    
    return () => {
      document.removeEventListener("click", resumeAudio)
      document.removeEventListener("keydown", resumeAudio)
    }
  }, [])

  // Web Audio API - Try to play alert sound on every fetch
  const playAlertSound = useCallback(() => {
    if (!audioContextRef.current) return

    try {
      const audioContext = audioContextRef.current

      // Force resume - critical for playing on refresh
      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {})
      }

      // Create and play beeps
      const playBeep = (startTime: number, duration: number) => {
        try {
          const osc = audioContext.createOscillator()
          const gain = audioContext.createGain()
          osc.connect(gain)
          gain.connect(audioContext.destination)
          osc.type = "sine"
          osc.frequency.value = 900
          gain.gain.setValueAtTime(0.6, startTime)
          gain.gain.setValueAtTime(0.1, startTime + duration)
          osc.start(startTime)
          osc.stop(startTime + duration)
        } catch {
          // Silent
        }
      }

      const now = audioContext.currentTime
      playBeep(now, 0.15)
      playBeep(now + 0.2, 0.15)
      playBeep(now + 0.4, 0.15)

      console.log("🔊 Sound playing")
    } catch {
      // Silent fail
    }
  }, [])

  // Fetch alerts ONLY on component mount (refresh only, no polling)
  useEffect(() => {
    const mountTime = new Date().toISOString()
    console.log(`🔵 [${mountTime}] AlertNotifications MOUNTED - fetching alerts...`)
    
    const fetchAlerts = async () => {
      try {
        console.log("🔍 Fetching alerts from /api/alerts...")
        const response = await fetch(getApiUrl(API_ENDPOINTS.ALERTS))
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }
        
        const data: AlertResponse = await response.json()
        console.log("✅ Alerts fetched:", data)

        if (data.alerts && data.alerts.length > 0) {
          // Show all alerts + play sound
          console.log("🔊 Playing sound for", data.alerts.length, "alert(s)")
          playAlertSound()
          setAlerts(data.alerts)
          setError(null)
        } else {
          console.log("ℹ️ No alerts")
          setAlerts([])
          setError(null)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error("❌ Failed to fetch alerts:", errorMsg)
        setError(errorMsg)
      }
    }

    // Fetch ONCE on mount (only on refresh)
    fetchAlerts()
    
    return () => {
      console.log(`🔴 [${mountTime}] AlertNotifications UNMOUNTING`)
    }
  }, [playAlertSound])

  // Dismiss alert - simple removal from display
  const handleDismiss = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  if (alerts.length === 0 && !error) {
    return null // No alerts, nothing to show
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-3">
      {error && (
        <div className="bg-red-950/95 border-l-4 border-l-red-500 px-5 py-4 rounded-xl shadow-2xl text-sm text-red-200 backdrop-blur-md">
          <div className="font-bold text-red-100">⚠️ API Error</div>
          <div className="text-red-300 mt-1">{error}</div>
        </div>
      )}
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
              rounded-2xl shadow-2xl backdrop-blur-md border-2 overflow-hidden
              ${
                alert.severity === "critical"
                  ? "bg-gradient-to-br from-red-900/95 via-red-800/95 to-orange-900/95 border-red-400/50"
                  : "bg-gradient-to-br from-amber-900/95 via-orange-800/95 to-yellow-900/95 border-amber-400/50"
              }
            `}
          >
            <div className="px-5 py-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`
                      p-2.5 rounded-xl backdrop-blur-sm
                      ${
                        alert.severity === "critical"
                          ? "bg-red-500/30 ring-2 ring-red-400/50"
                          : "bg-amber-500/30 ring-2 ring-amber-400/50"
                      }
                    `}
                  >
                    {alert.severity === "critical" ? (
                      <AlertTriangle
                        size={24}
                        className="text-red-200 animate-pulse"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Zap size={24} className="text-amber-200" strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-bold text-base tracking-tight">
                      {alert.severity === "critical" ? "🔴 CRITICAL" : "⚠️ WARNING"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white/90 backdrop-blur-sm">
                      {alert.duration_hours}h runtime
                    </span>
                  </div>

                  <p className="text-white/95 text-sm leading-relaxed mb-3 font-medium">
                    {alert.message}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-white/80 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      <span className="text-base">⚡</span>
                      <span className="font-semibold">{alert.power_watts}W</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/80 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      <span className="text-base">₹</span>
                      <span className="font-semibold">{alert.estimated_cost}</span>
                      <span className="text-xs text-white/60">wasted</span>
                    </div>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="
                    flex-shrink-0 p-2 rounded-lg 
                    bg-white/10 hover:bg-white/20 
                    transition-all duration-200
                    text-white/60 hover:text-white
                    hover:scale-110
                    active:scale-95
                  "
                  aria-label="Dismiss alert"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
