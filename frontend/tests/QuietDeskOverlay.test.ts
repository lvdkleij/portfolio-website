import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import QuietDeskOverlay from '~/components/QuietDeskOverlay.vue'

enableAutoUnmount(afterEach)

const encoder = new TextEncoder()
let streamController: ReadableStreamDefaultController<Uint8Array>
let requestSignal: AbortSignal | undefined
const fetchSpy = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
  requestSignal = init?.signal ?? undefined
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller
      requestSignal?.addEventListener('abort', () => {
        controller.error(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
    }
  }), { headers: { 'content-type': 'text/event-stream' } })
})

async function emitDelta(text: string) {
  streamController.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ type: 'delta', text })}\n\n`))
  await vi.advanceTimersByTimeAsync(0)
  await nextTick()
}

async function finishReply(text = 'A streamed answer about Lucas.') {
  if (text) await emitDelta(text)
  streamController.enqueue(encoder.encode('event: done\ndata: {"type":"done"}\n\n'))
  streamController.close()
  await vi.advanceTimersByTimeAsync(0)
  await nextTick()
}

beforeEach(() => {
  vi.useFakeTimers()
  fetchSpy.mockClear()
  requestSignal = undefined
  vi.stubGlobal('fetch', fetchSpy)
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('quiet desk menu and chat', () => {
  it('starts with the approved minimal menu and no transcript or floating launcher', () => {
    const wrapper = mount(QuietDeskOverlay)
    expect(wrapper.get('h1').text()).toBe('Lucas van der Kleij')
    expect(wrapper.findAll('nav button').map(button => button.text())).toEqual(['About', 'Contact'])
    expect(wrapper.get('.quiet-chat-trigger').text()).toBe('AI Chat')
    expect(wrapper.get('#quiet-resting-input').attributes('placeholder')).toBe('Ask me something…')
    expect(wrapper.find('[role="dialog"], [role="log"], .portfolio-assistant').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/scripted prototype|available|AI engineer|Asterra/i)
  })

  it.each([
    [0, 'About', '4+ years of experience building software solutions in the financial services sector.'],
    [1, 'Contact', 'Find Lucas on LinkedIn and GitHub']
  ] as const)('opens menu item %s with accurate content and returns focus', async (index, title, text) => {
    const wrapper = mount(QuietDeskOverlay, { attachTo: document.body })
    const trigger = wrapper.findAll('nav button')[index]!
    await trigger.trigger('click')
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.get('h2').text()).toBe(title)
    expect(dialog.text()).toContain(text)
    expect(wrapper.get('.quiet-stack').isVisible()).toBe(false)
    expect(document.activeElement).toBe(dialog.get('button').element)
    await dialog.get('button').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('offers the real contact links without requiring chat', async () => {
    const wrapper = mount(QuietDeskOverlay)
    await wrapper.findAll('nav button')[1]!.trigger('click')
    expect(wrapper.findAll('a').map(link => link.attributes('href'))).toEqual([
      'https://www.linkedin.com/in/lucas-van-der-kleij', 'https://github.com/lvdkleij'
    ])
    expect(wrapper.find('[role="log"]').exists()).toBe(false)
  })

  it('opens a welcome, traps keyboard focus and closes with Escape', async () => {
    const wrapper = mount(QuietDeskOverlay, { attachTo: document.body })
    const trigger = wrapper.get('.quiet-chat-trigger')
    await trigger.trigger('click')
    expect(wrapper.get('[role="log"]').text()).toContain('Hello — ask me about Lucas')
    expect(document.activeElement).toBe(wrapper.get('#quiet-chat-input').element)
    const first = wrapper.get<HTMLButtonElement>('[aria-label="Close AI chat"]')
    const last = wrapper.get<HTMLButtonElement>('[role="dialog"] [aria-label="Send message"]')
    first.element.focus()
    await first.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last.element)
    await last.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(first.element)
    await first.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('posts to Lucas AI and displays streamed chunks before the response finishes', async () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    const wrapper = mount(QuietDeskOverlay)
    await wrapper.get('#quiet-resting-input').setValue('  Tell me about Lucas  ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Tell me about Lucas')
    expect(wrapper.get('[role="status"]').text()).toContain('Thinking…')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [endpoint, init] = fetchSpy.mock.calls[0]!
    expect(endpoint).toBe('/api/v1/lucasai/stream')
    expect(init).toMatchObject({
      method: 'POST',
      headers: { Accept: 'text/event-stream', 'Content-Type': 'application/json' }
    })
    expect(JSON.parse(String(init?.body))).toEqual({
      clientRequestId: expect.any(String),
      messages: [{ id: expect.any(String), role: 'user', content: 'Tell me about Lucas' }]
    })

    await emitDelta('Hello 👋')
    expect(wrapper.get('[role="log"]').text()).toContain('Hello 👋')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.get('[role="dialog"] [type="submit"]').attributes('disabled')).toBeDefined()
    await emitDelta(' — I work with café systems.')
    expect(wrapper.get('.quiet-message--assistant p').text()).toBe('Hello 👋 — I work with café systems.')
    await finishReply('')
    expect(wrapper.get('[role="dialog"] [type="submit"]').attributes('disabled')).toBeUndefined()
    expect(storageSpy).not.toHaveBeenCalled()
  })

  it('keeps multi-turn messages when closed and reopened, and resets on a fresh mount', async () => {
    const wrapper = mount(QuietDeskOverlay)
    await wrapper.get('.quiet-chat-trigger').trigger('click')
    for (const question of ['Hello', 'What are your skills?']) {
      await wrapper.get('#quiet-chat-input').setValue(question)
      await wrapper.get('[role="dialog"] form').trigger('submit')
      await finishReply()
    }
    await wrapper.get('[aria-label="Close AI chat"]').trigger('click')
    await wrapper.get('.quiet-chat-trigger').trigger('click')
    expect(wrapper.findAll('.quiet-message--user')).toHaveLength(2)
    expect(wrapper.findAll('.quiet-message--assistant')).toHaveLength(3)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(JSON.parse(String(fetchSpy.mock.calls[1]?.[1]?.body)).messages).toEqual([
      { id: expect.any(String), role: 'user', content: 'What are your skills?' }
    ])
    const fresh = mount(QuietDeskOverlay)
    await fresh.get('.quiet-chat-trigger').trigger('click')
    expect(fresh.findAll('.quiet-message--user')).toHaveLength(0)
    expect(fresh.findAll('.quiet-message--assistant')).toHaveLength(1)
  })

  it('ignores blank and duplicate pending submits and safely renders user text', async () => {
    const wrapper = mount(QuietDeskOverlay)
    await wrapper.get('#quiet-resting-input').setValue('   ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await wrapper.get('#quiet-resting-input').setValue('<img src=x onerror=alert(1)>')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('#quiet-chat-input').setValue('Repeated while thinking')
    await wrapper.get('[role="dialog"] form').trigger('submit')
    expect(wrapper.findAll('.quiet-message--user')).toHaveLength(1)
    expect(wrapper.get('[role="log"]').text()).toContain('<img src=x onerror=alert(1)>')
    expect(wrapper.find('[role="log"] img').exists()).toBe(false)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    await finishReply('<img src=x onerror=alert(1)>')
    expect(wrapper.findAll('.quiet-message--assistant')).toHaveLength(1)
    expect(wrapper.get('.quiet-message--assistant').text()).toContain('<img src=x onerror=alert(1)>')
    expect(wrapper.find('[role="log"] img').exists()).toBe(false)
  })

  it('does not steal focus when a response arrives after closing chat', async () => {
    const wrapper = mount(QuietDeskOverlay, { attachTo: document.body })
    await wrapper.get('.quiet-chat-trigger').trigger('click')
    await wrapper.get('#quiet-chat-input').setValue('Hello')
    await wrapper.get('[role="dialog"] form').trigger('submit')
    expect(document.activeElement).toBe(wrapper.get('#quiet-chat-input').element)
    await wrapper.get('[aria-label="Close AI chat"]').trigger('click')
    await finishReply()
    expect(document.activeElement).toBe(wrapper.get('.quiet-chat-trigger').element)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('returns to AI Chat if a resize hides the original resting composer', async () => {
    const wrapper = mount(QuietDeskOverlay, { attachTo: document.body })
    await wrapper.get('#quiet-resting-input').setValue('Hello')
    await wrapper.get('form').trigger('submit')
    wrapper.get<HTMLElement>('.quiet-composer--resting').element.style.display = 'none'
    await wrapper.get('[aria-label="Close AI chat"]').trigger('click')
    expect(document.activeElement).toBe(wrapper.get('.quiet-chat-trigger').element)
  })

  it('cleans up pending responses on unmount', async () => {
    const wrapper = mount(QuietDeskOverlay)
    await wrapper.get('#quiet-resting-input').setValue('Hello')
    await wrapper.get('form').trigger('submit')
    expect(requestSignal?.aborted).toBe(false)
    wrapper.unmount()
    expect(requestSignal?.aborted).toBe(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shows backend failures and allows a new request', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('', { status: 503 }))
    const wrapper = mount(QuietDeskOverlay)
    await wrapper.get('#quiet-resting-input').setValue('Hello')
    await wrapper.get('form').trigger('submit')
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.get('[role="alert"]').text()).toContain('temporarily unavailable')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.get('[role="dialog"] [type="submit"]').attributes('disabled')).toBeUndefined()

    await wrapper.get('#quiet-chat-input').setValue('Try again')
    await wrapper.get('[role="dialog"] form').trigger('submit')
    await finishReply('The backend is available again.')
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[role="log"]').text()).toContain('The backend is available again.')
  })

  it('keeps partial output and reports an interrupted stream', async () => {
    const wrapper = mount(QuietDeskOverlay)
    await wrapper.get('#quiet-resting-input').setValue('Hello')
    await wrapper.get('form').trigger('submit')
    await emitDelta('Partial answer')
    streamController.error(new Error('Connection lost'))
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.get('[role="log"]').text()).toContain('Partial answer')
    expect(wrapper.get('[role="alert"]').text()).toContain('connection to the assistant was interrupted')
    expect(wrapper.get('[role="dialog"] [type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('tracks the visible viewport for a phone keyboard and removes its listeners', async () => {
    const viewport = Object.assign(new EventTarget(), { height: 844, offsetTop: 0 })
    vi.stubGlobal('visualViewport', viewport)
    const removeListener = vi.spyOn(viewport, 'removeEventListener')
    const wrapper = mount(QuietDeskOverlay)
    await nextTick()
    expect(wrapper.attributes('style')).toContain('--quiet-viewport-height: 844px')
    viewport.height = 400
    viewport.offsetTop = 25
    viewport.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.attributes('style')).toContain('--quiet-viewport-height: 400px')
    expect(wrapper.attributes('style')).toContain('--quiet-viewport-top: 25px')
    wrapper.unmount()
    expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
