export interface Anomaly {
  timestamp: string
  device_name: string
  device_type: string
  energy_kwh: number
  threshold_kwh: number
  reason: string
}

export interface DashboardResponse {
  total_energy_kwh: number
  active_devices: number
  anomaly_count: number
  device_wise_energy_kwh: Record<string, number>
  anomalies: Anomaly[]
  savings_amount?: number  // Slab-based savings (prev_bill - current_bill)
  delta_kwh?: number       // Energy change
  current_bill?: number    // Slab-based actual bill (last 30 days)
  prev_bill?: number       // Slab-based previous bill (30 days before)
  prev_total_energy?: number
  raw_records?: any[]      // Timestamped energy records for charts
}
