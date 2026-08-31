export interface QuietDeskLayoutElements {
  root: HTMLElement
  identity: HTMLElement
  experience: HTMLElement
  conversation: HTMLElement
  transcript: HTMLElement
  spacer: HTMLElement
  form: HTMLElement
  expand: HTMLButtonElement
  latest: HTMLButtonElement
  minimize: HTMLButtonElement
  photo: HTMLImageElement
}

export interface QuietDeskLayoutController {
  schedule: () => void
  followLatest: () => void
  toggleExpanded: () => void
  collapse: () => void
  dispose: () => void
}

interface BubblePair {
  start: number
  end: number
  center: number
}

interface BubbleLayout {
  message: HTMLElement
  offset: number
  width: number
  height: number
  isUser: boolean
  pair?: BubblePair
}

interface BubbleBodyScroll {
  body: HTMLElement
  following: boolean
  pendingScrollTop?: number
  onScroll: () => void
}

/** Geometry for the approved desk design. Call after mounting the elements. */
export function createQuietDeskLayout(elements: QuietDeskLayoutElements): QuietDeskLayoutController {
  const {
    root, identity, experience, conversation, transcript, spacer, form,
    expand, latest, minimize, photo,
  } = elements
  let expanded = false
  let followingLatest = true
  let readingScrollTop = 0
  let pendingLayout = 0
  let pendingFocusPaint = 0
  let revealLatestBody = false
  let disposed = false
  let desktopBubbleLayout: BubbleLayout[] = []
  let desktopBubblePairs: BubblePair[] = []
  let desktopBubblePadding = { top: 0, right: 0, bottom: 0, left: 0 }
  const observedDesktopBubbles = new Set<HTMLElement>()
  const bodyScrollStates = new Map<HTMLElement, BubbleBodyScroll>()
  let newestAssistantBody: BubbleBodyScroll | undefined
  const viewport = window.visualViewport
  const desktopBubbleObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => {
        if (experience.dataset.chatMode === 'portrait' && isConversationVisible()) schedule()
      })
    : null
  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null

  function number(value: string): number {
    return Number.parseFloat(value) || 0
  }

  function setProperty(element: HTMLElement, name: string, value: string): void {
    if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value)
  }

  function setVariable(name: string, value: number): void {
    setProperty(experience, name, `${Math.round(value)}px`)
  }

  function isConversationVisible(): boolean {
    return !conversation.hidden && !experience.hidden
  }

  function clearScrollableBody(body: HTMLElement | null): void {
    if (!body?.hasAttribute('data-desktop-scrollable')) return
    body.removeAttribute('data-desktop-scrollable')
    body.removeAttribute('tabindex')
    body.removeAttribute('role')
    body.removeAttribute('aria-label')
  }

  function getMessages(): HTMLElement[] {
    return Array.from(transcript.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element.classList.contains('chat-message'),
    )
  }

  function bodyIsAtBottom(body: HTMLElement): boolean {
    return body.scrollHeight - body.clientHeight - body.scrollTop <= 1
  }

  function syncBodyScrollTracking(messages: HTMLElement[]): void {
    const currentBodies = new Set<HTMLElement>()
    newestAssistantBody = undefined
    for (const message of messages) {
      const body = message.querySelector<HTMLElement>('.chat-message-body')
      if (!body) continue
      currentBodies.add(body)
      let state = bodyScrollStates.get(body)
      if (!state) {
        const nextState: BubbleBodyScroll = {
          body,
          following: true,
          onScroll: () => {
            if (disposed || !isConversationVisible() || experience.dataset.chatMode !== 'portrait') return
            // A stream update can arrive before the scroll event from our last
            // write. It must not be mistaken for the reader scrolling upward.
            const programmed = nextState.pendingScrollTop !== undefined
              && Math.abs(body.scrollTop - nextState.pendingScrollTop) <= 1
            nextState.pendingScrollTop = undefined
            if (!programmed) nextState.following = bodyIsAtBottom(body)
            const latestWasHidden = latest.hidden
            updateScrollControls()
            if (latestWasHidden !== latest.hidden) schedule()
          },
        }
        state = nextState
        bodyScrollStates.set(body, state)
        body.addEventListener('scroll', state.onScroll, { passive: true })
      }
      if (message.classList.contains('chat-message--assistant')) newestAssistantBody = state
    }
    for (const [body, state] of bodyScrollStates) {
      if (currentBodies.has(body)) continue
      body.removeEventListener('scroll', state.onScroll)
      bodyScrollStates.delete(body)
    }
  }

  function followDesktopReplyBody(): void {
    const state = newestAssistantBody
    if (state && revealLatestBody) state.following = true
    revealLatestBody = false
    if (!state || experience.dataset.chatMode !== 'portrait' || !followingLatest || !state.following) return
    const scrollTop = Math.max(0, state.body.scrollHeight - state.body.clientHeight)
    if (Math.abs(state.body.scrollTop - scrollTop) <= 1) return
    state.body.scrollTop = scrollTop
    state.pendingScrollTop = state.body.scrollTop
  }

  function measureDesktopBubbles(): void {
    const messages = getMessages()
    syncBodyScrollTracking(messages)
    const currentMessages = new Set(messages)
    for (const message of observedDesktopBubbles) {
      if (!currentMessages.has(message)) {
        desktopBubbleObserver?.unobserve(message)
        observedDesktopBubbles.delete(message)
      }
    }

    if (experience.dataset.chatMode !== 'portrait') {
      spacer.hidden = true
      desktopBubbleLayout = []
      desktopBubblePairs = []
      for (const message of messages) {
        message.removeAttribute('data-whole-bubble-hidden')
        clearScrollableBody(message.querySelector<HTMLElement>('.chat-message-body'))
      }
      return
    }
    if (!isConversationVisible()) return

    spacer.hidden = false
    const transcriptStyle = getComputedStyle(transcript)
    desktopBubblePadding = {
      top: number(transcriptStyle.paddingTop),
      right: number(transcriptStyle.paddingRight),
      bottom: number(transcriptStyle.paddingBottom),
      left: number(transcriptStyle.paddingLeft),
    }
    const gap = number(transcriptStyle.rowGap)
    const pairGap = number(transcriptStyle.getPropertyValue('--conversation-turn-gap')) || 32
    const contentWidth = Math.max(1, transcript.clientWidth - desktopBubblePadding.left - desktopBubblePadding.right)
    const conversationStyle = getComputedStyle(conversation)
    const configuredHeight = number(conversationStyle.getPropertyValue('--conversation-height'))
      || number(conversationStyle.maxHeight)
      || 420
    const headerHeight = conversation.querySelector<HTMLElement>('.conversation-header')?.offsetHeight || 44
    const latestStyle = getComputedStyle(latest)
    // Reserve this control even when hidden; showing it must not resize long cards.
    const latestAllowance = Math.max(44, latest.offsetHeight, number(latestStyle.minHeight))
      + number(latestStyle.marginTop) + number(latestStyle.marginBottom)
    const conversationBorder = number(conversationStyle.borderTopWidth) + number(conversationStyle.borderBottomWidth)
    const cardLimit = Math.max(1, configuredHeight - headerHeight - latestAllowance
      - conversationBorder - desktopBubblePadding.top - desktopBubblePadding.bottom)

    let logicalOffset = desktopBubblePadding.top
    desktopBubbleLayout = messages.map((message, index): BubbleLayout => {
      const isUser = message.classList.contains('chat-message--user')
      setProperty(message, '--whole-bubble-max-width', `${contentWidth * (isUser ? 0.88 : 1)}px`)
      const messageStyle = getComputedStyle(message)
      const verticalFrame = number(messageStyle.paddingTop) + number(messageStyle.paddingBottom)
        + number(messageStyle.borderTopWidth) + number(messageStyle.borderBottomWidth)
      const body = message.querySelector<HTMLElement>('.chat-message-body')
      if (body) {
        setProperty(body, '--whole-bubble-body-height', `${Math.max(24, cardLimit - verticalFrame)}px`)
        if (body.scrollHeight > body.clientHeight + 1) {
          body.setAttribute('data-desktop-scrollable', '')
          body.setAttribute('tabindex', '0')
          body.setAttribute('role', 'region')
          body.setAttribute('aria-label', isUser ? 'Scrollable message' : 'Scrollable reply')
        } else {
          clearScrollableBody(body)
        }
      }
      const entry: BubbleLayout = {
        message, offset: logicalOffset, width: message.offsetWidth, height: message.offsetHeight, isUser,
      }
      const nextMessage = messages[index + 1]
      const followingGap = nextMessage?.classList.contains('chat-message--user') ? pairGap : gap
      logicalOffset += entry.height + (nextMessage ? followingGap : 0)
      if (desktopBubbleObserver && !observedDesktopBubbles.has(message)) {
        observedDesktopBubbles.add(message)
        desktopBubbleObserver.observe(message)
      }
      return entry
    })

    desktopBubblePairs = []
    let currentPair: BubblePair | undefined
    for (const entry of desktopBubbleLayout) {
      if (entry.isUser || !currentPair) {
        currentPair = { start: entry.offset, end: entry.offset + entry.height, center: 0 }
        desktopBubblePairs.push(currentPair)
      }
      currentPair.end = entry.offset + entry.height
      currentPair.center = (currentPair.start + currentPair.end) / 2
      entry.pair = currentPair
    }
    setProperty(spacer, 'height', `${Math.max(0, logicalOffset - desktopBubblePadding.top)}px`)
  }

  function paintDesktopBubbles(): void {
    if (disposed || experience.dataset.chatMode !== 'portrait' || !isConversationVisible()) return
    const rect = transcript.getBoundingClientRect()
    const top = rect.top + transcript.clientTop
    const bottom = top + transcript.clientHeight
    const left = rect.left + transcript.clientLeft + desktopBubblePadding.left
    const contentWidth = Math.max(1, transcript.clientWidth - desktopBubblePadding.left - desktopBubblePadding.right)
    const activeElement = document.activeElement
    const newestPair = desktopBubblePairs[desktopBubblePairs.length - 1]
    const focusCenter = followingLatest && newestPair
      ? newestPair.center
      : transcript.scrollTop + transcript.clientHeight / 2
    const clearRadius = transcript.clientHeight * 0.12
    const fadeDistance = Math.max(120, transcript.clientHeight * 0.6)
    for (const entry of desktopBubbleLayout) {
      if (!entry.pair) continue
      const y = top + entry.offset - transcript.scrollTop
      const x = entry.isUser ? left : left + contentWidth - entry.width
      const intersection = Math.max(0, Math.min(y + entry.height, bottom) - Math.max(y, top))
      const ratio = Math.min(1, intersection / Math.max(1, Math.min(entry.height, transcript.clientHeight)))
      const focused = entry.message.contains(activeElement)
      const distance = Math.max(0, Math.abs(entry.pair.center - focusCenter) - clearRadius)
      const distanceOpacity = Math.exp(-Math.pow(distance / fadeDistance, 2))
      const opacity = focused && intersection > 0 ? 1 : ratio * ratio * distanceOpacity
      setProperty(entry.message, '--whole-bubble-x', `${x}px`)
      setProperty(entry.message, '--whole-bubble-y', `${y}px`)
      setProperty(entry.message, '--whole-bubble-opacity', `${opacity}`)
      entry.message.setAttribute('data-whole-bubble-hidden', opacity <= 0.01 ? 'true' : 'false')
    }
  }

  function updateLayout(): void {
    const width = viewport?.width || window.innerWidth
    const height = viewport?.height || window.innerHeight
    experience.classList.toggle('is-short-viewport', height <= 600)
    const offsetTop = viewport?.offsetTop || 0
    const offsetLeft = viewport?.offsetLeft || 0
    const safeBottom = number(getComputedStyle(experience).getPropertyValue('--chat-safe-bottom'))
    const inset = width <= 639 ? Math.max(16, safeBottom + 8) : Math.max(24, safeBottom + 8)
    const dockWidth = Math.min(560, width - (width <= 639 ? 32 : 48))
    const dockHeight = form.getBoundingClientRect().height || (width <= 639 ? 54 : 56)
    const dockTop = offsetTop + height - inset - dockHeight
    setVariable('--composer-top', dockTop)
    setVariable('--composer-center', offsetLeft + width / 2)
    setVariable('--composer-width', dockWidth)

    // The photograph uses object-fit: cover and object-position: 68% 100%.
    const rect = photo.getBoundingClientRect()
    const scale = Math.max(rect.width / 3344, rect.height / 1882)
    const imageLeft = rect.left + (rect.width - 3344 * scale) * 0.68
    const imageTop = rect.top + (rect.height - 1882 * scale)
    const headLeft = imageLeft + 2140 * scale
    const headY = imageTop + 840 * scale
    const faceClearBottom = imageTop + 1030 * scale
    const availableBesideHead = headLeft - 28 - (identity.getBoundingClientRect().right + 24)
    const portraitMode = width >= 1100 && width / height > 4 / 3 && availableBesideHead >= 280
    experience.dataset.chatMode = portraitMode ? 'portrait' : 'docked'

    let maxHeight: number
    let reading = false
    let forcedReading = false
    if (portraitMode) {
      experience.classList.remove('is-reading')
      const bubbleWidth = Math.min(336, availableBesideHead)
      const top = Math.max(offsetTop + 76, Math.min(headY - 140, dockTop - 200))
      maxHeight = Math.max(120, Math.min(420, dockTop - top - 24))
      setVariable('--conversation-left', headLeft - 28 - bubbleWidth)
      setVariable('--conversation-width', bubbleWidth)
      setVariable('--conversation-top', top)
      setVariable('--conversation-height', maxHeight)
    } else {
      const spaceBelowFace = dockTop - 12 - Math.max(offsetTop + 76, faceClearBottom)
      const needsReadingRoom = spaceBelowFace < 160 || height < 500
      forcedReading = needsReadingRoom
      reading = !conversation.hidden && (expanded || needsReadingRoom)
      experience.classList.toggle('is-reading', reading)
      maxHeight = reading
        ? Math.max(96, dockTop - offsetTop - 76 - 12)
        : Math.max(160, Math.min(420, height * 0.45, spaceBelowFace))
      setVariable('--conversation-left', offsetLeft + (width - dockWidth) / 2)
      setVariable('--conversation-width', dockWidth)
      setVariable('--conversation-height', maxHeight)
      const actualHeight = Math.min(maxHeight, conversation.getBoundingClientRect().height || maxHeight)
      setVariable('--conversation-top', dockTop - 12 - actualHeight)
    }
    root.classList.toggle('is-chat-reading', reading && !experience.hidden)
    identity.inert = reading && !experience.hidden
    expand.hidden = portraitMode || forcedReading || (!expanded && transcript.scrollHeight <= transcript.clientHeight + 4)
    expand.setAttribute('aria-expanded', String(reading))
    expand.setAttribute('aria-label', reading ? 'Collapse conversation' : 'Expand conversation')
  }

  function updateScrollControls(): void {
    if (!isConversationVisible()) return
    const hasHistory = transcript.scrollHeight > transcript.clientHeight + 1
    const innerHistory = experience.dataset.chatMode === 'portrait' && newestAssistantBody
      && newestAssistantBody.body.scrollHeight > newestAssistantBody.body.clientHeight + 1
      && !newestAssistantBody.following
    latest.hidden = (!hasHistory || followingLatest) && !innerHistory
  }

  function schedule(): void {
    if (disposed || pendingLayout) return
    pendingLayout = requestAnimationFrame(() => {
      pendingLayout = 0
      if (disposed) return
      updateLayout()
      if (isConversationVisible()) {
        measureDesktopBubbles()
        followDesktopReplyBody()
        updateScrollControls()
        transcript.scrollTop = followingLatest ? transcript.scrollHeight : readingScrollTop
        readingScrollTop = transcript.scrollTop
        paintDesktopBubbles()
      } else {
        syncBodyScrollTracking(getMessages())
      }
    })
  }

  function followLatest(): void {
    if (disposed) return
    followingLatest = true
    revealLatestBody = true
    latest.hidden = true
    schedule()
  }

  function toggleExpanded(): void {
    if (disposed) return
    expanded = !expanded
    schedule()
  }

  function collapse(): void {
    if (disposed) return
    expanded = false
    schedule()
  }

  function onScroll(): void {
    if (!isConversationVisible()) return
    readingScrollTop = transcript.scrollTop
    followingLatest = transcript.scrollHeight - transcript.clientHeight - readingScrollTop <= 1
    updateScrollControls()
    paintDesktopBubbles()
  }

  function onFocusIn(event: FocusEvent): void {
    if (experience.dataset.chatMode !== 'portrait' || !isConversationVisible()) return
    if (!(event.target instanceof Element)) return
    const message = event.target.closest('.chat-message')
    const entry = desktopBubbleLayout.find(item => item.message === message)
    if (!entry) return
    const body = entry.message.querySelector<HTMLElement>('.chat-message-body')
    const bodyState = body ? bodyScrollStates.get(body) : undefined
    if (bodyState && bodyState.body.contains(event.target)) {
      bodyState.pendingScrollTop = undefined
      bodyState.following = bodyIsAtBottom(bodyState.body)
    }
    const reveal = (): void => {
      const inset = Math.min(8, transcript.clientHeight / 10)
      const visibleTop = transcript.scrollTop + inset
      const visibleBottom = transcript.scrollTop + transcript.clientHeight - inset
      if (entry.offset < visibleTop) transcript.scrollTop = Math.max(0, entry.offset - inset)
      else if (entry.offset + entry.height > visibleBottom) {
        transcript.scrollTop = entry.offset + entry.height - transcript.clientHeight + inset
      }
    }
    reveal()
    readingScrollTop = transcript.scrollTop
    followingLatest = transcript.scrollHeight - transcript.clientHeight - readingScrollTop <= 1
    updateScrollControls()
    // Showing the latest control can change the available reading height.
    reveal()
    readingScrollTop = transcript.scrollTop
    followingLatest = transcript.scrollHeight - transcript.clientHeight - readingScrollTop <= 1
    updateScrollControls()
    paintDesktopBubbles()
  }

  function onFocusOut(): void {
    if (pendingFocusPaint) cancelAnimationFrame(pendingFocusPaint)
    pendingFocusPaint = requestAnimationFrame(() => {
      pendingFocusPaint = 0
      paintDesktopBubbles()
    })
  }

  function onLatestClick(): void {
    followLatest()
    minimize.focus({ preventScroll: true })
  }

  function dispose(): void {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(pendingLayout)
    cancelAnimationFrame(pendingFocusPaint)
    desktopBubbleObserver?.disconnect()
    resizeObserver?.disconnect()
    observedDesktopBubbles.clear()
    for (const [body, state] of bodyScrollStates) body.removeEventListener('scroll', state.onScroll)
    bodyScrollStates.clear()
    newestAssistantBody = undefined
    transcript.removeEventListener('scroll', onScroll)
    transcript.removeEventListener('focusin', onFocusIn)
    transcript.removeEventListener('focusout', onFocusOut)
    latest.removeEventListener('click', onLatestClick)
    window.removeEventListener('resize', schedule)
    viewport?.removeEventListener('resize', schedule)
    viewport?.removeEventListener('scroll', schedule)
    photo.removeEventListener('load', schedule)
    root.classList.remove('is-chat-reading')
    identity.inert = false
  }

  transcript.addEventListener('scroll', onScroll, { passive: true })
  transcript.addEventListener('focusin', onFocusIn)
  transcript.addEventListener('focusout', onFocusOut)
  latest.addEventListener('click', onLatestClick)
  window.addEventListener('resize', schedule)
  viewport?.addEventListener('resize', schedule)
  viewport?.addEventListener('scroll', schedule)
  photo.addEventListener('load', schedule)
  resizeObserver?.observe(conversation)
  resizeObserver?.observe(form)
  schedule()

  return { schedule, followLatest, toggleExpanded, collapse, dispose }
}
