import { computed, readonly, ref } from 'vue'
import type {
  ChatClientError,
  ChatRequest,
  ChatSource,
  ChatState,
  ChatStreamErrorEvent,
  ChatTraceStage,
  ChatUsage
} from '~/types/chat'
import { ChatStreamProtocolError, consumeSseStream } from '~/utils/sse'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

type UseChatStreamOptions = {
  endpoint?: string
  fetcher?: Fetcher
  coldStartDelayMs?: number
  displayIntervalMs?: number
  completionDrainMs?: number
  displayScheduler?: StreamDisplayScheduler
}

type StreamDisplayScheduler = {
  schedule: (callback: (timestamp: number) => void) => () => void
  now: () => number
  flushImmediately: () => boolean
}

type GraphemeSegmenter = {
  segment: (input: string) => Iterable<{ segment: string }>
}

type GraphemeSegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: 'grapheme' },
) => GraphemeSegmenter

const Segmenter = (Intl as unknown as { Segmenter?: GraphemeSegmenterConstructor }).Segmenter
const graphemeSegmenter = Segmenter ? new Segmenter(undefined, { granularity: 'grapheme' }) : undefined

function splitGraphemes(value: string) {
  return graphemeSegmenter
    ? Array.from(graphemeSegmenter.segment(value), part => part.segment)
    : Array.from(value)
}

function schedulerNow() {
  return typeof performance === 'undefined' ? Date.now() : performance.now()
}

function createDisplayScheduler(): StreamDisplayScheduler {
  const reducedMotion = typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-motion: reduce)')
    : undefined

  return {
    schedule(callback) {
      if (typeof document !== 'undefined' && document.hidden) {
        const handle = setTimeout(() => callback(schedulerNow()), 0)
        return () => clearTimeout(handle)
      }

      if (typeof requestAnimationFrame === 'function') {
        const handle = requestAnimationFrame(callback)
        return () => cancelAnimationFrame(handle)
      }

      const handle = setTimeout(() => callback(schedulerNow()), 16)
      return () => clearTimeout(handle)
    },
    now: schedulerNow,
    flushImmediately() {
      return (typeof document !== 'undefined' && document.hidden) || Boolean(reducedMotion?.matches)
    }
  }
}

class StreamFailure extends Error {
  error: ChatClientError

  constructor(error: ChatClientError) {
    super(error.message)
    this.name = 'StreamFailure'
    this.error = error
  }
}

function retryAfterSeconds(response: Response) {
  const value = response.headers.get('retry-after')
  if (!value) return undefined
  const seconds = Number(value)
  return Number.isFinite(seconds) ? seconds : undefined
}

function httpError(response: Response): ChatClientError {
  const status = response.status
  if (status === 400) return { code: 'invalid_request', message: 'That message could not be sent. Check it and try again.', retryable: false, status }
  if (status === 413) return { code: 'request_too_large', message: 'This conversation is too large. Start a new chat and try again.', retryable: false, status }
  if (status === 429) return {
    code: 'rate_limited',
    message: 'The assistant is receiving too many requests. Please try again shortly.',
    retryable: true,
    status,
    retryAfterSeconds: retryAfterSeconds(response)
  }
  if (status === 502 || status === 503) return {
    code: 'assistant_unavailable',
    message: 'The assistant is starting or temporarily unavailable. Please try again.',
    retryable: true,
    status
  }
  return { code: 'request_failed', message: `The assistant request failed (${status}).`, retryable: status >= 500, status }
}

function eventError(event: ChatStreamErrorEvent): ChatClientError {
  return {
    code: event.code,
    message: event.message,
    retryable: event.retryable ?? false
  }
}

