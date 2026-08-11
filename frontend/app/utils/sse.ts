import type { ChatStreamEvent } from '~/types/chat'

export class ChatStreamProtocolError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChatStreamProtocolError'
  }
}

const eventTypes = new Set<ChatStreamEvent['type']>(['status', 'delta', 'sources', 'done', 'error'])
const traceStates = new Set(['pending', 'active', 'complete', 'error'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseSseBlock(block: string): ChatStreamEvent | null {
  let eventName = ''
  const dataLines: string[] = []

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
    if (!line || line.startsWith(':')) continue

    const separator = line.indexOf(':')
    const field = separator === -1 ? line : line.slice(0, separator)
    let value = separator === -1 ? '' : line.slice(separator + 1)
    if (value.startsWith(' ')) value = value.slice(1)

    if (field === 'event') eventName = value
    if (field === 'data') dataLines.push(value)
  }

  if (dataLines.length === 0) return null

  const data = dataLines.join('\n')
  if (data === '[DONE]') return { type: 'done', finishReason: 'stop' }

  let payload: unknown
  try {
    payload = JSON.parse(data)
  } catch {
    throw new ChatStreamProtocolError('The assistant returned malformed streaming data.')
  }

  if (!isRecord(payload)) {
    throw new ChatStreamProtocolError('The assistant returned an invalid streaming event.')
  }

  const type = String(payload.type || eventName)
  if (!eventTypes.has(type as ChatStreamEvent['type'])) {
    throw new ChatStreamProtocolError(`The assistant returned an unsupported “${type || 'unnamed'}” event.`)
  }

  const event = { ...payload, type } as unknown as ChatStreamEvent
  if (event.type === 'delta' && typeof event.text !== 'string') {
    throw new ChatStreamProtocolError('A streamed text event did not contain text.')
  }
  if (event.type === 'status' && (
    !isRecord(event.stage)
    || typeof event.stage.id !== 'string'
    || typeof event.stage.label !== 'string'
    || !traceStates.has(String(event.stage.state))
  )) {
    throw new ChatStreamProtocolError('A streamed status event did not contain a valid stage.')
  }
  if (event.type === 'sources' && (
    !Array.isArray(event.sources)
    || event.sources.some(source => !isRecord(source) || typeof source.id !== 'string' || typeof source.title !== 'string')
  )) {
    throw new ChatStreamProtocolError('A streamed sources event did not contain a source list.')
  }
  if (event.type === 'error' && (typeof event.code !== 'string' || typeof event.message !== 'string')) {
    throw new ChatStreamProtocolError('A streamed error event was invalid.')
  }

  return event
}

export async function consumeSseStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ChatStreamEvent) => void
) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      let boundary = buffer.search(/\r?\n\r?\n/)

      while (boundary !== -1) {
        const block = buffer.slice(0, boundary)
        const delimiter = buffer.slice(boundary).match(/^\r?\n\r?\n/)?.[0] ?? '\n\n'
        buffer = buffer.slice(boundary + delimiter.length)
        const event = parseSseBlock(block)
        if (event) onEvent(event)
        boundary = buffer.search(/\r?\n\r?\n/)
      }
    }

    buffer += decoder.decode()
    if (buffer.trim()) {
      const event = parseSseBlock(buffer)
      if (event) onEvent(event)
    }
  } catch (error) {
    try {
      await reader.cancel()
    } catch {
      // Keep the protocol or connection error that caused cancellation.
    }
    throw error
  } finally {
    reader.releaseLock()
  }
}
