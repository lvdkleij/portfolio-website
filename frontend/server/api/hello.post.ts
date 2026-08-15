import type { ChatRequest } from '../../app/types/chat'

function latestUserMessage(request: Partial<ChatRequest>) {
  return request.messages
    ?.findLast(message => message.role === 'user')
    ?.content
    .trim()
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

  const helloUrl = new URL('/api/hello', `${backendBaseUrl.replace(/\/+$/, '')}/`)
  const response = await $fetch<string>(helloUrl.toString(), {
    query: { message },
    responseType: 'text'
  })

  setResponseHeaders(event, {
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream; charset=utf-8'
  })

  return [
    'event: delta',
    `data: ${JSON.stringify({ type: 'delta', text: response })}`,
    '',
    'event: done',
    `data: ${JSON.stringify({ type: 'done' })}`,
    '',
    ''
  ].join('\n')
})
