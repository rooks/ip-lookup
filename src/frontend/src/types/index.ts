export interface LookupResponse {
  ip: string
  country: string
  country_code: string
  timezone: string
  city: string | null
}

export interface ErrorResponse {
  error: string
  code?: string
  message?: string
}

export type RowStatus = 'idle' | 'loading' | 'success' | 'error'

export interface IpRow {
  id: number
  ip: string
  status: RowStatus
  result: LookupResponse | null
  error: string | null
}
