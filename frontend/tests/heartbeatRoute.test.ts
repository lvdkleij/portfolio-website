import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type HeartbeatHandler = (event: object) => Promise<void>

const originalBackendBaseUrl = process.env.BACKEND_BASE_URL

async function loadHandler(fetcher: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('defineEventHandler', (handler: HeartbeatHandler) => handler)
  vi.stubGlobal('$fetch', fetcher)
  vi.stubGlobal('setResponseHeaders', vi.fn())
  vi.stubGlobal('setResponseStatus', vi.fn())
  vi.stubGlobal('createError', (details: Record<string, unknown>) => Object.assign(new Error(String(details.statusMessage)), details))

  return (await import('../server/api/heartbeat.post')).default as unknown as HeartbeatHandler
}

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.setSystemTime(0)
  process.env.BACKEND_BASE_URL = 'http://backend.internal/'
})

afterEach(() => {
  if (originalBackendBaseUrl === undefined) delete process.env.BACKEND_BASE_URL
  else process.env.BACKEND_BASE_URL = originalBackendBaseUrl
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('heartbeat server route', () => {
  it('forwards to the private backend, disables caching and returns 204', async () => {
    const fetcher = vi.fn(async () => undefined)
    const handler = await loadHandler(fetcher)
    const event = {}

    await handler(event)

    expect(fetcher).toHaveBeenCalledWith('http://backend.internal/api/heartbeat', { method: 'POST' })
    expect(setResponseHeaders).toHaveBeenCalledWith(event, { 'Cache-Control': 'no-store, max-age=0' })
    expect(setResponseStatus).toHaveBeenCalledWith(event, 204)
  })

  it('coalesces concurrent and recently successful heartbeat requests', async () => {
    let resolveHeartbeat: (() => void) | undefined
    const fetcher = vi.fn(() => new Promise<void>(resolve => { resolveHeartbeat = resolve }))
    const handler = await loadHandler(fetcher)

    const first = handler({})
    const concurrent = handler({})
    expect(fetcher).toHaveBeenCalledTimes(1)

    resolveHeartbeat?.()
    await Promise.all([first, concurrent])
    await handler({})
    expect(fetcher).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(45_000)
    const next = handler({})
    expect(fetcher).toHaveBeenCalledTimes(2)
    resolveHeartbeat?.()
    await next
  })

  it('returns 503 when the backend URL is not configured', async () => {
    delete process.env.BACKEND_BASE_URL
    const handler = await loadHandler(vi.fn())

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 503,
      statusMessage: 'BACKEND_BASE_URL is not configured'
    })
  })

  it('normalizes backend failures to 503', async () => {
    const handler = await loadHandler(vi.fn(async () => {
      throw Object.assign(new Error('Bad gateway'), { statusCode: 502 })
    }))

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 503,
      statusMessage: 'Backend heartbeat failed'
    })
  })
})
