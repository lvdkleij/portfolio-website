type MeteosourceResponse = {
  current?: {
    icon?: string
    icon_num?: number
    summary?: string
    weather?: string
    temperature?: number
  }
}

type CurrentWeather = {
  icon: string
  iconNum: number
  summary: string
  temperature: number
}

const CACHE_DURATION_MS = 15 * 60 * 1000

let cachedWeather: CurrentWeather | undefined
let cacheExpiresAt = 0
let pendingWeather: Promise<CurrentWeather> | undefined

async function fetchCurrentWeather(apiKey: string): Promise<CurrentWeather> {
  const response = await $fetch<MeteosourceResponse>('https://www.meteosource.com/api/v1/free/point', {
    query: {
      lat: 50.8503,
      lon: 4.3517,
      sections: 'current',
      timezone: 'Europe/Brussels',
      language: 'en',
      units: 'metric'
    },
    headers: {
      Accept: 'application/json',
      'X-API-Key': apiKey
    },
    retry: 1,
    timeout: 5_000
  })

  const current = response.current
  const iconNum = Number(current?.icon_num)
  const temperature = Number(current?.temperature)
  const summary = current?.summary?.trim()
    || current?.weather?.trim()
    || current?.icon?.replaceAll('_', ' ').trim()

  if (!current || !Number.isInteger(iconNum) || !Number.isFinite(temperature) || !summary) {
    throw new Error('Meteosource returned an incomplete current-weather response')
  }

  return {
    icon: current.icon?.trim() || 'not_available',
    iconNum,
    summary,
    temperature
  }
}

export default defineEventHandler(async (event): Promise<CurrentWeather> => {
  setResponseHeaders(event, {
    'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600'
  })

  const now = Date.now()
  if (cachedWeather && now < cacheExpiresAt) return cachedWeather

  const apiKey = String(useRuntimeConfig(event).meteosourceApiKey || '').trim()
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Weather is not configured'
    })
  }

  if (!pendingWeather) {
    pendingWeather = fetchCurrentWeather(apiKey)
      .then((weather) => {
        cachedWeather = weather
        cacheExpiresAt = Date.now() + CACHE_DURATION_MS
        return weather
      })
      .finally(() => {
        pendingWeather = undefined
      })
  }

  try {
    return await pendingWeather
  } catch {
    if (cachedWeather) return cachedWeather

    throw createError({
      statusCode: 502,
      statusMessage: 'Current weather is unavailable'
    })
  }
})
