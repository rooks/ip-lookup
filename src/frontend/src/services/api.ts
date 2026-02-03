import type { LookupResponse, ErrorResponse } from '../types'

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:8080'

export async function lookupIp(ip: string): Promise<LookupResponse> {
  const resp = await fetch(`${API_BASE_URL}/api/lookup/${encodeURIComponent(ip)}`)

  if (!resp.ok) {
    const errorData: ErrorResponse = await resp.json().catch(() => ({
      message: 'Failed to parse error response',
    }))
    throw new Error(errorData.message || 'Lookup failed')
  }

  return resp.json()
}
