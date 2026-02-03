import { ref, onUnmounted, watch, type Ref } from 'vue'
import { subscribe } from './tickSource'

export function useRealtimeClock(timezone: Ref<string | null>) {
  const time = ref('')
  let unsubscribe: (() => void) | null = null
  let formatter: Intl.DateTimeFormat | null = null

  function updateFormatter() {
    if (!timezone.value) {
      formatter = null
      return
    }

    try {
      formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone.value,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    } catch {
      formatter = null
    }
  }

  function updateTime() {
    if (!formatter) {
      time.value = ''
      return
    }

    time.value = formatter.format(new Date())
  }

  function startClock() {
    stopClock()
    unsubscribe = subscribe(updateTime)
  }

  function stopClock() {
    if (unsubscribe !== null) {
      unsubscribe()
      unsubscribe = null
    }
  }

  watch(
    timezone,
    (newTimezone) => {
      updateFormatter()
      if (newTimezone) {
        startClock()
      } else {
        stopClock()
        time.value = ''
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    stopClock()
  })

  return { time }
}
