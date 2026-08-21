import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatRequest } from '../app/types/chat'

type ChatStreamHandler = (event: TestEvent) => Promise<void>

type TestEvent = {
  node: {
    res: EventEmitter & {
      setHeader: ReturnType<typeof vi.fn>
    }
  }
}

const originalBackendBaseUrl = process.env.BACKEND_BASE_URL
const encoder = new TextEncoder()

const request: ChatRequest = {
  clientRequestId: 'request-1',
  messages: [
    { id: 'message-1', role: 'user', content: 'First question' },
    { id: 'message-2', role: 'assistant', content: 'First answer' },
    { id: 'message-3', role: 'user', content: '  Latest question  ' }
  ]
}

function event() {
  return {
    node: {
      res: Object.assign(new EventEmitter(), { setHeader: vi.fn() })
    }
  }
}

function springSseResponse(chunks: Uint8Array[], status = 200, headers: Record<string, string> = {}) {
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach(chunk => controller.enqueue(chunk))
      controller.close()
    }
  }), {
    status,
    headers: { 'content-type': 'text/event-stream', ...headers }
  })
}

async function loadHandler(options: {
  body?: Partial<ChatRequest>
  fetcher?: ReturnType<typeof vi.fn>
} = {}) {
  const output: Uint8Array[] = []
  const fetcher = options.fetcher ?? vi.fn(async () => springSseResponse([encoder.encode('data:Hello\n\n')]))

  vi.stubGlobal('defineEventHandler', (handler: ChatStreamHandler) => handler)
  vi.stubGlobal('readBody', vi.fn(async () => options.body ?? request))
  vi.stubGlobal('fetch', fetcher)
  vi.stubGlobal('setResponseHeaders', vi.fn())
  vi.stubGlobal('createError', (details: Record<string, unknown>) => Object.assign(new Error(String(details.statusMessage)), details))
  vi.stubGlobal('sendStream', vi.fn(async (_event: TestEvent, stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      output.push(value)
    }
  }))

  const module = await import('../server/api/chat/stream.post')
  return {
    handler: module.default as unknown as ChatStreamHandler,
    fetcher,
    output
  }
}

beforeEach(() => {
  vi.resetModules()
  process.env.BACKEND_BASE_URL = 'http://backend.internal/'
})

afterEach(() => {
  if (originalBackendBaseUrl === undefined) delete process.env.BACKEND_BASE_URL
  else process.env.BACKEND_BASE_URL = originalBackendBaseUrl
  vi.unstubAllGlobals()
})

describe('chat stream server route', () => {
  it('streams the latest user message from the private backend', async () => {
    const source = encoder.encode('data:Hello 👋\n\ndata:café\n\n')
    const fetcher = vi.fn(async () => springSseResponse(Array.from(source, byte => Uint8Array.of(byte))))
    const { handler, output } = await loadHandler({ fetcher })
    const testEvent = event()

    await handler(testEvent)

    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, init] = fetcher.mock.calls[0]!
    expect(String(url)).toBe('http://backend.internal/api/chat/stream?message=Latest+question')
    expect(init).toMatchObject({
      method: 'POST',
      headers: { Accept: 'text/event-stream' }
    })
    expect(new TextDecoder().decode(Buffer.concat(output))).toBe([
      'event: delta',
      'data: {"type":"delta","text":"Hello 👋"}',
      '',
      'event: delta',
      'data: {"type":"delta","text":"café"}',
      '',
      'event: done',
      'data: {"type":"done"}',
      '',
      ''
    ].join('\n'))
    expect(setResponseHeaders).toHaveBeenCalledWith(testEvent, {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no'
    })
  })

  it('preserves leading whitespace in Spring token chunks', async () => {
    const fetcher = vi.fn(async () => springSseResponse([
      encoder.encode('data:My\n\ndata: purpose\n\ndata: is\n\n')
    ]))
    const { handler, output } = await loadHandler({ fetcher })

    await handler(event())

    const streamed = new TextDecoder().decode(Buffer.concat(output))
    expect(streamed).toContain('{"type":"delta","text":"My"}')
    expect(streamed).toContain('{"type":"delta","text":" purpose"}')
    expect(streamed).toContain('{"type":"delta","text":" is"}')
  })

  it('does not emit done when the upstream stream fails', async () => {
    let sentDelta = false
    const fetcher = vi.fn(async () => new Response(new ReadableStream<Uint8Array>({
      pull(controller) {
        if (!sentDelta) {
          sentDelta = true
          controller.enqueue(encoder.encode('data:Partial\n\n'))
          return
        }
        controller.error(new Error('connection lost'))
      }
    }), { headers: { 'content-type': 'text/event-stream' } }))
    const { handler, output } = await loadHandler({ fetcher })

    await expect(handler(event())).rejects.toThrow('connection lost')

    const streamed = new TextDecoder().decode(Buffer.concat(output))
    expect(streamed).toContain('{"type":"delta","text":"Partial"}')
    expect(streamed).not.toContain('event: done')
  })

  it('rejects missing messages and missing backend configuration', async () => {
    const missingMessage = await loadHandler({ body: { messages: [] } })
    await expect(missingMessage.handler(event())).rejects.toMatchObject({ statusCode: 400 })

    vi.resetModules()
    delete process.env.BACKEND_BASE_URL
    const missingConfig = await loadHandler()
    await expect(missingConfig.handler(event())).rejects.toMatchObject({ statusCode: 503 })
  })

  it('preserves upstream status and retry-after metadata', async () => {
    const fetcher = vi.fn(async () => new Response('', {
      status: 429,
      headers: { 'retry-after': '12' }
    }))
    const { handler } = await loadHandler({ fetcher })
    const testEvent = event()

    await expect(handler(testEvent)).rejects.toMatchObject({ statusCode: 429 })
    expect(testEvent.node.res.setHeader).toHaveBeenCalledWith('Retry-After', '12')
  })

  it('normalizes connection and invalid-stream failures to 502', async () => {
    const failedFetch = await loadHandler({ fetcher: vi.fn(async () => { throw new Error('offline') }) })
    await expect(failedFetch.handler(event())).rejects.toMatchObject({ statusCode: 502 })

    vi.resetModules()
    const invalidStream = await loadHandler({
      fetcher: vi.fn(async () => new Response('buffered', { headers: { 'content-type': 'text/plain' } }))
    })
    await expect(invalidStream.handler(event())).rejects.toMatchObject({ statusCode: 502 })
  })

  it('aborts the backend request when the browser connection closes', async () => {
    let upstreamSignal: AbortSignal | undefined
    const fetcher = vi.fn(async (_url: URL, init: RequestInit) => {
      upstreamSignal = init.signal ?? undefined
      return springSseResponse([encoder.encode('data:Waiting\n\n')])
    })
    const { handler } = await loadHandler({ fetcher })
    vi.stubGlobal('sendStream', vi.fn(async (testEvent: TestEvent) => {
      testEvent.node.res.emit('close')
    }))

    await handler(event())

    expect(upstreamSignal?.aborted).toBe(true)
  })
})