function unknownError(value: unknown): ChatClientError {
  if (value instanceof StreamFailure) return value.error
  if (value instanceof ChatStreamProtocolError) {
    return { code: 'invalid_stream', message: value.message, retryable: true }
  }
  return {
    code: 'connection_failed',
    message: 'The connection to the assistant was interrupted. Please try again.',
    retryable: true
  }
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const state = ref<ChatState>('idle')
  const responseText = ref('')
  const trace = ref<ChatTraceStage[]>([])
  const sources = ref<ChatSource[]>([])
  const usage = ref<ChatUsage>()
  const error = ref<ChatClientError>()
  const requestId = ref<string>()
  const model = ref<string>()
  const durationMs = ref<number>()
  const coldStart = ref(false)
  const active = computed(() => state.value === 'connecting' || state.value === 'streaming')
  const displayScheduler = options.displayScheduler ?? createDisplayScheduler()
  const displayIntervalMs = Math.max(0, options.displayIntervalMs ?? 32)
  const completionDrainMs = Math.max(0, options.completionDrainMs ?? 120)
  let controller: AbortController | undefined
  let coldStartTimer: ReturnType<typeof setTimeout> | undefined
  let pendingText = ''
  let cancelDisplayFrame: (() => void) | undefined
  let lastDisplayCommitAt = Number.NEGATIVE_INFINITY
  let completionDeadline: number | undefined
  let resolveDisplayDrain: (() => void) | undefined
  let displayGeneration = 0

  function settleDisplayDrain() {
    completionDeadline = undefined
    const resolve = resolveDisplayDrain
    resolveDisplayDrain = undefined
    resolve?.()
  }

  function cancelScheduledDisplay() {
    cancelDisplayFrame?.()
    cancelDisplayFrame = undefined
  }

  function flushPendingDisplay() {
    displayGeneration += 1
    cancelScheduledDisplay()
    if (pendingText) {
      responseText.value += pendingText
      pendingText = ''
      lastDisplayCommitAt = displayScheduler.now()
    }
    settleDisplayDrain()
  }

  function discardPendingDisplay() {
    displayGeneration += 1
    cancelScheduledDisplay()
    pendingText = ''
    lastDisplayCommitAt = Number.NEGATIVE_INFINITY
    settleDisplayDrain()
  }

  function revealCount(total: number, timestamp: number) {
    if (completionDeadline !== undefined) {
      const remainingMs = Math.max(0, completionDeadline - timestamp)
      const remainingCommits = Math.max(1, Math.ceil(remainingMs / Math.max(1, displayIntervalMs)))
      return Math.max(1, Math.ceil(total / remainingCommits))
    }

    const targetFrames = total > 96 ? 2 : total > 32 ? 3 : 4
    return Math.max(1, Math.ceil(total / targetFrames))
  }

  function scheduleDisplay() {
    if (!pendingText || cancelDisplayFrame) return

    if (displayScheduler.flushImmediately()) {
      flushPendingDisplay()
      return
    }

    const generation = displayGeneration
    cancelDisplayFrame = displayScheduler.schedule((timestamp) => {
      cancelDisplayFrame = undefined
      if (generation !== displayGeneration || !pendingText) return

      if (timestamp - lastDisplayCommitAt < displayIntervalMs) {
        scheduleDisplay()
        return
      }

      const graphemes = splitGraphemes(pendingText)
      const count = Math.min(graphemes.length, revealCount(graphemes.length, timestamp))
      responseText.value += graphemes.slice(0, count).join('')
      pendingText = graphemes.slice(count).join('')
      lastDisplayCommitAt = timestamp

      if (pendingText) scheduleDisplay()
      else settleDisplayDrain()
    })
  }

  function enqueueDisplayText(text: string) {
    if (!text) return

    if (!responseText.value && !pendingText) {
      responseText.value = text
      lastDisplayCommitAt = displayScheduler.now()
      return
    }

    pendingText += text
    scheduleDisplay()
  }

  function drainDisplay() {
    if (!pendingText) return Promise.resolve()
    if (displayScheduler.flushImmediately() || completionDrainMs === 0) {
      flushPendingDisplay()
      return Promise.resolve()
    }

    completionDeadline = displayScheduler.now() + completionDrainMs
    const drained = new Promise<void>((resolve) => {
      resolveDisplayDrain = resolve
    })
    scheduleDisplay()
    return drained
  }

  function clearColdStartTimer() {
    if (coldStartTimer) clearTimeout(coldStartTimer)
    coldStartTimer = undefined
  }

  function reset() {
    controller?.abort()
    controller = undefined
    clearColdStartTimer()
    discardPendingDisplay()
    responseText.value = ''
    trace.value = []
    sources.value = []
    usage.value = undefined
    error.value = undefined
    requestId.value = undefined
    model.value = undefined
    durationMs.value = undefined
    coldStart.value = false
    state.value = 'idle'
  }

  function stop() {
    if (!active.value || !controller) return
    flushPendingDisplay()
    controller.abort()
  }

  function dispose() {
    controller?.abort()
    controller = undefined
    clearColdStartTimer()
    discardPendingDisplay()
  }

  async function start(request: ChatRequest) {
    reset()

    const endpoint = options.endpoint ?? String(useRuntimeConfig().public.chatApiUrl || '')
    if (!endpoint) {
      state.value = 'error'
      error.value = {
        code: 'chat_not_configured',
        message: 'The assistant endpoint is not configured yet.',
        retryable: false
      }
      return
    }

    const fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    const requestController = new AbortController()
    let receivedDone = false
    controller = requestController
    state.value = 'connecting'
    coldStartTimer = setTimeout(() => {
      if (state.value === 'connecting') coldStart.value = true
    }, options.coldStartDelayMs ?? 1500)

    try {
      const response = await fetcher(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
        signal: requestController.signal
      })

      if (controller !== requestController) return

      if (!response.ok) throw new StreamFailure(httpError(response))
      if (!response.headers.get('content-type')?.toLowerCase().includes('text/event-stream')) {
        throw new StreamFailure({
          code: 'invalid_content_type',
          message: 'The assistant returned an unexpected response format.',
          retryable: true
        })
      }
      if (!response.body) {
        throw new StreamFailure({
          code: 'empty_stream',
          message: 'The assistant returned an empty response.',
          retryable: true
        })
      }

      await consumeSseStream(response.body, (event) => {
        if (controller !== requestController) return

        if (event.type === 'status') {
          if (event.requestId) requestId.value = event.requestId
          if (event.model) model.value = event.model
          const index = trace.value.findIndex(stage => stage.id === event.stage.id)
          if (index === -1) trace.value.push(event.stage)
          else trace.value.splice(index, 1, event.stage)
          return
        }

        if (event.type === 'delta') {
          clearColdStartTimer()
          coldStart.value = false
          state.value = 'streaming'
          enqueueDisplayText(event.text)
          return
        }

        if (event.type === 'sources') {
          sources.value = event.sources
          return
        }

        if (event.type === 'error') throw new StreamFailure(eventError(event))

        receivedDone = true
        clearColdStartTimer()
        requestId.value = event.requestId ?? requestId.value
        model.value = event.model ?? model.value
        durationMs.value = event.durationMs
        usage.value = event.usage
      })

      if (!receivedDone) {
        throw new StreamFailure({
          code: 'stream_interrupted',
          message: 'The response ended before the assistant finished.',
          retryable: true
        })
      }

      await drainDisplay()
      if (controller !== requestController) return
      if (requestController.signal.aborted) {
        state.value = 'cancelled'
        return
      }
      state.value = 'complete'
    } catch (caught) {
      if (controller !== requestController) return
      clearColdStartTimer()
      coldStart.value = false
      flushPendingDisplay()
      if (
        requestController.signal.aborted
        || (typeof DOMException !== 'undefined' && caught instanceof DOMException && caught.name === 'AbortError')
      ) {
        state.value = 'cancelled'
        return
      }
      state.value = 'error'
      error.value = unknownError(caught)
    } finally {
      if (controller === requestController) controller = undefined
    }
  }

  return {
    state: readonly(state),
    active,
    responseText: readonly(responseText),
    trace: readonly(trace),
    sources: readonly(sources),
    usage: readonly(usage),
    error: readonly(error),
    requestId: readonly(requestId),
    model: readonly(model),
    durationMs: readonly(durationMs),
    coldStart: readonly(coldStart),
    start,
    stop,
    reset,
    dispose
  }
}
