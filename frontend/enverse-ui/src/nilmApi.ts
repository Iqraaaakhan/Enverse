import { getApiUrl, API_ENDPOINTS } from './config/api';

export async function fetchNilmExplanation() {
  const res = await fetch(getApiUrl(API_ENDPOINTS.EXPLAIN))

  if (!res.ok) {
    throw new Error("Failed to fetch NILM explanation")
  }

  return res.json()
}
