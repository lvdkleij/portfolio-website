<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import QuietDeskIcon from './QuietDeskIcon.vue'
import { useChatStream } from '~/composables/useChatStream'

type Panel = 'about' | 'approach' | 'contact' | 'chat'
interface Message {
  id: number
  role: 'assistant' | 'user'
  text: string
  error?: string
}

const panelNames = { about: 'About', approach: 'Approach', contact: 'Contact', chat: 'AI assistant' } as const
const activePanel = ref<Panel | null>(null)
const panelTitle = computed(() => activePanel.value ? panelNames[activePanel.value] : '')
const restingDraft = ref('')
const chatDraft = ref('')
const messages = ref<Message[]>([])
const visibleMessages = computed(() => messages.value.filter(message => message.text || message.error))
const { active: thinking, responseText, error, start, dispose } = useChatStream({
  endpoint: '/api/v1/lucasai/stream'
})
const panel = ref<HTMLElement | null>(null)
const chatInput = ref<HTMLInputElement | null>(null)
const restingInput = ref<HTMLInputElement | null>(null)
const chatTrigger = ref<HTMLButtonElement | null>(null)
const transcript = ref<HTMLElement | null>(null)
const viewportStyle = ref<Record<string, string>>({})
let nextId = 1
let returnFocus: HTMLElement | null = null
let activeMessageId: number | undefined
let visualViewport: VisualViewport | null = null

watch(responseText, (text) => {
  const message = messages.value.find(message => message.id === activeMessageId)
  if (!message) return
  message.text = text
  void scrollToLatest()
}, { flush: 'sync' })

function updateViewport() {
  if (!visualViewport) return
  viewportStyle.value = {
    '--quiet-viewport-height': `${visualViewport.height}px`,
    '--quiet-viewport-top': `${visualViewport.offsetTop}px`
  }
}

onMounted(() => {
  // Keep the photo full-height, but size open sheets to the visible keyboard-safe area.
  visualViewport = window.visualViewport
  visualViewport?.addEventListener('resize', updateViewport)
  visualViewport?.addEventListener('scroll', updateViewport)
  updateViewport()
})

onBeforeUnmount(() => {
  activeMessageId = undefined
  dispose()
  visualViewport?.removeEventListener('resize', updateViewport)
  visualViewport?.removeEventListener('scroll', updateViewport)
})

async function scrollToLatest() {
  await nextTick()
  if (transcript.value) transcript.value.scrollTop = transcript.value.scrollHeight
}

async function openPanel(name: Panel, trigger: HTMLElement | null) {
  returnFocus = trigger
  activePanel.value = name
  if (name === 'chat' && messages.value.length === 0) {
    messages.value.push({ id: nextId++, role: 'assistant', text: 'Hello — ask me about Lucas’s background, approach, or areas of focus.' })
  }
  await nextTick()
  if (name === 'chat') {
    chatInput.value?.focus({ preventScroll: true })
    void scrollToLatest()
  } else {
    panel.value?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
  }
}

function openFromMenu(name: Panel, event: MouseEvent) {
  void openPanel(name, event.currentTarget as HTMLElement)
}

async function closePanel() {
  activePanel.value = null
  await nextTick()
  const target = returnFocus
  returnFocus = null
  // A resize can hide the resting composer on a short phone.
  const restingForm = target?.closest('.quiet-composer--resting')
  if (target && (!restingForm || getComputedStyle(restingForm).display !== 'none')) {
    target.focus({ preventScroll: true })
  }
  if (document.activeElement !== target) chatTrigger.value?.focus({ preventScroll: true })
}

function handlePanelKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    void closePanel()
    return
  }
  if (event.key !== 'Tab') return
  const controls = Array.from(panel.value?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])') ?? [])
  const first = controls[0]
  const last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

async function streamReply(user: Message, replyId: number) {
  activeMessageId = replyId
  await start({
    clientRequestId: `quiet-${Date.now()}-${user.id}`,
    messages: [{ id: String(user.id), role: 'user', content: user.text }]
  })
  if (activeMessageId !== replyId) return
  const reply = messages.value.find(message => message.id === replyId)
  if (reply) reply.error = error.value?.message
  activeMessageId = undefined
  void scrollToLatest()
  // Never steal focus when the visitor has closed chat or moved to another control.
}

function ask(question: string) {
  const value = question.trim()
  if (!value || thinking.value) return false
  const user: Message = { id: nextId++, role: 'user', text: value }
  const replyId = nextId++
  messages.value.push(user, { id: replyId, role: 'assistant', text: '' })
  void streamReply(user, replyId)
  void scrollToLatest()
  return true
}

