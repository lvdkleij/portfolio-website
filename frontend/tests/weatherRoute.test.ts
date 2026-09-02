import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type WeatherHandler = (event: object) => Promise<unknown>

async function loadHandler(fetcher: ReturnType<typeof vi.fn>, apiKey = 'test-weather-key') {
  vi.stubGlobal('defineEventHandler', (handler: WeatherHandler) => handler)
  vi.stubGlobal('$fetch', fetcher)
  vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ meteosourceApiKey: apiKey })))
  vi.stubGlobal('setResponseHeaders', vi.fn())
  vi.stubGlobal('createError', (details: Record<string, unknown>) => Object.assign(new Error(String(details.statusMessage)), details))

  return (await import('../server/api/weather.get')).default as unknown as WeatherHandler
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('current weather server route', () => {
  it('keeps the API key server-side and returns a small normalized response', async () => {
    const fetcher = vi.fn(async () => ({
      current: {
        icon: 'light_rain',
        icon_num: 10,
        summary: 'Light rain',
        temperature: 13.6
      }
    }))
    const handler = await loadHandler(fetcher)
    const event = {}

    await expect(handler(event)).resolves.toEqual({
      icon: 'light_rain',
      iconNum: 10,
      summary: 'Light rain',
      temperature: 13.6
    })

    expect(fetcher).toHaveBeenCalledWith('https://www.meteosource.com/api/v1/free/point', expect.objectContaining({
      query: expect.objectContaining({
        lat: 50.8503,
        lon: 4.3517,
        sections: 'current',
        units: 'metric'
      }),
      headers: expect.objectContaining({ 'X-API-Key': 'test-weather-key' })
    }))
    expect(setResponseHeaders).toHaveBeenCalledWith(event, {
      'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600'
    })
  })

  it('returns 503 without configuration and 502 for invalid provider data', async () => {
    const missingKey = await loadHandler(vi.fn(), '')
    await expect(missingKey({})).rejects.toMatchObject({ statusCode: 503 })

    vi.resetModules()
    const invalidResponse = await loadHandler(vi.fn(async () => ({ current: { summary: 'Rain' } })))
    await expect(invalidResponse({})).rejects.toMatchObject({ statusCode: 502 })
  })
})
