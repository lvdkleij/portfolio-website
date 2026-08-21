import type { ChatRequest } from '../../../app/types/chat'

const encoder = new TextEncoder()

function latestUserMessage(request: Partial<ChatRequest>) {
  return request.messages
    ?.findLast(message => message.role === 'user')
    ?.content
    .trim()
}

function eventBoundary(buffer: string) {
  const match = /\r\n\r\n|\n\n|\r\r/.exec(buffer)
  if (!match || match.index === undefined) return undefined

  return {
    index: match.index,
    length: match[0].length
  }
}

function eventData(block: string) {
  const dataLines = block
    .split(/\r\n|\r|\n/)
    .filter(line => line === 'data' || line.startsWith('data:'))
    .map(line => line.startsWith('data: ') ? line.slice(6) : line.slice(5))

  return dataLines.length > 0 ? dataLines.join('\n') : undefined
}

function deltaFrame(text: string) {
  return [
    'event: delta',
    `data: ${JSON.stringify({ type: 'delta', text })}`,
    '',
    ''
  ].join('\n')
}

function doneFrame() {
  return [
    'event: done',
    `data: ${JSON.stringify({ type: 'done' })}`,
    '',
    ''
  ].join('\n')
}

export function adaptSpringSse(source: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder()
  let buffer = ''

  function enqueueBlock(block: string, controller: TransformStreamDefaultController<Uint8Array>) {
    const data = eventData(block)
    if (data !== undefined) controller.enqueue(encoder.encode(deltaFrame(data)))
  }

  return source.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true })

      for (let boundary = eventBoundary(buffer); boundary; boundary = eventBoundary(buffer)) {
        enqueueBlock(buffer.slice(0, boundary.index), controller)
        buffer = buffer.slice(boundary.index + boundary.length)
      }
    },
    flush(controller) {
      buffer += decoder.decode()
      if (buffer.length > 0) enqueueBlock(buffer, controller)
      controller.enqueue(encoder.encode(doneFrame()))
    }
  }))
}

export default defineEventHandler(async (event) => {
  const backendBaseUrl = process.env.BACKEND_BASE_URL?.trim()

  if (!backendBaseUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: 'BACKEND_BASE_URL is not configured'
    })
  }

  const request = await readBody<Partial<ChatRequest>>(event)
  const message = latestUserMessage(request)

  if (!message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A user message is required'
    })
  }

  const chatUrl = new URL('/api/chat/stream', `${backendBaseUrl.replace(/\/+$/, '')}/`)
  chatUrl.searchParams.set('message', message)

  const upstreamController = new AbortController()
  const abortUpstream = () => upstreamController.abort()
  event.node.res.once('close', abortUpstream)

  let response: Response
  try {
    response = await fetch(chatUrl, {
      method: 'POST',
      headers: { Accept: 'text/event-stream' },
      signal: upstreamController.signal
    })
  } catch {
    event.node.res.off('close', abortUpstream)
    throw createError({
      statusCode: 502,
      statusMessage: 'Backend chat request failed'
    })
  }

  if (!response.ok) {
    event.node.res.off('close', abortUpstream)
    upstreamController.abort()
    const retryAfter = response.headers.get('retry-after')
    if (retryAfter) event.node.res.setHeader('Retry-After', retryAfter)

    throw createError({
      statusCode: response.status,
      statusMessage: 'Backend chat request failed'
    })
  }

  if (!response.body || !response.headers.get('content-type')?.toLowerCase().includes('text/event-stream')) {
    event.node.res.off('close', abortUpstream)
    upstreamController.abort()
    throw createError({
      statusCode: 502,
      statusMessage: 'Backend returned an invalid chat stream'
    })
  }

  setResponseHeaders(event, {
    'Cache-Control': 'no-cache, no-transform',
    'Content-Type': 'text/event-stream; charset=utf-8',
    'X-Accel-Buffering': 'no'
  })

  try {
    await sendStream(event, adaptSpringSse(response.body))
  } finally {
    event.node.res.off('close', abortUpstream)
    upstreamController.abort()
  }
})
