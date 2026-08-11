import { describe, expect, it } from 'vitest'
import { ChatStreamProtocolError, consumeSseStream, parseSseBlock } from '~/utils/sse'

function chunkedStream(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach(chunk => controller.enqueue(chunk))
      controller.close()
    }
  })
}

describe('SSE parsing', () => {
  it('ignores heartbeats and accepts multiline data', () => {
    expect(parseSseBlock(': heartbeat')).toBeNull()
    expect(parseSseBlock('event: delta\ndata: {"type":"delta",\ndata: "text":"hello"}')).toEqual({
      type: 'delta',
      text: 'hello'
    })
  })

  it('parses arbitrary chunks without corrupting multibyte Unicode', async () => {
    const source = [
      ': keep-alive\n\n',
      'event: status\ndata: {"type":"status","stage":{"id":"route","label":"Routing","state":"active"}}\n\n',
      'event: delta\ndata: {"type":"delta","text":"Hello 👋 café"}\n\n',
      'event: done\ndata: {"type":"done","durationMs":42}\n\n'
    ].join('')
    const bytes = new TextEncoder().encode(source)
    const chunks = Array.from(bytes, byte => Uint8Array.of(byte))
    const events: unknown[] = []

    await consumeSseStream(chunkedStream(chunks), event => events.push(event))

    expect(events).toHaveLength(3)
    expect(events[1]).toEqual({ type: 'delta', text: 'Hello 👋 café' })
    expect(events[2]).toEqual({ type: 'done', durationMs: 42 })
  })

  it('supports the conventional DONE sentinel', () => {
    expect(parseSseBlock('data: [DONE]')).toEqual({ type: 'done', finishReason: 'stop' })
  })

  it('rejects malformed JSON and unknown event types', () => {
    expect(() => parseSseBlock('event: delta\ndata: {bad')).toThrow(ChatStreamProtocolError)
    expect(() => parseSseBlock('data: {"type":"mystery"}')).toThrow('unsupported “mystery” event')
  })
})
