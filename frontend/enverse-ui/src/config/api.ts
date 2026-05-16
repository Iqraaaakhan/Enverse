/**
 * API Configuration
 * Centralized endpoint management for all API calls
 * 
 * IMPORTANT: 
 * - Default backend: https://enverse-backend.onrender.com
 * - For local dev: override VITE_API_URL in an untracked .env.local file
 */

const DEFAULT_API_URL = "https://enverse-backend.onrender.com";
const API_URL_FROM_ENV = import.meta.env.VITE_API_URL?.trim();

// Use the configured backend URL, falling back to Render.
export const API_BASE_URL = API_URL_FROM_ENV || DEFAULT_API_URL;

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
