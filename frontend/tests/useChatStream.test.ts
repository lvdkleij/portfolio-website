import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChatRequest } from '~/types/chat'
import { useChatStream } from '~/composables/useChatStream'
import { renderSafeMarkdown } from '~/utils/markdown'

const request: ChatRequest = {
  clientRequestId: 'request-1',
  messages: [{ id: 'message-1', role: 'user', content: 'Hello' }]
}

function sseResponse(parts: string[], status = 200, headers: Record<string, string> = {}) {
  const encoder = new TextEncoder()
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      parts.forEach(part => controller.enqueue(encoder.encode(part)))
      controller.close()
    }
  }), {
    status,
    headers: { 'content-type': 'text/event-stream', ...headers }
  })
}

describe('useChatStream', () => {
  afterEach(() => vi.useRealTimers())

  it('streams deltas and exposes real status, sources and usage metadata', async () => {
    const fetcher = vi.fn(async () => sseResponse([
      'event: status\ndata: {"type":"status","requestId":"server-1","model":"deployed-model","stage":{"id":"guard","label":"Safety check","state":"complete"}}\n\n',
      'event: delta\ndata: {"type":"delta","text":"Hello "}\n\n',
      'event: delta\ndata: {"type":"delta","text":"world"}\n\n',
      'event: sources\ndata: {"type":"sources","sources":[{"id":"resume","title":"Résumé"}]}\n\n',
      'event: done\ndata: {"type":"done","durationMs":125,"usage":{"inputTokens":4,"outputTokens":2}}\n\n'
    ]))
    const chat = useChatStream({ endpoint: 'https://example.test/api/chat', fetcher })

    await chat.start(request)

    expect(chat.state.value).toBe('complete')
    expect(chat.responseText.value).toBe('Hello world')
    expect(chat.requestId.value).toBe('server-1')
    expect(chat.model.value).toBe('deployed-model')
    expect(chat.trace.value).toHaveLength(1)
    expect(chat.sources.value[0]?.title).toBe('Résumé')
    expect(chat.usage.value).toEqual({ inputTokens: 4, outputTokens: 2 })
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual(request)
  })

  it('accumulates and renders Markdown split across stream deltas', async () => {
    const encoder = new TextEncoder()
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined
    const response = new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller
      }
    }), { headers: { 'content-type': 'text/event-stream' } })
    const chat = useChatStream({
      endpoint: 'https://example.test/api/chat/stream',
      fetcher: async () => response
    })

    const pending = chat.start(request)
    streamController?.enqueue(encoder.encode([
      'event: delta',
      `data: ${JSON.stringify({ type: 'delta', text: 'Intro.\n\n## Res' })}`,
      '',
      ''
    ].join('\n')))

    await vi.waitFor(() => expect(chat.responseText.value).toBe('Intro.\n\n## Res'))
    expect(chat.state.value).toBe('streaming')
    expect(renderSafeMarkdown(chat.responseText.value)).not.toContain('<script')

    streamController?.enqueue(encoder.encode([
      'event: delta',
      `data: ${JSON.stringify({ type: 'delta', text: 'ponse\n\nA **formatted' })}`,
      '',
      'event: delta',
      `data: ${JSON.stringify({ type: 'delta', text: '** answer.' })}`,
      '',
      ''
    ].join('\n')))
    streamController?.enqueue(encoder.encode('event: done\ndata: {"type":"done"}\n\n'))
    streamController?.close()
    await pending

    expect(chat.responseText.value).toBe('Intro.\n\n## Response\n\nA **formatted** answer.')
    expect(renderSafeMarkdown(chat.responseText.value)).toContain('<h2>Response</h2>')
    expect(renderSafeMarkdown(chat.responseText.value)).toContain('<strong>formatted</strong>')
    expect(chat.state.value).toBe('complete')
  })

  it('maps rate limiting and retry-after metadata', async () => {
    const chat = useChatStream({
      endpoint: 'https://example.test/api/chat',
      fetcher: async () => new Response('', { status: 429, headers: { 'retry-after': '12' } })
    })

    await chat.start(request)

    expect(chat.state.value).toBe('error')
    expect(chat.error.value).toMatchObject({ code: 'rate_limited', retryable: true, retryAfterSeconds: 12 })
  })

  it('preserves partial output when a stream disconnects before done', async () => {
    const chat = useChatStream({
      endpoint: 'https://example.test/api/chat',
      fetcher: async () => sseResponse(['event: delta\ndata: {"type":"delta","text":"Partial"}\n\n'])
    })

    await chat.start(request)

    expect(chat.responseText.value).toBe('Partial')
    expect(chat.state.value).toBe('error')
    expect(chat.error.value?.code).toBe('stream_interrupted')
  })

  it('moves through the cold-start state and can be cancelled', async () => {
    vi.useFakeTimers()
    const fetcher = (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })
    const chat = useChatStream({ endpoint: 'https://example.test/api/chat', fetcher, coldStartDelayMs: 1500 })

    const pending = chat.start(request)
    expect(chat.state.value).toBe('connecting')
    await vi.advanceTimersByTimeAsync(1500)
    expect(chat.coldStart.value).toBe(true)

    chat.stop()
    await pending
    expect(chat.state.value).toBe('cancelled')
    expect(chat.coldStart.value).toBe(false)
  })

  it('aborts a replaced request without overwriting the replacement state', async () => {
    let call = 0
    const fetcher = (_input: RequestInfo | URL, init?: RequestInit) => {
      call += 1
      if (call === 2) {
        return Promise.resolve(sseResponse([
          'event: delta\ndata: {"type":"delta","text":"Replacement"}\n\n',
          'event: done\ndata: {"type":"done"}\n\n'
        ]))
      }
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })
    }
    const chat = useChatStream({ endpoint: 'https://example.test/api/chat', fetcher })

    const first = chat.start(request)
    const second = chat.start({ ...request, clientRequestId: 'request-2' })
    await Promise.all([first, second])

    expect(chat.state.value).toBe('complete')
    expect(chat.responseText.value).toBe('Replacement')
  })
})
