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
}
