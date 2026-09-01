// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuietDeskLayout, type QuietDeskLayoutController } from '~/utils/quietDeskLayout'

type Metric = 'clientWidth' | 'clientHeight' | 'scrollHeight' | 'offsetWidth' | 'offsetHeight'

let now = 100
let nextFrame = 0
let width = 1440
let height = 900
const frames = new Map<number, FrameRequestCallback>()
const controllers: QuietDeskLayoutController[] = []
let originalWidth: PropertyDescriptor | undefined
let originalHeight: PropertyDescriptor | undefined
let originalViewport: PropertyDescriptor | undefined

function flushFrames() {
  for (let attempt = 0; frames.size && attempt < 10; attempt++) {
    const callbacks = [...frames.values()]
    frames.clear()
    for (const callback of callbacks) callback(now)
  }
  expect(frames.size, 'layout must settle without an animation-frame loop').toBe(0)
}

function metric(element: HTMLElement, name: Metric, value: () => number) {
  Object.defineProperty(element, name, { configurable: true, get: value })
}

function scrollbox(element: HTMLElement, clientHeight: number, scrollHeight: () => number) {
  let scrollTop = 0
  metric(element, 'clientHeight', () => clientHeight)
  metric(element, 'scrollHeight', scrollHeight)
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: value => { scrollTop = Math.max(0, Math.min(Math.max(0, scrollHeight() - clientHeight), value)) },
  })
}

function mockVisualViewport(initial: { width: number, height: number, offsetTop?: number, offsetLeft?: number }) {
  const state = { offsetTop: 0, offsetLeft: 0, ...initial }
  const target = new EventTarget()
  for (const key of ['width', 'height', 'offsetTop', 'offsetLeft'] as const) {
    Object.defineProperty(target, key, { configurable: true, get: () => state[key] })
  }
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: target })
  return {
    state,
    resize(next: Partial<typeof state>) {
      Object.assign(state, next)
      target.dispatchEvent(new Event('resize'))
      flushFrames()
    },
  }
}

function makeFixture(expectedMode: 'portrait' | 'docked' = 'portrait') {
  const root = document.createElement('div')
  root.innerHTML = `
    <div id="identity"></div><img id="photo">
    <div id="experience">
      <section id="conversation">
        <header class="conversation-header"></header>
        <div id="transcript" style="row-gap:12px">
          <div id="spacer"></div>
          ${[1, 2, 3].map(turn => `
            <article class="chat-message chat-message--user"><div class="chat-message-body">Question ${turn}</div></article>
            <article class="chat-message chat-message--assistant"><div class="chat-message-body">Reply ${turn}</div></article>
          `).join('')}
        </div>
        <button id="expand">Expand</button>
        <button id="latest" hidden>Latest reply</button>
        <button id="minimize">Minimize</button>
      </section>
      <form id="form"><input id="input"></form>
    </div>`
  document.body.append(root)
  const find = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!
  const elements = {
    root,
    identity: find('#identity'),
    photo: find<HTMLImageElement>('#photo'),
    experience: find('#experience'),
    conversation: find('#conversation'),
    transcript: find('#transcript'),
    spacer: find('#spacer'),
    expand: find<HTMLButtonElement>('#expand'),
    latest: find<HTMLButtonElement>('#latest'),
    minimize: find<HTMLButtonElement>('#minimize'),
    form: find('#form'),
    input: find<HTMLInputElement>('#input'),
  }
  // jsdom has no layout. These dimensions describe three exchanges in the
  // desktop portrait layout, with a native, clamped transcript scroll range.
  elements.photo.getBoundingClientRect = () => new DOMRect(9, 9, 1422, 882)
  elements.identity.getBoundingClientRect = () => new DOMRect(95, 121, 340, 50)
  elements.form.getBoundingClientRect = () => new DOMRect(440, 820, 560, 56)
  elements.conversation.getBoundingClientRect = () => new DOMRect(549, 263, 336, 400)
  elements.transcript.getBoundingClientRect = () => new DOMRect(549, 307, 336, 356)
  metric(elements.transcript, 'clientWidth', () => 336)
  metric(find('.conversation-header'), 'offsetHeight', () => 44)
  scrollbox(elements.transcript, 356, () => Math.max(356, Number.parseFloat(elements.spacer.style.height) || 0))

  const articles = [...root.querySelectorAll<HTMLElement>('.chat-message')]
  const replyBodies: HTMLElement[] = []
  const bodyHeights = new Map<HTMLElement, number>()
  const cardHeights = new Map<HTMLElement, number>()
  for (const article of articles) {
    const isUser = article.classList.contains('chat-message--user')
    const body = article.querySelector<HTMLElement>('.chat-message-body')!
    metric(article, 'offsetWidth', () => 300)
    cardHeights.set(article, isUser ? 40 : 240)
    metric(article, 'offsetHeight', () => cardHeights.get(article)!)
    bodyHeights.set(body, isUser ? 20 : 600)
    scrollbox(body, isUser ? 20 : 200, () => bodyHeights.get(body)!)
    if (!isUser) replyBodies.push(body)
  }
  const controller = createQuietDeskLayout(elements)
  controllers.push(controller)
  flushFrames()
  const scrollables = [elements.transcript, ...bodyHeights.keys()]

  function scrollTo(element: HTMLElement, top: number) {
    element.scrollTop = top
    element.dispatchEvent(new Event('scroll'))
    flushFrames()
  }

  function wheel(target: HTMLElement, deltaY: number, options: WheelEventInit = {}, deliverScrollEvents = true) {
    now += 16
    const before = scrollables.map(element => element.scrollTop)
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY, ...options })
    Object.defineProperty(event, 'timeStamp', { value: now })
    target.dispatchEvent(event)
    // Native programmatic scrolling queues scroll events. jsdom does not, so
    // deliver them explicitly only for scrollboxes that actually moved.
    if (deliverScrollEvents) {
      scrollables.forEach((element, index) => {
        if (element.scrollTop !== before[index]) element.dispatchEvent(new Event('scroll'))
      })
    }
    flushFrames()
    return event
  }

  // Acknowledge the initial follow-to-bottom write before simulating a reader.
  for (const element of scrollables) {
    if (element.scrollTop > 0) element.dispatchEvent(new Event('scroll'))
  }
  flushFrames()
  expect(elements.experience.dataset.chatMode).toBe(expectedMode)
  return { ...elements, controller, replyBodies, bodyHeights, cardHeights, scrollTo, wheel }
}

