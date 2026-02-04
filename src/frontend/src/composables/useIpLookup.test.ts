import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useIpLookup } from './useIpLookup'
import * as api from '../services/api'

vi.mock('../services/api')

describe('useIpLookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with one empty row', () => {
      const { rows } = useIpLookup()

      expect(rows.value).toHaveLength(1)
      expect(rows.value[0]!.ip).toBe('')
      expect(rows.value[0]!.status).toBe('idle')
      expect(rows.value[0]!.result).toBeNull()
      expect(rows.value[0]!.error).toBeNull()
    })

    it('should assign unique IDs to rows', () => {
      const { rows, addRow } = useIpLookup()
      const firstId = rows.value[0]!.id

      addRow()
      expect(rows.value[1]!.id).not.toBe(firstId)
    })
  })

  describe('addRow', () => {
    it('should add a new empty row', () => {
      const { rows, addRow } = useIpLookup()

      addRow()

      expect(rows.value).toHaveLength(2)
      expect(rows.value[1]!.ip).toBe('')
      expect(rows.value[1]!.status).toBe('idle')
    })

    it('should add multiple rows', () => {
      const { rows, addRow } = useIpLookup()

      addRow()
      addRow()
      addRow()

      expect(rows.value).toHaveLength(4)
    })
  })

  describe('removeRow', () => {
    it('should remove a row by id', () => {
      const { rows, addRow, removeRow } = useIpLookup()
      addRow()

      const idToRemove = rows.value[0]!.id
      removeRow(idToRemove)

      expect(rows.value).toHaveLength(1)
      expect(rows.value.find(r => r.id === idToRemove)).toBeUndefined()
    })

    it('should do nothing if id not found', () => {
      const { rows, removeRow } = useIpLookup()

      removeRow(9999)

      expect(rows.value).toHaveLength(1)
    })

    it('should allow removing all rows', () => {
      const { rows, removeRow } = useIpLookup()

      removeRow(rows.value[0]!.id)

      expect(rows.value).toHaveLength(0)
    })
  })

  describe('updateRowIp', () => {
    it('should update the IP of a row', () => {
      const { rows, updateRowIp } = useIpLookup()
      const rowId = rows.value[0]!.id

      updateRowIp(rowId, '8.8.8.8')

      expect(rows.value[0]!.ip).toBe('8.8.8.8')
    })

    it('should reset status when editing a successful row', () => {
      const { rows, updateRowIp } = useIpLookup()
      const row = rows.value[0]!

      row.status = 'success'
      row.result = { ip: '8.8.8.8', country: 'US', country_code: 'US', timezone: 'UTC', city: null }

      updateRowIp(row.id, '1.1.1.1')

      expect(row.status).toBe('idle')
      expect(row.result).toBeNull()
      expect(row.error).toBeNull()
    })

    it('should reset status when editing an error row', () => {
      const { rows, updateRowIp } = useIpLookup()
      const row = rows.value[0]!

      row.status = 'error'
      row.error = 'Some error'

      updateRowIp(row.id, '1.1.1.1')

      expect(row.status).toBe('idle')
      expect(row.error).toBeNull()
    })

    it('should do nothing if id not found', () => {
      const { rows, updateRowIp } = useIpLookup()

      updateRowIp(9999, '8.8.8.8')

      expect(rows.value[0]!.ip).toBe('')
    })
  })

  describe('lookupRow', () => {
    it('should update row to success on API success', async () => {
      const mockResult = {
        ip: '8.8.8.8',
        country: 'United States',
        country_code: 'US',
        timezone: 'America/New_York',
        city: 'Mountain View'
      }
      vi.mocked(api.lookupIp).mockResolvedValue(mockResult)

      const { rows, updateRowIp, lookupRow } = useIpLookup()
      const rowId = rows.value[0]!.id

      updateRowIp(rowId, '8.8.8.8')
      await lookupRow(rowId)

      expect(rows.value[0]!.status).toBe('success')
      expect(rows.value[0]!.result).toEqual(mockResult)
      expect(rows.value[0]!.error).toBeNull()
    })

    it('should update row to error on API failure', async () => {
      vi.mocked(api.lookupIp).mockRejectedValue(new Error('Network error'))

      const { rows, updateRowIp, lookupRow } = useIpLookup()
      const rowId = rows.value[0]!.id

      updateRowIp(rowId, '8.8.8.8')
      await lookupRow(rowId)

      expect(rows.value[0]!.status).toBe('error')
      expect(rows.value[0]!.error).toBe('Network error')
      expect(rows.value[0]!.result).toBeNull()
    })

    it('should set loading status while fetching', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      vi.mocked(api.lookupIp).mockReturnValue(promise as Promise<any>)

      const { rows, updateRowIp, lookupRow } = useIpLookup()
      const rowId = rows.value[0]!.id

      updateRowIp(rowId, '8.8.8.8')
      const lookupPromise = lookupRow(rowId)

      expect(rows.value[0]!.status).toBe('loading')

      resolvePromise!({ ip: '8.8.8.8', country: 'US', country_code: 'US', timezone: 'UTC', city: null })
      await lookupPromise
    })

    it('should not lookup empty IP', async () => {
      const { rows, lookupRow } = useIpLookup()

      await lookupRow(rows.value[0]!.id)

      expect(api.lookupIp).not.toHaveBeenCalled()
      expect(rows.value[0]!.status).toBe('idle')
    })

    it('should not lookup invalid IP', async () => {
      const { rows, updateRowIp, lookupRow } = useIpLookup()

      updateRowIp(rows.value[0]!.id, 'invalid')
      await lookupRow(rows.value[0]!.id)

      expect(api.lookupIp).not.toHaveBeenCalled()
      expect(rows.value[0]!.status).toBe('idle')
    })

    it('should skip re-lookup if already have successful result for same IP', async () => {
      const mockResult = {
        ip: '8.8.8.8',
        country: 'United States',
        country_code: 'US',
        timezone: 'America/New_York',
        city: 'Mountain View'
      }
      vi.mocked(api.lookupIp).mockResolvedValue(mockResult)

      const { rows, updateRowIp, lookupRow } = useIpLookup()
      const rowId = rows.value[0]!.id

      updateRowIp(rowId, '8.8.8.8')
      await lookupRow(rowId)
      expect(api.lookupIp).toHaveBeenCalledTimes(1)

      // Try to lookup again
      await lookupRow(rowId)
      expect(api.lookupIp).toHaveBeenCalledTimes(1) // Should not call again
    })

    it('should do nothing if row not found', async () => {
      const { lookupRow } = useIpLookup()

      await lookupRow(9999)

      expect(api.lookupIp).not.toHaveBeenCalled()
    })

    it('should handle non-Error exceptions', async () => {
      vi.mocked(api.lookupIp).mockRejectedValue('string error')

      const { rows, updateRowIp, lookupRow } = useIpLookup()
      const rowId = rows.value[0]!.id

      updateRowIp(rowId, '8.8.8.8')
      await lookupRow(rowId)

      expect(rows.value[0]!.status).toBe('error')
      expect(rows.value[0]!.error).toBe('Lookup failed')
    })

    it('should trim IP before lookup', async () => {
      const mockResult = {
        ip: '8.8.8.8',
        country: 'United States',
        country_code: 'US',
        timezone: 'UTC',
        city: null
      }
      vi.mocked(api.lookupIp).mockResolvedValue(mockResult)

      const { rows, updateRowIp, lookupRow } = useIpLookup()
      const rowId = rows.value[0]!.id

      updateRowIp(rowId, '  8.8.8.8  ')
      await lookupRow(rowId)

      expect(api.lookupIp).toHaveBeenCalledWith('8.8.8.8')
    })
  })
})