function submitResting() {
  if (!ask(restingDraft.value)) {
    restingInput.value?.focus()
    return
  }
  restingDraft.value = ''
  void openPanel('chat', restingInput.value)
}

function submitChat() {
  if (ask(chatDraft.value)) {
    chatDraft.value = ''
    chatInput.value?.focus({ preventScroll: true })
  }
}
</script>

<template>
  <div class="quiet-ui" :style="viewportStyle">
    <section v-show="!activePanel" class="quiet-stack" aria-label="Introduction and menu">
      <header class="quiet-identity">
        <h1>Lucas van der Kleij</h1>
        <p>Software engineer</p>
      </header>

      <nav class="quiet-menu" aria-label="Profile menu">
        <button v-for="name in (['about', 'contact'] as const)" :key="name" class="quiet-text-action" type="button" aria-haspopup="dialog" aria-controls="quiet-panel" @click="openFromMenu(name, $event)">{{ panelNames[name] }}</button>
      </nav>

      <div class="quiet-chat-entry">
        <button ref="chatTrigger" class="quiet-chat-trigger" type="button" aria-haspopup="dialog" aria-controls="quiet-panel" @click="openPanel('chat', chatTrigger)">
          <QuietDeskIcon name="message" />
          <span>AI Chat</span>
        </button>
        <form class="quiet-composer quiet-composer--resting" aria-label="Start AI chat" @submit.prevent="submitResting">
          <label class="sr-only" for="quiet-resting-input">Ask me something</label>
          <input id="quiet-resting-input" ref="restingInput" v-model="restingDraft" name="question" type="text" placeholder="Ask me something…" autocomplete="off" maxlength="2000">
          <button class="quiet-send-button" type="submit" aria-label="Send message" :disabled="thinking"><QuietDeskIcon name="send" /></button>
        </form>
      </div>
    </section>

    <section v-if="activePanel" id="quiet-panel" ref="panel" class="quiet-panel" :class="{ 'quiet-panel--chat': activePanel === 'chat' }" role="dialog" aria-modal="true" aria-labelledby="quiet-panel-title" @keydown="handlePanelKeydown">
      <header class="quiet-panel-header">
        <h2 id="quiet-panel-title" class="quiet-panel-title">{{ panelTitle }}</h2>
        <button class="quiet-icon-button" type="button" :aria-label="activePanel === 'chat' ? 'Close AI chat' : 'Back to menu'" @click="closePanel"><QuietDeskIcon :name="activePanel === 'chat' ? 'close' : 'back'" /></button>
      </header>

      <template v-if="activePanel === 'chat'">
        <div ref="transcript" class="quiet-transcript" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text">
          <div v-for="message in visibleMessages" :key="message.id" class="quiet-message" :class="`quiet-message--${message.role}`">
            <span v-if="message.role === 'assistant'" class="quiet-message-label">AI assistant</span>
            <p v-if="message.text">{{ message.text }}</p>
            <p v-if="message.error" role="alert">{{ message.error }}</p>
          </div>
          <div v-if="thinking && !responseText" class="quiet-message quiet-thinking" role="status"><span class="quiet-message-label">AI assistant</span><p>Thinking…</p></div>
        </div>
        <footer class="quiet-chat-footer">
          <form class="quiet-composer" aria-label="Send a message to the AI assistant" @submit.prevent="submitChat">
            <label class="sr-only" for="quiet-chat-input">Message AI assistant</label>
            <input id="quiet-chat-input" ref="chatInput" v-model="chatDraft" name="message" type="text" placeholder="Ask me something…" autocomplete="off" maxlength="2000">
            <button class="quiet-send-button" type="submit" aria-label="Send message" :disabled="thinking"><QuietDeskIcon name="send" /></button>
          </form>
        </footer>
      </template>

      <div v-else class="quiet-info-content">
        <template v-if="activePanel === 'about'">
          <p>I'm a Software Engineer with 4+ years of experience building software solutions in the financial services sector.</p>
          <p>My experience covers the full delivery lifecycle, from architecture and development to cloud infrastructure, CI/CD, security, testing, and observability. I am specialised in building Spring Boot microservices with Java and Kotlin, modern web applications with Angular and Nuxt, and event-driven, serverless solutions in Azure.</p>
        </template>
        <p v-else-if="activePanel === 'approach'">Understand the context first, shape clear systems around the real constraints, then iterate carefully toward a useful result.</p>
        <template v-else>
          <p>Find Lucas on LinkedIn and GitHub.</p>
          <div class="quiet-contact-links">
            <a href="https://www.linkedin.com/in/lucas-van-der-kleij" target="_blank" rel="noopener noreferrer"><span>LinkedIn</span><QuietDeskIcon name="external" /></a>
            <a href="https://github.com/lvdkleij" target="_blank" rel="noopener noreferrer"><span>GitHub</span><QuietDeskIcon name="external" /></a>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.quiet-ui {
  --quiet-paper: #e8e6e1;
  --quiet-panel: #f1eade;
  --quiet-ink: #292722;
  --quiet-muted: #62584c;
  --quiet-line: #b9aa98;
  --quiet-focus: #6b482f;
  position: absolute;
  inset: var(--frame-top) var(--frame-right) var(--frame-bottom) var(--frame-left);
  color: var(--quiet-ink);
  font-family: Inter, sans-serif;
  pointer-events: none;
}
.quiet-ui button, .quiet-ui input { color: inherit; font: inherit; }
.quiet-ui button:focus-visible, .quiet-ui a:focus-visible, .quiet-ui input:focus-visible { outline: 2px solid var(--quiet-focus); outline-offset: 3px; }
.quiet-ui svg { display: block; width: 18px; height: 18px; flex: 0 0 auto; }
.quiet-stack { position: absolute; top: clamp(56px, 13vh, 112px); left: clamp(24px, 6vw, 96px); width: min(340px, calc(100% - 48px)); pointer-events: auto; }
.quiet-identity h1 { margin: 0; font-family: Newsreader, serif; font-size: clamp(40px, 2.75vw, 44px); font-weight: 400; font-style: normal; font-optical-sizing: auto; line-height: 1.08; letter-spacing: -0.025em; }
.quiet-identity p { margin: 8px 0 0; color: var(--quiet-muted); font-size: 13px; font-weight: 400; line-height: 1.5; }
.quiet-menu { display: flex; flex-direction: column; align-items: flex-start; gap: 0; margin-top: 32px; }
.quiet-menu .quiet-text-action { min-width: 44px; min-height: 44px; padding: 8px 0; border: 0; background: transparent; font-size: 16px; font-weight: 400; text-align: left; transition: color 180ms ease, transform 180ms ease; }
.quiet-text-action:hover { color: var(--quiet-focus); transform: translateX(2px); }
.quiet-chat-entry { margin-top: 24px; padding-top: 20px; border-top: 1px solid rgb(185 170 152 / 78%); }
.quiet-chat-entry .quiet-chat-trigger { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0; border: 0; background: transparent; font-size: 14px; font-weight: 500; }
.quiet-chat-trigger svg { color: var(--quiet-muted); }
.quiet-composer { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 48px; margin-top: 12px; padding: 4px 4px 4px 16px; border: 1px solid rgb(185 170 152 / 90%); border-radius: 18px; background: rgb(241 234 222 / 72%); }
.quiet-composer input { width: 0; min-width: 0; flex: 1; border: 0; border-radius: 0; padding: 1px 2px; outline: 0; background: transparent; font-size: 14px; }
.quiet-composer input::placeholder { color: var(--quiet-muted); opacity: 1; }
.quiet-composer:focus-within { outline: 2px solid var(--quiet-focus); outline-offset: 3px; }
.quiet-send-button { display: inline-grid; place-items: center; width: 44px; height: 44px; flex: 0 0 44px; padding: 0; border: 0; border-radius: 14px; background: transparent; }
.quiet-send-button:hover:not(:disabled) { background: rgb(232 230 225 / 72%); }
.quiet-send-button:disabled { opacity: 0.45; cursor: default; }
.quiet-panel { position: absolute; z-index: 3; top: clamp(40px, 8vh, 72px); left: clamp(24px, 6vw, 96px); display: flex; flex-direction: column; width: min(390px, calc(100% - 48px)); max-height: min(720px, calc(100% - 80px)); overflow: hidden; border: 1px solid rgb(185 170 152 / 88%); border-radius: 24px; background: rgb(241 234 222 / 96%); pointer-events: auto; }
.quiet-panel--chat { height: min(720px, calc(100% - 80px)); }
.quiet-panel-header { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; min-height: 64px; padding: 8px 12px 8px 16px; border-bottom: 1px solid rgb(185 170 152 / 68%); background: var(--quiet-panel); }
.quiet-panel-title { margin: 0; font-size: 13px; line-height: 1.4; font-weight: 600; letter-spacing: 0.01em; }
.quiet-icon-button { display: inline-grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 14px; background: transparent; }
.quiet-icon-button:hover { color: var(--quiet-ink); background: var(--quiet-paper); }
.quiet-icon-button svg { width: 19px; height: 19px; color: var(--quiet-muted); }
.quiet-info-content { min-height: 0; padding: 24px; overflow-y: auto; font-size: 15px; line-height: 1.65; }
.quiet-info-content p { margin: 0; }
.quiet-info-content p + p { margin-top: 16px; }
.quiet-contact-links { display: flex; flex-direction: column; gap: 4px; margin-top: 20px; }
.quiet-contact-links a { display: inline-flex; align-items: center; justify-content: space-between; min-height: 44px; border-bottom: 1px solid rgb(185 170 152 / 68%); font-size: 15px; }
.quiet-contact-links a:hover { color: var(--quiet-focus); }
.quiet-contact-links svg { width: 17px; height: 17px; }
.quiet-transcript { display: flex; flex: 1; flex-direction: column; gap: 16px; min-height: 0; padding: 24px; overflow-y: auto; overscroll-behavior: contain; font-size: 14px; line-height: 1.55; }
.quiet-message { max-width: 92%; overflow-wrap: anywhere; }
.quiet-message p { margin: 0; white-space: pre-wrap; }
.quiet-message--assistant, .quiet-thinking { align-self: flex-start; }
.quiet-message--user { align-self: flex-end; padding: 10px 14px; border-radius: 16px 16px 4px 16px; background: var(--quiet-paper); }
.quiet-message-label { display: block; margin-bottom: 6px; color: var(--quiet-muted); font-size: 12px; font-weight: 600; }
.quiet-thinking { color: var(--quiet-muted); }
.quiet-chat-footer { flex: 0 0 auto; padding: 12px; border-top: 1px solid rgb(185 170 152 / 68%); background: var(--quiet-panel); }
.quiet-chat-footer .quiet-composer { margin-top: 0; background: var(--quiet-paper); }

