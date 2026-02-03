import { ref } from 'vue'
import type { IpRow, LookupResponse } from '../types'
import { lookupIp } from '../services/api'
import { isValidIp } from './useIpValidation'

let nextId = 1

function createRow(): IpRow {
  return {
    id: nextId++,
    ip: '',
    status: 'idle',
    result: null,
    error: null,
  }
}

export function useIpLookup() {
  const rows = ref<IpRow[]>([createRow()])

  function addRow() {
    rows.value.push(createRow())
  }

  function updateRowIp(id: number, ip: string) {
    const row = rows.value.find((r) => r.id === id)
    if (row) {
      row.ip = ip
      // Reset to idle when user edits
      if (row.status === 'success' || row.status === 'error') {
        row.status = 'idle'
        row.result = null
        row.error = null
      }
    }
  }

  async function lookupRow(id: number) {
    const row = rows.value.find((r) => r.id === id)
    if (!row) return

    const ip = row.ip.trim()
    if (!ip || !isValidIp(ip)) return

    // Don't re-lookup if we already have results for this IP
    if (row.status === 'success' && row.result?.ip === ip) return

    row.status = 'loading'
    row.error = null

    try {
      const result: LookupResponse = await lookupIp(ip)
      row.result = result
      row.status = 'success'
    } catch (err) {
      row.error = err instanceof Error ? err.message : 'Lookup failed'
      row.status = 'error'
    }
  }

  function removeRow(id: number) {
    const index = rows.value.findIndex((r) => r.id === id)
    if (index > -1) {
      rows.value.splice(index, 1)
    }
  }

  return {
    rows,
    addRow,
    updateRowIp,
    lookupRow,
    removeRow,
  }
}