beforeEach(() => {
  now = 100
  nextFrame = 0
  width = 1440
  height = 900
  frames.clear()
  originalWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth')
  originalHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight')
  originalViewport = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => height })
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback)
    return nextFrame
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id) })
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.dispose()
  frames.clear()
  document.body.replaceChildren()
  if (originalWidth) Object.defineProperty(window, 'innerWidth', originalWidth)
  if (originalHeight) Object.defineProperty(window, 'innerHeight', originalHeight)
  if (originalViewport) Object.defineProperty(window, 'visualViewport', originalViewport)
  else delete (window as Window & { visualViewport?: VisualViewport }).visualViewport
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('desktop conversation scroll routing', () => {
  it('completes a reopened follow only after the latest bubbles are repainted', () => {
    const fixture = makeFixture()
    const newestReply = fixture.replyBodies[2]!.parentElement!
    newestReply.style.setProperty('--whole-bubble-y', '12px')
    fixture.conversation.hidden = true
    fixture.controller.collapse()
    flushFrames()
    fixture.conversation.hidden = false
    let positionAtCompletion: string | undefined

    fixture.controller.followLatest(() => {
      positionAtCompletion = newestReply.style.getPropertyValue('--whole-bubble-y')
    })

    expect(positionAtCompletion).toBeUndefined()
    flushFrames()
    expect(Number.parseFloat(positionAtCompletion!)).toBeCloseTo(355, 0)
  })

  it('anchors the newest reply beside the face after several exchanges', () => {
    const fixture = makeFixture()
    const newestReply = fixture.replyBodies[2]!.parentElement!

    expect(Number.parseFloat(newestReply.style.getPropertyValue('--whole-bubble-y'))).toBeCloseTo(355, 0)
  })

  it('scrolls inside a long reply without moving the conversation or the reply card', () => {
    const fixture = makeFixture()
    const body = fixture.replyBodies[2]!
    const card = body.parentElement!
    fixture.scrollTo(body, 250)
    const outerTop = fixture.transcript.scrollTop
    const cardTop = card.style.getPropertyValue('--whole-bubble-y')

    const event = fixture.wheel(body, -80)

    expect(event.defaultPrevented).toBe(true)
    expect(body.scrollTop).toBe(170)
    expect(fixture.transcript.scrollTop).toBe(outerTop)
    expect(card.style.getPropertyValue('--whole-bubble-y')).toBe(cardTop)
    expect(fixture.latest.hidden).toBe(false)
  })

  it.each([
    { direction: 'up', innerTop: 30, delta: -80, innerResult: 0, outerResult: 250 },
    { direction: 'down', innerTop: 370, delta: 80, innerResult: 400, outerResult: 350 },
  ])('passes only the remaining $direction delta to the conversation at a reply boundary', ({ innerTop, delta, innerResult, outerResult }) => {
    const fixture = makeFixture()
    const body = fixture.replyBodies[1]!
    fixture.scrollTo(fixture.transcript, 300)
    fixture.scrollTo(body, innerTop)

    const event = fixture.wheel(body, delta)

    expect(event.defaultPrevented).toBe(true)
    expect(body.scrollTop).toBe(innerResult)
    expect(fixture.transcript.scrollTop).toBe(outerResult)
  })

  it('keeps the same wheel gesture in the conversation when another reply moves under the pointer', () => {
    const fixture = makeFixture()
    const firstBody = fixture.replyBodies[0]!
    const middleBody = fixture.replyBodies[1]!
    fixture.scrollTo(fixture.transcript, 300)
    fixture.scrollTo(firstBody, 200)
    fixture.scrollTo(middleBody, 30)
    fixture.wheel(middleBody, -80)

    fixture.wheel(firstBody, -40)

    expect(firstBody.scrollTop).toBe(200)
    expect(fixture.transcript.scrollTop).toBe(210)
  })

  it('lets a new gesture scroll within a reply again after a handoff', () => {
    const fixture = makeFixture()
    const firstBody = fixture.replyBodies[0]!
    const middleBody = fixture.replyBodies[1]!
    fixture.scrollTo(fixture.transcript, 300)
    fixture.scrollTo(firstBody, 200)
    fixture.scrollTo(middleBody, 30)
    fixture.wheel(middleBody, -80)
    now += 1000

    fixture.wheel(firstBody, -40)

    expect(firstBody.scrollTop).toBe(160)
    expect(fixture.transcript.scrollTop).toBe(250)
  })

  it('lets reversing direction return to the reply immediately after a handoff', () => {
    const fixture = makeFixture()
    const body = fixture.replyBodies[1]!
    fixture.scrollTo(fixture.transcript, 300)
    fixture.scrollTo(body, 30)
    fixture.wheel(body, -80)

    fixture.wheel(body, 60)

    expect(body.scrollTop).toBe(60)
    expect(fixture.transcript.scrollTop).toBe(250)
  })

  it.each([
    { description: 'Ctrl+wheel zoom', deltaY: 80, options: { ctrlKey: true } },
    { description: 'horizontal wheel', deltaY: 0, options: { deltaX: 80 } },
    { description: 'predominantly horizontal wheel', deltaY: 20, options: { deltaX: 80 } },
  ])('leaves $description to the browser', ({ deltaY, options }) => {
    const fixture = makeFixture()
    expect(fixture.wheel(fixture.replyBodies[2]!, deltaY, options).defaultPrevented).toBe(false)
  })

  it('leaves wheel scrolling native in the tablet/mobile conversation', () => {
    const fixture = makeFixture()
    width = 900
    fixture.controller.schedule()
    flushFrames()

    expect(fixture.experience.dataset.chatMode).toBe('docked')
    expect(fixture.wheel(fixture.replyBodies[2]!, -80).defaultPrevented).toBe(false)
  })

  it('focuses the compact composer without asking the browser to pan the page', () => {
    const fixture = makeFixture()
    width = 390
    fixture.controller.schedule()
    flushFrames()
    const focus = vi.spyOn(fixture.input, 'focus')

    fixture.input.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))

    expect(fixture.experience.dataset.chatMode).toBe('docked')
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('keeps compact mode stable while the on-screen keyboard reduces the visual viewport', () => {
    width = 390
    height = 844
    const visualViewport = mockVisualViewport({ width: 390, height: 844 })
    const fixture = makeFixture('docked')

    fixture.input.focus({ preventScroll: true })
    flushFrames()
    visualViewport.resize({ height: 390 })

    expect(fixture.experience.classList.contains('is-keyboard-open')).toBe(true)
    expect(fixture.experience.classList.contains('is-reading')).toBe(false)
    expect(fixture.root.classList.contains('is-chat-reading')).toBe(false)
    expect(fixture.identity.inert).toBe(false)
  })

  it('does not collapse an existing short-screen reading view while the keyboard opens', () => {
    width = 390
    height = 430
    const visualViewport = mockVisualViewport({ width: 390, height: 430 })
    const fixture = makeFixture('docked')
    expect(fixture.experience.classList.contains('is-reading')).toBe(true)

    fixture.input.focus({ preventScroll: true })
    flushFrames()
    visualViewport.resize({ height: 300 })

    expect(fixture.experience.classList.contains('is-keyboard-open')).toBe(true)
    expect(fixture.experience.classList.contains('is-reading')).toBe(true)
    expect(fixture.root.classList.contains('is-chat-reading')).toBe(true)
    expect(fixture.identity.inert).toBe(true)
  })

  it('still provides reading room on a genuinely short compact viewport', () => {
    width = 390
    height = 430
    mockVisualViewport({ width: 390, height: 430 })
    const fixture = makeFixture('docked')

    expect(fixture.experience.classList.contains('is-keyboard-open')).toBe(false)
    expect(fixture.experience.classList.contains('is-reading')).toBe(true)
    expect(fixture.root.classList.contains('is-chat-reading')).toBe(true)
    expect(fixture.identity.inert).toBe(true)
    expect(fixture.expand.hidden).toBe(true)
  })

  it('does not reposition history when a partially visible reply receives pointer focus', () => {
    const fixture = makeFixture()
    const body = fixture.replyBodies[0]!
    fixture.scrollTo(fixture.transcript, 180)
    fixture.scrollTo(body, 120)

    body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
    flushFrames()
    fixture.controller.schedule()
    flushFrames()

    expect(fixture.transcript.scrollTop).toBe(180)
    expect(body.scrollTop).toBe(120)
  })

  it('reveals a keyboard-focused reply without losing its internal reading position', () => {
    const fixture = makeFixture()
    const body = fixture.replyBodies[0]!
    fixture.scrollTo(fixture.transcript, 180)
    fixture.scrollTo(body, 120)

    body.focus({ preventScroll: true })
    flushFrames()

    // The first reply spans logical positions 52..292 in this fixture.
    expect(fixture.transcript.scrollTop).toBeLessThanOrEqual(52)
    expect(fixture.transcript.scrollTop + fixture.transcript.clientHeight).toBeGreaterThanOrEqual(292)
    expect(body.scrollTop).toBe(120)
  })

  it('preserves both paused reading positions as a reply grows, and Latest restores both bottoms', () => {
    const fixture = makeFixture()
    const body = fixture.replyBodies[2]!
    fixture.scrollTo(body, 150)
    fixture.scrollTo(fixture.transcript, 200)
    fixture.bodyHeights.set(body, 900)

    fixture.controller.schedule()
    flushFrames()

    expect(body.scrollTop).toBe(150)
    expect(fixture.transcript.scrollTop).toBe(200)
    expect(fixture.latest.hidden).toBe(false)
    fixture.latest.click()
    flushFrames()
    expect(body.scrollTop).toBe(700)
    expect(fixture.transcript.scrollTop).toBe(fixture.transcript.scrollHeight - fixture.transcript.clientHeight)
    expect(fixture.latest.hidden).toBe(true)
    expect(document.activeElement).toBe(fixture.minimize)
  })

  it.each(['wheel', 'scrollbar'])('keeps an older reply stationary while the latest card grows after %s reading', (input) => {
    const fixture = makeFixture()
    const olderBody = fixture.replyBodies[1]!
    const newestBody = fixture.replyBodies[2]!
    const outerTop = fixture.transcript.scrollTop

    if (input === 'wheel') {
      // A streamed layout can arrive before the queued native scroll event.
      fixture.wheel(olderBody, 80, {}, false)
    } else {
      fixture.scrollTo(olderBody, 80)
    }
    const olderCardTop = olderBody.parentElement!.style.getPropertyValue('--whole-bubble-y')
    fixture.cardHeights.set(newestBody.parentElement!, 300)
    fixture.controller.schedule()
    flushFrames()

    expect(olderBody.scrollTop).toBe(80)
    expect(fixture.transcript.scrollTop).toBe(outerTop)
    expect(olderBody.parentElement!.style.getPropertyValue('--whole-bubble-y')).toBe(olderCardTop)
    expect(fixture.latest.hidden).toBe(false)
    fixture.latest.click()
    flushFrames()
    expect(fixture.transcript.scrollTop).toBe(fixture.transcript.scrollHeight - fixture.transcript.clientHeight)
    expect(fixture.latest.hidden).toBe(true)
  })
})
