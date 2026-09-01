export interface QuietDeskLayoutElements {
  root: HTMLElement
  identity: HTMLElement
  experience: HTMLElement
  conversation: HTMLElement
  transcript: HTMLElement
  spacer: HTMLElement
  form: HTMLElement
  input: HTMLInputElement
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

interface WheelGesture {
  body: HTMLElement | null
  direction: number
  lastAt: number
  outer: boolean
}

const DESKTOP_REPLY_FACE_OFFSET = 48

/** Geometry for the approved desk design. Call after mounting the elements. */
export function createQuietDeskLayout(elements: QuietDeskLayoutElements): QuietDeskLayoutController {
  const {
    root, identity, experience, conversation, transcript, spacer, form,
    input, expand, latest, minimize, photo,
  } = elements
  let expanded = false
  let followingLatest = true
  let readingScrollTop = 0
  let pendingLayout = 0
  let pendingFocusPaint = 0
  let pendingPointerClear = 0
  let pointerFocusMessage: HTMLElement | undefined
  let revealLatestBody = false
  let pendingLatest = false
  let pendingOuterScrollTop: number | undefined
  let lastLayoutVisible = false
  let wheelGesture: WheelGesture | undefined
  let disposed = false
  let desktopBubbleLayout: BubbleLayout[] = []
  let desktopBubblePairs: BubblePair[] = []
  let desktopBubblePadding = { top: 0, right: 0, bottom: 0, left: 0 }
  let desktopReplyAnchorY = 0
  const observedDesktopBubbles = new Set<HTMLElement>()
  const bodyScrollStates = new Map<HTMLElement, BubbleBodyScroll>()
  let newestAssistantBody: BubbleBodyScroll | undefined
  const viewport = window.visualViewport
  let composerFocused = document.activeElement === input
  let keyboardVisible = false
  let readingBeforeKeyboard = false
  let lastReading = false
  let keyboardReferenceWidth = viewport?.width || window.innerWidth
  let keyboardReferenceHeight = viewport?.height || window.innerHeight
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

  function updateKeyboardState(width: number, height: number): boolean {
    const orientationChanged = Math.abs(width - keyboardReferenceWidth) > Math.max(48, keyboardReferenceWidth * 0.2)
    if (orientationChanged) {
      keyboardReferenceWidth = width
      keyboardReferenceHeight = height
      keyboardVisible = false
    }

    const threshold = Math.max(96, keyboardReferenceHeight * 0.15)
    const occluded = keyboardReferenceHeight - height > threshold
    keyboardVisible = occluded && (composerFocused || keyboardVisible)
    if (!composerFocused && !keyboardVisible) {
      keyboardReferenceWidth = width
      keyboardReferenceHeight = height
    }
    experience.classList.toggle('is-keyboard-open', keyboardVisible)
    return keyboardVisible
  }

  function outerIsAtBottom(): boolean {
    return transcript.scrollHeight - transcript.clientHeight - transcript.scrollTop <= 1
  }

  function setOuterScrollTop(top: number): void {
    const next = Math.max(0, Math.min(top, transcript.scrollHeight - transcript.clientHeight))
    if (Math.abs(transcript.scrollTop - next) > 0.01) {
      transcript.scrollTop = next
      pendingOuterScrollTop = transcript.scrollTop
    }
    readingScrollTop = transcript.scrollTop
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
            if (!programmed) {
              nextState.following = bodyIsAtBottom(body)
              if (nextState !== newestAssistantBody) followingLatest = false
            }
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
    // Keep the approved card height and space for the prompt. On desktop the
    // Latest control sits beside the transcript, so toggling it never resizes it.
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
    let spacerHeight = Math.max(0, logicalOffset - desktopBubblePadding.top)
    const latestReply = desktopBubbleLayout.findLast(entry => !entry.isUser)
    if (latestReply && desktopReplyAnchorY) {
      const transcriptRect = transcript.getBoundingClientRect()
      const transcriptTop = transcriptRect.top + transcript.clientTop
      const availableAnchorOffset = Math.max(
        desktopBubblePadding.top,
        transcript.clientHeight - latestReply.height - desktopBubblePadding.bottom,
      )
      const anchorOffset = Math.max(
        desktopBubblePadding.top,
        Math.min(desktopReplyAnchorY - transcriptTop, availableAnchorOffset),
      )
      const alignedScrollTop = Math.max(0, latestReply.offset - anchorOffset)
      const alignmentSpace = alignedScrollTop + transcript.clientHeight
        - desktopBubblePadding.top - desktopBubblePadding.bottom
      spacerHeight = Math.max(spacerHeight, alignmentSpace)
    }
    setProperty(spacer, 'height', `${spacerHeight}px`)
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
    const keyboardWasVisible = keyboardVisible
    const keyboardOpen = updateKeyboardState(width, height)
    if (keyboardOpen && !keyboardWasVisible) readingBeforeKeyboard = lastReading
    else if (!keyboardOpen) readingBeforeKeyboard = false
    experience.classList.toggle('is-short-viewport', height <= 600)
    const offsetTop = viewport?.offsetTop || 0
    const offsetLeft = viewport?.offsetLeft || 0
    const safeBottom = number(getComputedStyle(experience).getPropertyValue('--chat-safe-bottom'))
    const inset = width <= 639
      ? (keyboardOpen ? 16 : Math.max(16, safeBottom + 8))
      : (keyboardOpen ? 24 : Math.max(24, safeBottom + 8))
    const dockWidth = Math.min(560, width - (width <= 639 ? 32 : 48))
    const dockHeight = form.getBoundingClientRect().height || (width <= 639 ? 54 : 56)
    const dockTop = offsetTop + height - inset - dockHeight
    setVariable('--composer-top', dockTop)
    setVariable('--composer-center', offsetLeft + width / 2)
    setVariable('--composer-width', dockWidth)
    setVariable('--conversation-bottom', Math.max(0, window.innerHeight - dockTop + 12))

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
      // Keep the start of each new reply beside the face while history moves
      // behind it. This preserves the initial reply position for every turn.
      desktopReplyAnchorY = headY - DESKTOP_REPLY_FACE_OFFSET
      const bubbleWidth = Math.min(336, availableBesideHead)
      const top = Math.max(offsetTop + 76, Math.min(headY - 140, dockTop - 200))
      maxHeight = Math.max(120, Math.min(420, dockTop - top - 24))
      setVariable('--conversation-left', headLeft - 28 - bubbleWidth)
      setVariable('--conversation-width', bubbleWidth)
      setVariable('--conversation-top', top)
      setVariable('--conversation-height', maxHeight)
    } else {
      desktopReplyAnchorY = 0
      const spaceBelowFace = dockTop - 12 - Math.max(offsetTop + 76, faceClearBottom)
      const needsReadingRoom = !keyboardOpen && (spaceBelowFace < 160 || height < 500)
      forcedReading = needsReadingRoom || (keyboardOpen && readingBeforeKeyboard)
      reading = !conversation.hidden && (expanded || forcedReading)
      experience.classList.toggle('is-reading', reading)
      maxHeight = reading
        ? Math.max(96, dockTop - offsetTop - 76 - 12)
        : keyboardOpen
          ? Math.max(96, Math.min(300, height * 0.45, dockTop - offsetTop - 76 - 12))
          : Math.max(160, Math.min(420, height * 0.45, spaceBelowFace))
      setVariable('--conversation-left', offsetLeft + (width - dockWidth) / 2)
      setVariable('--conversation-width', dockWidth)
      setVariable('--conversation-height', maxHeight)
    }
    root.classList.toggle('is-chat-reading', reading && !experience.hidden)
    lastReading = reading
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
      const visible = isConversationVisible()
      // Native scrollbar movement can be newer than its queued scroll event.
      // Use the cached offset only when reopening a previously hidden log.
      const currentReadingTop = visible && lastLayoutVisible ? transcript.scrollTop : readingScrollTop
      updateLayout()
      if (visible) {
        measureDesktopBubbles()
        followDesktopReplyBody()
        updateScrollControls()
        setOuterScrollTop(followingLatest ? transcript.scrollHeight : currentReadingTop)
        pendingLatest = false
        paintDesktopBubbles()
      } else {
        syncBodyScrollTracking(getMessages())
      }
      lastLayoutVisible = visible
    })
  }

  function followLatest(): void {
    if (disposed) return
    followingLatest = true
    revealLatestBody = true
    pendingLatest = true
    wheelGesture = undefined
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
    wheelGesture = undefined
    schedule()
  }

  function onScroll(): void {
    if (!isConversationVisible() || pendingLatest) return
    readingScrollTop = transcript.scrollTop
    const programmed = pendingOuterScrollTop !== undefined
      && Math.abs(readingScrollTop - pendingOuterScrollTop) <= 1
    pendingOuterScrollTop = undefined
    if (!programmed) followingLatest = outerIsAtBottom()
    updateScrollControls()
    paintDesktopBubbles()
  }

  function onWheel(event: WheelEvent): void {
    if (disposed || !isConversationVisible() || experience.dataset.chatMode !== 'portrait'
      || event.defaultPrevented || !event.cancelable || event.ctrlKey || event.shiftKey
      || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    if (!(event.target instanceof Element)) return

    // Native wheel chaining drops the remainder at the inner boundary and can
    // latch onto a different fixed bubble as history moves under the pointer.
    event.preventDefault()
    if (pendingLatest) return
    const sourceBody = event.target.closest<HTMLElement>('.chat-message-body')
    const body = sourceBody && transcript.contains(sourceBody)
      && sourceBody.scrollHeight > sourceBody.clientHeight + 1 ? sourceBody : null
    const unit = event.deltaMode === 1
      ? number(getComputedStyle(body || transcript).lineHeight) || 16
      : event.deltaMode === 2 ? (body || transcript).clientHeight : 1
    const delta = event.deltaY * unit
    const direction = Math.sign(delta)
    const now = event.timeStamp
    if (!wheelGesture || now - wheelGesture.lastAt > 180 || now < wheelGesture.lastAt
      || direction !== wheelGesture.direction || (wheelGesture.body && !transcript.contains(wheelGesture.body))) {
      wheelGesture = { body, direction, lastAt: now, outer: !body }
    }
    wheelGesture.lastAt = now

    let remainder = delta
    if (!wheelGesture.outer && wheelGesture.body) {
      const target = wheelGesture.body
      const before = target.scrollTop
      target.scrollTop = Math.max(0, Math.min(before + delta, target.scrollHeight - target.clientHeight))
      remainder -= target.scrollTop - before
      const state = bodyScrollStates.get(target)
      if (state) {
        state.following = bodyIsAtBottom(target)
        state.pendingScrollTop = target.scrollTop
        if (state !== newestAssistantBody && Math.abs(target.scrollTop - before) > 0.01) {
          followingLatest = false
        }
      }
    }
    if (Math.abs(remainder) > 0.01) {
      wheelGesture.outer = true
      setOuterScrollTop(transcript.scrollTop + remainder)
      followingLatest = outerIsAtBottom()
    }
    updateScrollControls()
    paintDesktopBubbles()
  }

  function onPointerDown(event: PointerEvent): void {
    if (experience.dataset.chatMode !== 'portrait' || event.button !== 0
      || !(event.target instanceof Element)) return
    const message = event.target.closest<HTMLElement>('.chat-message')
    if (!message) return
    pointerFocusMessage = message
    if (pendingPointerClear) cancelAnimationFrame(pendingPointerClear)
    pendingPointerClear = requestAnimationFrame(() => {
      pendingPointerClear = 0
      pointerFocusMessage = undefined
    })
    // A click on a tabindex reading area normally asks the browser to reveal
    // it inside the outer scroller. Focus first with preventScroll so text,
    // links and the scrollbar remain usable without moving conversation history.
    const focusTarget = event.target.closest<HTMLElement>('a, button, input, textarea, select, [tabindex]')
    focusTarget?.focus({ preventScroll: true })
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
    // Pointer focus is established with preventScroll in onPointerDown.
    // Keyboard and programmatic focus still reveal an offscreen reading target.
    if (pointerFocusMessage === entry.message) {
      pointerFocusMessage = undefined
      if (pendingPointerClear) cancelAnimationFrame(pendingPointerClear)
      pendingPointerClear = 0
      updateScrollControls()
      paintDesktopBubbles()
      return
    }
    const reveal = (): void => {
      const inset = Math.min(8, transcript.clientHeight / 10)
      const visibleTop = transcript.scrollTop + inset
      const visibleBottom = transcript.scrollTop + transcript.clientHeight - inset
      if (entry.offset < visibleTop) setOuterScrollTop(entry.offset - inset)
      else if (entry.offset + entry.height > visibleBottom) {
        setOuterScrollTop(entry.offset + entry.height - transcript.clientHeight + inset)
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

  function onComposerPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || input.disabled) return
    // Establish focus inside the pointer gesture without allowing the browser
    // to pan the layout viewport to reveal an already docked input.
    input.focus({ preventScroll: true })
  }

  function onComposerFocus(): void {
    composerFocused = true
    const width = viewport?.width || window.innerWidth
    const height = viewport?.height || window.innerHeight
    if (Math.abs(width - keyboardReferenceWidth) > Math.max(48, keyboardReferenceWidth * 0.2)) {
      keyboardReferenceWidth = width
      keyboardReferenceHeight = height
      keyboardVisible = false
    } else {
      keyboardReferenceHeight = Math.max(keyboardReferenceHeight, height)
    }
    schedule()
  }

  function onComposerBlur(): void {
    composerFocused = false
    // Keep the keyboard state through its closing animation. updateLayout
    // clears it once the visual viewport has recovered.
    schedule()
  }

  function dispose(): void {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(pendingLayout)
    cancelAnimationFrame(pendingFocusPaint)
    cancelAnimationFrame(pendingPointerClear)
    pointerFocusMessage = undefined
    desktopBubbleObserver?.disconnect()
    resizeObserver?.disconnect()
    observedDesktopBubbles.clear()
    for (const [body, state] of bodyScrollStates) body.removeEventListener('scroll', state.onScroll)
    bodyScrollStates.clear()
    newestAssistantBody = undefined
    wheelGesture = undefined
    transcript.removeEventListener('scroll', onScroll)
    transcript.removeEventListener('wheel', onWheel)
    transcript.removeEventListener('focusin', onFocusIn)
    transcript.removeEventListener('focusout', onFocusOut)
    transcript.removeEventListener('pointerdown', onPointerDown, true)
    input.removeEventListener('pointerdown', onComposerPointerDown)
    input.removeEventListener('focus', onComposerFocus)
    input.removeEventListener('blur', onComposerBlur)
    latest.removeEventListener('click', onLatestClick)
    window.removeEventListener('resize', schedule)
    viewport?.removeEventListener('resize', schedule)
    viewport?.removeEventListener('scroll', schedule)
    photo.removeEventListener('load', schedule)
    root.classList.remove('is-chat-reading')
    experience.classList.remove('is-keyboard-open')
    identity.inert = false
  }

  transcript.addEventListener('scroll', onScroll, { passive: true })
  transcript.addEventListener('wheel', onWheel, { passive: false })
  transcript.addEventListener('focusin', onFocusIn)
  transcript.addEventListener('focusout', onFocusOut)
  transcript.addEventListener('pointerdown', onPointerDown, true)
  input.addEventListener('pointerdown', onComposerPointerDown)
  input.addEventListener('focus', onComposerFocus)
  input.addEventListener('blur', onComposerBlur)
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
