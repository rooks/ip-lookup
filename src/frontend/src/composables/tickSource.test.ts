import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('tickSource', () => {
  let subscribe: typeof import('./tickSource').subscribe

  beforeEach(async () => {
    vi.useFakeTimers()
    // Re-import the module to reset global state between tests
    vi.resetModules()
    const module = await import('./tickSource')
    subscribe = module.subscribe
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call callback immediately on subscribe', () => {
    const callback = vi.fn()
    const unsubscribe = subscribe(callback)

    expect(callback).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('should call callback every second', () => {
    const callback = vi.fn()
    const unsubscribe = subscribe(callback)

    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)
    expect(callback).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(1000)
    expect(callback).toHaveBeenCalledTimes(3)

    unsubscribe()
  })

  it('should stop calling callback after unsubscribe', () => {
    const callback = vi.fn()
    const unsubscribe = subscribe(callback)

    expect(callback).toHaveBeenCalledTimes(1)

    unsubscribe()

    vi.advanceTimersByTime(3000)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple subscribers', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    const unsubscribe1 = subscribe(callback1)
    // First subscriber gets immediate tick
    expect(callback1).toHaveBeenCalledTimes(1)

    const unsubscribe2 = subscribe(callback2)
    // Second subscriber does NOT get immediate tick (interval already running)
    expect(callback2).toHaveBeenCalledTimes(0)

    vi.advanceTimersByTime(1000)
    // Both get called on interval tick
    expect(callback1).toHaveBeenCalledTimes(2)
    expect(callback2).toHaveBeenCalledTimes(1)

    unsubscribe1()

    vi.advanceTimersByTime(1000)
    expect(callback1).toHaveBeenCalledTimes(2) // no more calls
    expect(callback2).toHaveBeenCalledTimes(2) // still getting calls

    unsubscribe2()
  })

  it('should restart interval when all unsubscribe then resubscribe', () => {
    const callback1 = vi.fn()
    const unsubscribe1 = subscribe(callback1)

    unsubscribe1()
    vi.advanceTimersByTime(5000)

    const callback2 = vi.fn()
    const unsubscribe2 = subscribe(callback2)

    expect(callback2).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)
    expect(callback2).toHaveBeenCalledTimes(2)

    unsubscribe2()
  })
})
