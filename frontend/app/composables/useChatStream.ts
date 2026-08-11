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
  let controller: AbortController | undefined
  let coldStartTimer: ReturnType<typeof setTimeout> | undefined

  function clearColdStartTimer() {
    if (coldStartTimer) clearTimeout(coldStartTimer)
    coldStartTimer = undefined
  }

  function reset() {
    controller?.abort()
    controller = undefined
    clearColdStartTimer()
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
    controller.abort()
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
          responseText.value += event.text
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
        state.value = 'complete'
      })

      if (!receivedDone) {
        throw new StreamFailure({
          code: 'stream_interrupted',
          message: 'The response ended before the assistant finished.',
          retryable: true
        })
      }
    } catch (caught) {
      if (controller !== requestController) return
      clearColdStartTimer()
      coldStart.value = false
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
    reset
  }
}
