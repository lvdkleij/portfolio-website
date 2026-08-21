const HEARTBEAT_COALESCE_WINDOW_MS = 45_000

let lastSuccessfulHeartbeatAt: number | undefined
let heartbeatInFlight: Promise<void> | undefined

function backendHeartbeatUrl() {
  const backendBaseUrl = process.env.BACKEND_BASE_URL?.trim()

  if (!backendBaseUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: 'BACKEND_BASE_URL is not configured'
    })
  }

  return new URL('/api/heartbeat', `${backendBaseUrl.replace(/\/+$/, '')}/`).toString()
}

async function forwardHeartbeat(heartbeatUrl: string) {
  await $fetch<void>(heartbeatUrl, { method: 'POST' })
  lastSuccessfulHeartbeatAt = Date.now()
}

function coalescedHeartbeat(heartbeatUrl: string) {
  if (
    lastSuccessfulHeartbeatAt !== undefined
    && Date.now() - lastSuccessfulHeartbeatAt < HEARTBEAT_COALESCE_WINDOW_MS
  ) {
    return Promise.resolve()
  }

  if (!heartbeatInFlight) {
    heartbeatInFlight = forwardHeartbeat(heartbeatUrl).finally(() => {
      heartbeatInFlight = undefined
    })
  }

  return heartbeatInFlight
}

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-store, max-age=0'
  })

  const heartbeatUrl = backendHeartbeatUrl()

  try {
    await coalescedHeartbeat(heartbeatUrl)
  } catch (cause) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Backend heartbeat failed',
      cause
    })
  }

  setResponseStatus(event, 204)
})
