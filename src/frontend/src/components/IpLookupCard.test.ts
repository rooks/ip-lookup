import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import IpLookupCard from './IpLookupCard.vue'
import type { IpRow } from '../types'

// Mock the useIpLookup composable
const mockAddRow = vi.fn()
const mockUpdateRowIp = vi.fn()
const mockLookupRow = vi.fn()
const mockRemoveRow = vi.fn()
let mockRowsRef = ref<IpRow[]>([{ id: 1, ip: '', status: 'idle', result: null, error: null }])

vi.mock('../composables/useIpLookup', () => ({
  useIpLookup: () => ({
    rows: mockRowsRef,
    addRow: mockAddRow,
    updateRowIp: mockUpdateRowIp,
    lookupRow: mockLookupRow,
    removeRow: mockRemoveRow
  })
}))

// Mock tickSource to prevent timer issues
vi.mock('../composables/tickSource', () => ({
  subscribe: vi.fn((callback: () => void) => {
    callback()
    return vi.fn()
  })
}))

describe('IpLookupCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRowsRef = ref<IpRow[]>([{ id: 1, ip: '', status: 'idle', result: null, error: null }])
  })

  describe('rendering', () => {
    it('should render title and description', () => {
      const wrapper = mount(IpLookupCard)

      expect(wrapper.find('.title').text()).toBe('IP Lookup')
      expect(wrapper.find('.description').text()).toContain('Enter an IP address')
    })

    it('should render one IpInputRow for each row', () => {
      mockRowsRef = ref<IpRow[]>([
        { id: 1, ip: '', status: 'idle', result: null, error: null },
        { id: 2, ip: '8.8.8.8', status: 'idle', result: null, error: null }
      ])

      const wrapper = mount(IpLookupCard)

      const rows = wrapper.findAllComponents({ name: 'IpInputRow' })
      expect(rows).toHaveLength(2)
    })

    it('should pass correct index to each row', () => {
      mockRowsRef = ref<IpRow[]>([
        { id: 1, ip: '', status: 'idle', result: null, error: null },
        { id: 2, ip: '8.8.8.8', status: 'idle', result: null, error: null }
      ])

      const wrapper = mount(IpLookupCard)

      const rows = wrapper.findAllComponents({ name: 'IpInputRow' })
      expect(rows[0]!.props('index')).toBe(1)
      expect(rows[1]!.props('index')).toBe(2)
    })

    it('should render AddButton', () => {
      const wrapper = mount(IpLookupCard)

      expect(wrapper.findComponent({ name: 'AddButton' }).exists()).toBe(true)
    })
  })

  describe('empty state', () => {
    it('should show empty state when no rows', () => {
      mockRowsRef = ref<IpRow[]>([])

      const wrapper = mount(IpLookupCard)

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state').text()).toContain('No IP addresses added')
    })

    it('should not show empty state when rows exist', () => {
      const wrapper = mount(IpLookupCard)

      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })
  })

  describe('interactions', () => {
    it('should call addRow when AddButton clicked', async () => {
      const wrapper = mount(IpLookupCard)

      await wrapper.findComponent({ name: 'AddButton' }).trigger('click')

      expect(mockAddRow).toHaveBeenCalled()
    })

    it('should call updateRowIp when row emits update:ip', async () => {
      const wrapper = mount(IpLookupCard)

      const row = wrapper.findComponent({ name: 'IpInputRow' })
      await row.vm.$emit('update:ip', '8.8.8.8')

      expect(mockUpdateRowIp).toHaveBeenCalled()
      expect(mockUpdateRowIp.mock.calls[0]![1]).toBe('8.8.8.8')
    })

    it('should call lookupRow when row emits lookup', async () => {
      const wrapper = mount(IpLookupCard)

      const row = wrapper.findComponent({ name: 'IpInputRow' })
      await row.vm.$emit('lookup')

      expect(mockLookupRow).toHaveBeenCalled()
    })

    it('should call removeRow when row emits remove', async () => {
      const wrapper = mount(IpLookupCard)

      const row = wrapper.findComponent({ name: 'IpInputRow' })
      await row.vm.$emit('remove')

      expect(mockRemoveRow).toHaveBeenCalled()
    })
  })

  describe('row management', () => {
    it('should handle multiple rows with different states', () => {
      mockRowsRef = ref<IpRow[]>([
        { id: 1, ip: '8.8.8.8', status: 'success', result: { ip: '8.8.8.8', country: 'US', country_code: 'US', timezone: 'UTC', city: null }, error: null },
        { id: 2, ip: 'invalid', status: 'error', result: null, error: 'Invalid IP' },
        { id: 3, ip: '', status: 'idle', result: null, error: null }
      ])

      const wrapper = mount(IpLookupCard)

      const rows = wrapper.findAllComponents({ name: 'IpInputRow' })
      expect(rows).toHaveLength(3)

      expect(rows[0]!.props('row').status).toBe('success')
      expect(rows[1]!.props('row').status).toBe('error')
      expect(rows[2]!.props('row').status).toBe('idle')
    })

    it('should use row.id as key for v-for', () => {
      mockRowsRef = ref<IpRow[]>([
        { id: 5, ip: '', status: 'idle', result: null, error: null },
        { id: 10, ip: '', status: 'idle', result: null, error: null }
      ])

      const wrapper = mount(IpLookupCard)

      const rows = wrapper.findAllComponents({ name: 'IpInputRow' })
      expect(rows[0]!.props('row').id).toBe(5)
      expect(rows[1]!.props('row').id).toBe(10)
    })
  })
})
