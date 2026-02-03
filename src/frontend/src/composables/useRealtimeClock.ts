import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'

export function useRealtimeClock(timezone: Ref<string | null>) {
  const time = ref('')
  let intervalId: number | null = null

  function updateTime() {
    if (!timezone.value) {
      time.value = ''
      return
    }

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone.value,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      time.value = formatter.format(new Date())
    } catch {
      time.value = ''
    }
  }

  function startClock() {
    stopClock()
    updateTime()
    intervalId = window.setInterval(updateTime, 1000)
  }

  function stopClock() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  watch(
    timezone,
    (newTimezone) => {
      if (newTimezone) {
        startClock()
      } else {
        stopClock()
        time.value = ''
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    if (timezone.value) {
      startClock()
    }
  })

  onUnmounted(() => {
    stopClock()
  })

  return {
    time,
  }
}