@media (max-width: 639px) {
  .quiet-ui { inset: 0; }
  .quiet-stack { top: calc(52px + env(safe-area-inset-top, 0px)); left: max(24px, env(safe-area-inset-left, 0px)); width: min(310px, calc(100% - 48px)); }
  .quiet-identity h1 { font-size: 32px; }
  .quiet-menu { flex-direction: row; flex-wrap: wrap; gap: 0 16px; margin-top: 8px; }
  .quiet-menu .quiet-text-action { font-size: 15px; }
  .quiet-chat-entry { margin-top: 8px; padding-top: 4px; }
  .quiet-composer { margin-top: 8px; }
  .quiet-composer input { font-size: 16px; }
  .quiet-panel { position: fixed; top: calc(var(--quiet-viewport-top, 0px) + max(16px, env(safe-area-inset-top, 0px))); right: max(16px, env(safe-area-inset-right, 0px)); left: max(16px, env(safe-area-inset-left, 0px)); width: auto; height: calc(var(--quiet-viewport-height, 100dvh) - max(16px, env(safe-area-inset-top, 0px)) - max(16px, env(safe-area-inset-bottom, 0px))); max-height: none; border-radius: 20px; }
  .quiet-info-content, .quiet-transcript { padding: 20px; }
}
@media (max-height: 600px) {
  .quiet-stack { top: 20px; }
  .quiet-identity h1 { font-size: 30px; }
  .quiet-identity p { margin-top: 4px; }
  .quiet-menu { margin-top: 8px; }
  .quiet-chat-entry { margin-top: 4px; padding-top: 4px; }
  .quiet-composer { margin-top: 4px; }
}
@media (min-width: 640px) and (max-height: 600px) {
  .quiet-panel { top: 12px; bottom: 12px; max-height: none; }
  .quiet-panel--chat { height: auto; }
}
@media (min-width: 640px) and (max-width: 767px) and (max-height: 600px) {
  .quiet-stack { top: 64px; }
  .quiet-menu { flex-direction: row; flex-wrap: wrap; gap: 0 16px; }
  .quiet-composer--resting { display: none; }
}
@media (max-width: 639px) and (max-height: 740px) {
  .quiet-composer--resting { display: none; }
}
@media (max-width: 639px) and (max-height: 600px) {
  .quiet-stack { top: calc(48px + env(safe-area-inset-top, 0px)); }
  .quiet-menu { margin-top: 4px; }
  .quiet-chat-entry { margin-top: 0; padding-top: 0; border-top: 0; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation: none !important; transition: none !important; }
}
</style>
