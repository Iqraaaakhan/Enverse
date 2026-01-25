/**
 * API Configuration
 * Centralized endpoint management for all API calls
 * 
 * IMPORTANT: 
 * - For local dev: VITE_API_URL=http://127.0.0.1:8000 in .env
 * - For production: Update VITE_API_URL in deployment platform (Vercel/Netlify)
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Construct full API endpoint URL
 * @param path - API path (e.g., '/dashboard', '/auth/verify-token')
 * @returns Full URL
 */
export const getApiUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  VERIFY_TOKEN: '/auth/verify-token',
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  HEALTH: '/health',
  
  // Energy
  AI_INSIGHTS: '/energy/ai-insights',
  AI_TIMELINE: '/energy/ai-timeline',
  EXPLAIN: '/energy/explain',
  FORECAST: '/energy/forecast',
  
  // API
  ESTIMATE_ENERGY: '/api/estimate-energy',
  MODEL_HEALTH: '/api/model-health',
  ALERTS: '/api/alerts',
  
  // Chat
  CHAT: '/chat',
} as const;
