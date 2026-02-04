type TickCallback = () => void

let intervalId: number | null = null
const subscribers = new Set<TickCallback>()

function tick() {
  subscribers.forEach(callback => callback())
}

export function subscribe(callback: TickCallback): () => void {
  subscribers.add(callback)

  if (subscribers.size === 1) {
    tick()
    intervalId = window.setInterval(tick, 1000)
  }

  return () => {
    subscribers.delete(callback)
    if (subscribers.size === 0 && intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}
