import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import IpInputRow from './IpInputRow.vue'
import type { IpRow } from '../types'

// Mock the tickSource to prevent actual timers
vi.mock('../composables/tickSource', () => ({
  subscribe: vi.fn((callback: () => void) => {
    callback()
    return vi.fn()
  })
}))

describe('IpInputRow', () => {
  const createRow = (overrides: Partial<IpRow> = {}): IpRow => ({
    id: 1,
    ip: '',
    status: 'idle',
    result: null,
    error: null,
    ...overrides
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render input with empty value', () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow(),
          index: 1
        }
      })

      const input = wrapper.find('input')
      expect(input.exists()).toBe(true)
      expect(input.element.value).toBe('')
    })

    it('should render row index', () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow(),
          index: 3
        }
      })

      expect(wrapper.find('.row-label').text()).toBe('3.')
    })

    it('should render IP value in input', () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ ip: '8.8.8.8' }),
          index: 1
        }
      })

      expect(wrapper.find('input').element.value).toBe('8.8.8.8')
    })

    it('should disable input when loading', () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ ip: '8.8.8.8', status: 'loading' }),
          index: 1
        }
      })

      expect(wrapper.find('input').element.disabled).toBe(true)
    })

    it('should show loading spinner when status is loading', () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ status: 'loading' }),
          index: 1
        }
      })

      expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(true)
    })
  })

  describe('success state', () => {
    it('should display country and city on success', () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({
            ip: '8.8.8.8',
            status: 'success',
            result: {
              ip: '8.8.8.8',
              country: 'United States',
              country_code: 'US',
              timezone: 'America/New_York',
              city: 'Mountain View'
            }
          }),
          index: 1
        }
      })

      expect(wrapper.find('.country').text()).toBe('United States')
      expect(wrapper.find('.city').text()).toBe('Mountain View')
    })

    it('should display flag emoji for country code', () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({
            ip: '8.8.8.8',
            status: 'success',
            result: {
              ip: '8.8.8.8',
              country: 'United States',
              country_code: 'US',
              timezone: 'UTC',
              city: null
            }
          }),
          index: 1
        }
      })

      expect(wrapper.find('.flag').text()).toBe('🇺🇸')
    })
  })

  describe('error state', () => {
    it('should display error message', () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({
            ip: 'invalid',
            status: 'error',
            error: 'Invalid IP address'
          }),
          index: 1
        }
      })

      expect(wrapper.find('.error-result').text()).toBe('Invalid IP address')
    })
  })

  describe('validation error', () => {
    it('should show validation error for invalid IP when not focused', async () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ ip: 'invalid' }),
          index: 1
        }
      })

      // Need to blur to show validation error
      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.trigger('blur')

      expect(wrapper.find('.validation-error').exists()).toBe(true)
    })

    it('should not show validation error when focused', async () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ ip: 'invalid' }),
          index: 1
        }
      })

      const input = wrapper.find('input')
      await input.trigger('focus')

      expect(wrapper.find('.validation-error').exists()).toBe(false)
    })

    it('should add input-error class for invalid IP', async () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ ip: 'invalid' }),
          index: 1
        }
      })

      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.trigger('blur')

      expect(input.classes()).toContain('input-error')
    })
  })

  describe('events', () => {
    it('should emit update:ip on input', async () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow(),
          index: 1
        }
      })

      const input = wrapper.find('input')
      await input.setValue('8.8.8.8')

      expect(wrapper.emitted('update:ip')).toBeTruthy()
      expect(wrapper.emitted('update:ip')![0]).toEqual(['8.8.8.8'])
    })

    it('should emit lookup on blur with valid IP', async () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ ip: '8.8.8.8' }),
          index: 1
        }
      })

      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.trigger('blur')

      expect(wrapper.emitted('lookup')).toBeTruthy()
    })

    it('should not emit lookup on blur with empty IP', async () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ ip: '' }),
          index: 1
        }
      })

      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.trigger('blur')

      expect(wrapper.emitted('lookup')).toBeFalsy()
    })

    it('should not emit lookup on blur with invalid IP', async () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ ip: 'invalid' }),
          index: 1
        }
      })

      const input = wrapper.find('input')
      await input.trigger('focus')
      await input.trigger('blur')

      expect(wrapper.emitted('lookup')).toBeFalsy()
    })

    it('should emit lookup on Enter with valid IP', async () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ ip: '8.8.8.8' }),
          index: 1
        }
      })

      const input = wrapper.find('input')
      await input.trigger('keydown.enter')

      expect(wrapper.emitted('lookup')).toBeTruthy()
    })

    it('should not emit lookup on Enter with invalid IP', async () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow({ ip: 'invalid' }),
          index: 1
        }
      })

      const input = wrapper.find('input')
      await input.trigger('keydown.enter')

      expect(wrapper.emitted('lookup')).toBeFalsy()
    })

    it('should emit remove when remove button clicked', async () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow(),
          index: 1
        }
      })

      await wrapper.find('.remove-button').trigger('click')

      expect(wrapper.emitted('remove')).toBeTruthy()
    })
  })

  describe('expose', () => {
    it('should expose focus method', () => {
      const wrapper = mount(IpInputRow, {
        props: {
          row: createRow(),
          index: 1
        }
      })

      expect(typeof wrapper.vm.focus).toBe('function')
    })
  })
})
