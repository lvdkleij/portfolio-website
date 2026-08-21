import { onBeforeUnmount, onMounted, readonly, ref } from 'vue'

export type BackendHeartbeatState = 'connecting' | 'ready' | 'stopped'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

type UseBackendHeartbeatOptions = {
  endpoint?: string
  fetcher?: Fetcher
  heartbeatIntervalMs?: number
  inactivityTimeoutMs?: number
  now?: () => number
}

const DEFAULT_HEARTBEAT_INTERVAL_MS = 60_000
const DEFAULT_INACTIVITY_TIMEOUT_MS = 10 * 60_000
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

export function useBackendHeartbeat(options: UseBackendHeartbeatOptions = {}) {
  const state = ref<BackendHeartbeatState>('stopped')
  const endpoint = options.endpoint ?? '/api/heartbeat'
  const fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
  const heartbeatIntervalMs = options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS
  const inactivityTimeoutMs = options.inactivityTimeoutMs ?? DEFAULT_INACTIVITY_TIMEOUT_MS
  const now = options.now ?? Date.now

  let lastActivityAt = 0
  let interval: ReturnType<typeof setInterval> | undefined
  let requestController: AbortController | undefined
  let heartbeatInFlight: Promise<void> | undefined
  let started = false

  function isVisible() {
    return document.visibilityState === 'visible'
  }

  function isRecentlyActive() {
    return now() - lastActivityAt < inactivityTimeoutMs
  }

  function clearHeartbeatInterval() {
    if (interval) clearInterval(interval)
    interval = undefined
  }

  async function sendHeartbeat() {
    if (!started || !isVisible() || !isRecentlyActive()) return
    if (heartbeatInFlight) return heartbeatInFlight

    if (state.value !== 'ready') state.value = 'connecting'

    const controller = new AbortController()
    requestController = controller

    let request: Promise<void>
    request = fetcher(endpoint, {
      method: 'POST',
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Heartbeat failed (${response.status})`)
        if (started && isVisible() && isRecentlyActive()) state.value = 'ready'
      })
      .catch(() => {
        // Warming is best-effort. Chat requests retain their own visible error handling.
        if (started) state.value = 'stopped'
      })
      .finally(() => {
        if (heartbeatInFlight === request) heartbeatInFlight = undefined
        if (requestController === controller) requestController = undefined
      })

    heartbeatInFlight = request
    return request
  }

  function heartbeatTick() {
    if (!isVisible() || !isRecentlyActive()) {
      clearHeartbeatInterval()
      state.value = 'stopped'
      return
    }

    void sendHeartbeat()
  }

  function startHeartbeatInterval() {
    if (interval || !isVisible() || !isRecentlyActive()) return
    interval = setInterval(heartbeatTick, heartbeatIntervalMs)
  }

  function recordActivity() {
    const wasRecentlyActive = isRecentlyActive()
    lastActivityAt = now()

    if (!started || !isVisible()) return

    if (!wasRecentlyActive) void sendHeartbeat()
    startHeartbeatInterval()
  }

  function handleVisibilityChange() {
    if (!isVisible()) {
      clearHeartbeatInterval()
      state.value = 'stopped'
      return
    }

    if (!isRecentlyActive()) return
    void sendHeartbeat()
    startHeartbeatInterval()
  }

  function handleScroll() {
    recordActivity()
  }

  function start() {
    if (started) return

    started = true
    lastActivityAt = now()
    ACTIVITY_EVENTS.forEach(eventName => document.addEventListener(eventName, recordActivity))
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    if (!isVisible()) return
    void sendHeartbeat()
    startHeartbeatInterval()
  }

  function stop() {
    if (!started) return

    started = false
    state.value = 'stopped'
    clearHeartbeatInterval()
    requestController?.abort()
    requestController = undefined
    ACTIVITY_EVENTS.forEach(eventName => document.removeEventListener(eventName, recordActivity))
    document.removeEventListener('scroll', handleScroll, { capture: true })
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  onMounted(start)
  onBeforeUnmount(stop)

  return { state: readonly(state), start, stop }
}
