import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { useBackendHeartbeat } from '~/composables/useBackendHeartbeat'

let wrapper: VueWrapper | undefined
let visibilityState: DocumentVisibilityState

function mountHeartbeat(fetcher: typeof fetch) {
  wrapper = mount(defineComponent({
    setup() {
      useBackendHeartbeat({ fetcher })
      return () => h('div')
    }
  }))
}

function setVisibility(nextVisibility: DocumentVisibilityState) {
  visibilityState = nextVisibility
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
  visibilityState = 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilityState)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
})

describe('useBackendHeartbeat', () => {
  it('warms immediately and sends heartbeats every 60 seconds while active', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }))
    mountHeartbeat(fetcher)
    await vi.advanceTimersByTimeAsync(0)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenLastCalledWith('/api/heartbeat', expect.objectContaining({ method: 'POST' }))

    await vi.advanceTimersByTimeAsync(2 * 60_000)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('stops after ten minutes without activity and activity restarts it immediately', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }))
    mountHeartbeat(fetcher)
    await vi.advanceTimersByTimeAsync(10 * 60_000)

    expect(fetcher).toHaveBeenCalledTimes(10)
    await vi.advanceTimersByTimeAsync(5 * 60_000)
    expect(fetcher).toHaveBeenCalledTimes(10)

    document.dispatchEvent(new PointerEvent('pointerdown'))
    await vi.advanceTimersByTimeAsync(0)
    expect(fetcher).toHaveBeenCalledTimes(11)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetcher).toHaveBeenCalledTimes(12)
  })

  it('renews the inactivity window for keyboard, touch and captured scroll activity', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }))
    mountHeartbeat(fetcher)

    await vi.advanceTimersByTimeAsync(9 * 60_000)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    await vi.advanceTimersByTimeAsync(9 * 60_000)
    document.dispatchEvent(new TouchEvent('touchstart'))
    await vi.advanceTimersByTimeAsync(9 * 60_000)
    document.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(9 * 60_000)

    expect(fetcher).toHaveBeenCalledTimes(37)
  })

  it('pauses while hidden and resumes only when the visitor is still recently active', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }))
    mountHeartbeat(fetcher)
    await vi.advanceTimersByTimeAsync(0)

    setVisibility('hidden')
    await vi.advanceTimersByTimeAsync(2 * 60_000)
    expect(fetcher).toHaveBeenCalledTimes(1)

    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(fetcher).toHaveBeenCalledTimes(2)

    setVisibility('hidden')
    await vi.advanceTimersByTimeAsync(11 * 60_000)
    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(fetcher).toHaveBeenCalledTimes(2)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    await vi.advanceTimersByTimeAsync(0)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('prevents overlapping requests and aborts pending work during cleanup', async () => {
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    mountHeartbeat(fetcher)
    await vi.advanceTimersByTimeAsync(2 * 60_000)

    expect(fetcher).toHaveBeenCalledTimes(1)
    const signal = fetcher.mock.calls[0]?.[1]?.signal
    wrapper?.unmount()
    wrapper = undefined
    await vi.advanceTimersByTimeAsync(2 * 60_000)

    expect(signal?.aborted).toBe(true)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
