import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'

// Create a mock subscribe function that we can control
const mockUnsubscribe = vi.fn()
const mockSubscribe = vi.fn((callback: () => void) => {
  callback() // call immediately like real implementation
  return mockUnsubscribe
})

// Mock tickSource before importing useRealtimeClock
vi.mock('./tickSource', () => ({
  subscribe: (callback: () => void) => mockSubscribe(callback)
}))

import { useRealtimeClock } from './useRealtimeClock'

describe('useRealtimeClock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return empty time when timezone is null', async () => {
    const timezone = ref<string | null>(null)
    const { time } = useRealtimeClock(timezone)

    await nextTick()

    expect(time.value).toBe('')
    expect(mockSubscribe).not.toHaveBeenCalled()
  })

  it('should format time for valid timezone', async () => {
    const timezone = ref<string | null>('America/New_York')
    const { time } = useRealtimeClock(timezone)

    await nextTick()

    expect(mockSubscribe).toHaveBeenCalled()
    // Time should be in HH:MM:SS format
    expect(time.value).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  it('should handle invalid timezone gracefully', async () => {
    const timezone = ref<string | null>('Invalid/Timezone')
    const { time } = useRealtimeClock(timezone)

    await nextTick()

    // Should not crash, time should be empty for invalid timezone
    expect(time.value).toBe('')
  })

  it('should update when timezone changes', async () => {
    const timezone = ref<string | null>(null)
    const { time } = useRealtimeClock(timezone)

    await nextTick()
    expect(time.value).toBe('')

    timezone.value = 'Europe/London'
    await nextTick()

    expect(mockSubscribe).toHaveBeenCalled()
    expect(time.value).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  it('should stop clock when timezone becomes null', async () => {
    const timezone = ref<string | null>('UTC')
    const { time } = useRealtimeClock(timezone)

    await nextTick()
    expect(time.value).toMatch(/^\d{2}:\d{2}:\d{2}$/)

    timezone.value = null
    await nextTick()

    expect(mockUnsubscribe).toHaveBeenCalled()
    expect(time.value).toBe('')
  })

  it('should work with various timezone formats', async () => {
    const testCases = [
      'UTC',
      'America/Los_Angeles',
      'Asia/Tokyo',
      'Europe/Paris',
    ]

    for (const tz of testCases) {
      vi.clearAllMocks()
      const timezone = ref<string | null>(tz)
      const { time } = useRealtimeClock(timezone)

      await nextTick()

      expect(time.value).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    }
  })
})
