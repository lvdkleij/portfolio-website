import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

const port = 8080
const allowedOrigin = 'http://localhost:3000'

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin === allowedOrigin ? allowedOrigin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    Vary: 'Origin'
  }
}

function sendEvent(response, event) {
  response.write(`event: ${event.type}\n`)
  response.write(`data: ${JSON.stringify(event)}\n\n`)
}

function requestCharacters(messages) {
  return messages.reduce((total, message) => (
    total + message.content.length + (message.attachment?.content?.length ?? 0)
  ), 0)
}

const server = createServer((request, response) => {
  const origin = request.headers.origin ?? ''
  const cors = corsHeaders(origin)

  if (request.method === 'OPTIONS') {
    response.writeHead(204, cors)
    response.end()
    return
  }

  if (request.method !== 'POST' || request.url !== '/api/chat') {
    response.writeHead(404, { ...cors, 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  let rawBody = ''
  request.setEncoding('utf8')
  request.on('data', chunk => {
    rawBody += chunk
    if (rawBody.length > 32_000) request.destroy()
  })

  request.on('end', () => {
    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      response.writeHead(400, { ...cors, 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    const messages = Array.isArray(payload.messages) ? payload.messages : []
    if (
      typeof payload.clientRequestId !== 'string'
      || messages.length === 0
      || messages.length > 12
      || messages.some(message => typeof message?.content !== 'string')
      || requestCharacters(messages) > 24_000
    ) {
      response.writeHead(400, { ...cors, 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid chat request' }))
      return
    }

    const startedAt = Date.now()
    const requestId = randomUUID()
    response.writeHead(200, {
      ...cors,
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no'
    })

    const events = [
      { type: 'status', requestId, model: 'local-mock', stage: { id: 'request', label: 'Request accepted', state: 'complete' } },
      { type: 'status', requestId, model: 'local-mock', stage: { id: 'response', label: 'Local mock response', state: 'active' } },
      { type: 'delta', text: 'This is a local streaming response. ' },
      { type: 'delta', text: 'Connect the Container Apps endpoint when the Spring API is ready.' },
      { type: 'status', requestId, model: 'local-mock', stage: { id: 'response', label: 'Local mock response', state: 'complete' } }
    ]
    let index = 0
    const timer = setInterval(() => {
      if (index < events.length) {
        sendEvent(response, events[index])
        index += 1
        return
      }

      sendEvent(response, { type: 'done', requestId, model: 'local-mock', durationMs: Date.now() - startedAt })
      clearInterval(timer)
      response.end()
    }, 180)

    response.on('close', () => clearInterval(timer))
  })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Local mock chat API listening at http://localhost:${port}/api/chat`)
})
