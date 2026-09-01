<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import QuietDeskIcon from './QuietDeskIcon.vue'
import { useChatStream } from '~/composables/useChatStream'
import { renderSafeMarkdown } from '~/utils/markdown'
import { createQuietDeskLayout } from '~/utils/quietDeskLayout'

interface Message {
  id: number
  role: 'assistant' | 'user'
  text: string
  pending?: boolean
  contacts?: boolean
  error?: string
}

const suggestions = ['What do you work with?', "What's your background?", 'How can I reach you?']
const entering = ref(true)
const visible = ref(false)
const preparingNewTurn = ref(false)
const draft = ref('')
const messages = ref<Message[]>([])
const announcement = ref('')
const { active: thinking, responseText, error, start, dispose } = useChatStream({
  endpoint: '/api/v1/lucasai/stream'
})
const renderedMessages = computed(() => messages.value.map(message => ({
  ...message,
  html: message.role === 'assistant' && message.text ? renderSafeMarkdown(message.text) : ''
})))
const latestReplyId = computed(() => messages.value.findLast(message => message.role === 'assistant')?.id)
const root = ref<HTMLElement | null>(null)
const identity = ref<HTMLElement | null>(null)
const experience = ref<HTMLElement | null>(null)
const conversation = ref<HTMLElement | null>(null)
const transcript = ref<HTMLElement | null>(null)
const spacer = ref<HTMLElement | null>(null)
const form = ref<HTMLFormElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const expand = ref<HTMLButtonElement | null>(null)
const latest = ref<HTMLButtonElement | null>(null)
const minimize = ref<HTMLButtonElement | null>(null)
const historyToggle = ref<HTMLButtonElement | null>(null)
let layout: ReturnType<typeof createQuietDeskLayout> | undefined
let activeMessageId: number | undefined
let nextId = 1
let revealFrame = 0

function finishEntrance() {
  entering.value = false
}

function scheduleLayout() {
  void nextTick(() => layout?.schedule())
}

watch(responseText, (text) => {
  const message = messages.value.find(message => message.id === activeMessageId)
  if (message) message.text = text
  // Keep the reader's position when they scroll back during a streamed reply.
  scheduleLayout()
}, { flush: 'sync' })

onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) finishEntrance()
  const photo = root.value?.closest('main')?.querySelector<HTMLImageElement>('.desk-landing__image')
  if (!photo || !root.value || !identity.value || !experience.value || !conversation.value
    || !transcript.value || !spacer.value || !form.value || !input.value
    || !expand.value || !latest.value || !minimize.value) return
  layout = createQuietDeskLayout({
    root: root.value, identity: identity.value, experience: experience.value,
    conversation: conversation.value, transcript: transcript.value, spacer: spacer.value,
    form: form.value, input: input.value, expand: expand.value,
    latest: latest.value, minimize: minimize.value, photo
  })
  // Font metrics can change after the first layout even when the image is cached.
  void document.fonts?.ready.then(() => layout?.schedule())
})

onBeforeUnmount(() => {
  activeMessageId = undefined
  cancelAnimationFrame(revealFrame)
  dispose()
  layout?.dispose()
  layout = undefined
})

async function showConversation() {
  finishEntrance()
  visible.value = true
  await nextTick()
  layout?.schedule()
  minimize.value?.focus({ preventScroll: true })
}

async function hideConversation() {
  visible.value = false
  await nextTick()
  layout?.collapse()
  historyToggle.value?.focus({ preventScroll: true })
}

async function streamReply(user: Message, replyId: number) {
  activeMessageId = replyId
  await start({
    clientRequestId: `quiet-${Date.now()}-${user.id}`,
    messages: [{ id: String(user.id), role: 'user', content: user.text }]
  })
  if (activeMessageId !== replyId) return
  const reply = messages.value.find(message => message.id === replyId)
  if (reply) {
    reply.pending = false
    reply.error = error.value?.message
    announcement.value = reply.error ? '' : reply.text
  }
  activeMessageId = undefined
  scheduleLayout()
}

function revealPreparedTurn() {
  cancelAnimationFrame(revealFrame)
  // Commit the new bubble geometry while it is hidden and transitions are
  // disabled. Reveal on the following paint so retained opacity cannot flash.
  revealFrame = requestAnimationFrame(() => {
    revealFrame = 0
    preparingNewTurn.value = false
  })
}

async function submit(event: SubmitEvent) {
  const submitter = event.submitter as HTMLButtonElement | null
  const example = submitter?.dataset.prompt
  const question = (example ?? draft.value).trim()
  if (!question || question.length > 2000 || thinking.value) return
  const reopeningWithHistory = !visible.value && messages.value.length > 0
  if (reopeningWithHistory) preparingNewTurn.value = true
  finishEntrance()
  announcement.value = ''
  const user: Message = { id: nextId++, role: 'user', text: question }
  const replyId = nextId++
  messages.value.push(user, {
    id: replyId, role: 'assistant', text: '', pending: true,
    contacts: /contact|linkedin|github|reach/i.test(question)
  })
  if (example === undefined) draft.value = ''
  visible.value = true
  void streamReply(user, replyId)
  await nextTick()
  if (reopeningWithHistory && layout) {
    layout.followLatest(revealPreparedTurn)
  } else {
    layout?.followLatest()
    preparingNewTurn.value = false
  }
  // Suggestions should not summon the mobile keyboard or discard a typed draft.
  ;(example === undefined ? input.value : minimize.value)?.focus({ preventScroll: true })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && visible.value) {
    event.preventDefault()
    void hideConversation()
  }
}
</script>

<template>
  <div ref="root" class="quiet-ui" :class="{ 'quiet-ui--entering': entering }" @focusin="finishEntrance" @keydown="onKeydown">
    <section ref="identity" class="quiet-stack" aria-label="Introduction">
      <header class="quiet-identity">
        <h1>Lucas van der Kleij</h1>
        <p>Software engineer</p>
      </header>
    </section>

    <div ref="experience" class="chat-experience" data-chat-mode="docked">
      <section id="conversation" ref="conversation" class="conversation" :class="{ 'is-preparing-turn': preparingNewTurn }" aria-label="Conversation" :hidden="!visible">
        <header class="conversation-header">
          <p class="conversation-caption">AI-generated replies</p>
          <div class="conversation-actions">
            <button id="expand-chat" ref="expand" class="icon-button" type="button" aria-label="Expand conversation" aria-expanded="false" aria-controls="transcript" hidden @click="layout?.toggleExpanded()">
              <QuietDeskIcon class="expand-symbol" name="expand" />
              <QuietDeskIcon class="collapse-symbol" name="collapse" />
            </button>
            <button id="minimize-chat" ref="minimize" class="icon-button" type="button" aria-label="Hide conversation" @click="hideConversation"><QuietDeskIcon name="minus" /></button>
          </div>
        </header>
        <div id="transcript" ref="transcript" class="conversation-scroll" role="log" aria-label="Conversation history" aria-description="Scroll to read earlier messages. Use Latest reply to return to the newest message." aria-live="off" tabindex="0">
          <div id="conversation-spacer" ref="spacer" class="conversation-spacer" aria-hidden="true" hidden />
          <article
            v-for="message in renderedMessages"
            :key="message.id"
            class="chat-message"
            :class="[`chat-message--${message.role}`, { 'is-latest': message.id === latestReplyId, 'chat-message--thinking': message.pending && !message.text, 'response-arrive': message.role === 'assistant' }]"
            :aria-label="message.role === 'user' ? 'Your message' : 'AI-generated reply in Lucas’s voice'"
          >
            <div class="chat-message-body">
              <p v-if="message.role === 'user'">{{ message.text }}</p>
              <div v-else-if="message.html" class="message-markdown" v-html="message.html" />
              <p v-else-if="message.pending">Thinking…</p>
              <p v-if="message.error" class="message-error" role="alert">{{ message.error }}</p>
              <div v-if="message.contacts && !message.pending && !message.error" class="message-links">
                <a href="https://www.linkedin.com/in/lucas-van-der-kleij" target="_blank" rel="noopener noreferrer">LinkedIn<QuietDeskIcon name="external" /></a>
                <a href="https://github.com/lvdkleij" target="_blank" rel="noopener noreferrer">GitHub<QuietDeskIcon name="external" /></a>
              </div>
            </div>
          </article>
        </div>
        <button id="latest-reply" ref="latest" class="latest-reply" type="button" aria-label="Jump to latest reply" aria-controls="transcript" hidden><QuietDeskIcon name="down" /></button>
      </section>

      <div class="chat-dock" @animationend.self="finishEntrance" @animationcancel.self="finishEntrance">
        <form id="chat-form" ref="form" class="bottom-composer" :class="{ 'has-message': draft.trim() }" aria-label="Ask me anything" @submit.prevent="submit">
          <button id="history-toggle" ref="historyToggle" class="history-toggle" type="button" aria-label="Show conversation" aria-controls="conversation" :aria-expanded="visible" :hidden="visible || !messages.length" @click="showConversation"><QuietDeskIcon name="history" /></button>
          <label class="sr-only" for="chat-input">Ask me anything</label>
          <input id="chat-input" ref="input" v-model="draft" name="message" type="text" placeholder="Ask me anything…" autocomplete="off" maxlength="2000">
          <button id="chat-send" class="composer-send" type="submit" aria-label="Send message" :disabled="!draft.trim() || thinking"><QuietDeskIcon name="send" /></button>
        </form>
        <div id="prompt-suggestions" class="prompt-suggestions" role="group" aria-label="Example questions" :hidden="visible">
          <button v-for="question in suggestions" :key="question" class="prompt-chip" type="submit" form="chat-form" :data-prompt="question" :disabled="thinking">{{ question }}</button>
        </div>
      </div>
    </div>
    <p id="chat-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
  </div>
</template>


<style scoped>
.quiet-ui {
  --paper: #e8e6e1;
  --panel: #f1eade;
  --ink: #292722;
  --muted: #62584c;
  --line: #b9aa98;
  --focus: #6b482f;
  position: absolute;
  inset: var(--frame-top) var(--frame-right) var(--frame-bottom) var(--frame-left);
  color: var(--ink);
  font-family: Inter, sans-serif;
  pointer-events: none;
}
button, input { color: inherit; font: inherit; }
.quiet-ui button:focus-visible, .quiet-ui a:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }
.quiet-ui svg { display: block; width: 18px; height: 18px; flex: 0 0 auto; }
.quiet-stack { position: absolute; top: clamp(56px, 13vh, 112px); left: clamp(24px, 6vw, 96px); width: min(340px, calc(100% - 48px)); pointer-events: auto; }
.quiet-identity h1 { margin: 0; font-family: Newsreader, serif; font-size: clamp(40px, 2.75vw, 44px); font-weight: 400; font-style: normal; font-optical-sizing: auto; line-height: 1.08; letter-spacing: -0.025em; }
.quiet-identity p { margin: 8px 0 0; color: var(--muted); font-size: 13px; font-weight: 400; line-height: 1.5; }
.icon-button { display: inline-grid; place-items: center; width: 44px; height: 44px; flex: 0 0 44px; padding: 0; border: 0; border-radius: 14px; background: transparent; }
.icon-button svg { width: 19px; height: 19px; color: var(--muted); }
.icon-button[aria-expanded="false"] .collapse-symbol,
.icon-button[aria-expanded="true"] .expand-symbol { display: none; }

@keyframes quiet-arrive {
  from { opacity: 0; translate: 0 8px; }
  to { opacity: 1; translate: 0 0; }
}
@media (prefers-reduced-motion: no-preference) {
  .quiet-ui--entering .quiet-identity h1,
  .quiet-ui--entering .quiet-identity p,
  .quiet-ui--entering .chat-dock { animation: quiet-arrive 640ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
  .quiet-ui--entering .quiet-identity p { animation-delay: 100ms; }
  .quiet-ui--entering .chat-dock { animation-delay: 360ms; }
}
@media (max-width: 639px) {
  .quiet-ui { inset: 0; }
  .quiet-stack { top: calc(52px + env(safe-area-inset-top, 0px)); left: max(24px, env(safe-area-inset-left, 0px)); width: min(310px, calc(100% - 48px)); }
  .quiet-identity h1 { font-size: 32px; }
}
@media (max-height: 600px) {
  .quiet-stack { top: 20px; }
  .quiet-identity h1 { font-size: 30px; }
  .quiet-identity p { margin-top: 4px; }
}
@media (min-width: 640px) and (max-width: 767px) and (max-height: 600px) {
  .quiet-stack { top: 64px; }
}
@media (max-width: 639px) and (max-height: 600px) {
  .quiet-stack { top: calc(48px + env(safe-area-inset-top, 0px)); }
}

.bottom-composer input:focus, .bottom-composer input:focus-visible { outline: none; box-shadow: none; }
.composer-send:disabled { opacity: 0.45; }
.message-links svg { width: 14px; height: 14px; }
.message-error { margin-top: 8px !important; color: #8b342f; }
.message-markdown :deep(p) { margin: 0; white-space: normal; }
.message-markdown :deep(p + p) { margin-top: 12px; }
.message-markdown :deep(ul), .message-markdown :deep(ol) { margin: 12px 0; padding-left: 20px; }
.message-markdown :deep(li + li) { margin-top: 4px; }
.message-markdown :deep(h1), .message-markdown :deep(h2), .message-markdown :deep(h3),
.message-markdown :deep(h4), .message-markdown :deep(h5), .message-markdown :deep(h6) { margin: 14px 0 8px; font-size: 1em; line-height: inherit; }
.message-markdown :deep(:first-child) { margin-top: 0; }
.message-markdown :deep(:last-child) { margin-bottom: 0; }
.message-markdown :deep(a) { text-decoration: underline; text-underline-offset: 3px; }
.message-markdown :deep(a:focus-visible) { outline: 2px solid var(--focus); outline-offset: 2px; }
.message-markdown :deep(pre) { max-width: 100%; margin: 12px 0; padding: 10px; overflow-x: auto; border-radius: 8px; background: rgba(98, 88, 76, 0.08); font-size: 12px; }
.message-markdown :deep(code) { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.message-markdown :deep(blockquote) { margin: 12px 0; padding-left: 12px; border-left: 2px solid var(--line); color: var(--muted); }

[hidden] { display: none !important; }
.chat-experience {
  --chat-safe-bottom: env(safe-area-inset-bottom, 0px);
  pointer-events: none;
}
.chat-dock {
  position: fixed;
  z-index: 5;
  top: var(--composer-top, calc(100dvh - 84px));
  left: var(--composer-center, 50%);
  width: var(--composer-width, min(560px, calc(100% - 48px)));
  transform: translateX(-50%);
  pointer-events: auto;
}
.bottom-composer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 56px;
  margin: 0;
  padding: 5px 5px 5px 18px;
  border: 1px solid rgba(185, 170, 152, 0.88);
  border-radius: 16px;
  background: rgba(241, 234, 222, 0.96);
}
.bottom-composer input {
  width: 0;
  min-width: 0;
  min-height: 44px;
  flex: 1;
  padding: 0;
  border: 0;
  border-radius: 0;
  outline: 0;
  box-shadow: none;
  background: transparent;
  color: var(--ink);
  font-size: 16px;
  line-height: 22px;
}
.bottom-composer input::placeholder { color: var(--muted); opacity: 1; }
.bottom-composer:focus-within { outline: none; box-shadow: none; }
.composer-send, .history-toggle {
  display: inline-grid;
  position: relative;
  place-items: center;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
}
.composer-send::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  background: rgba(98, 88, 76, 0.08);
  transition: background-color 180ms ease;
}
.composer-send svg { position: relative; font-size: 18px; }
.bottom-composer.has-message .composer-send:not(:disabled) { color: var(--panel); }
.bottom-composer.has-message .composer-send:not(:disabled)::before { background: var(--ink); }
.bottom-composer.has-message .composer-send:not(:disabled):hover::before { background: var(--focus); }
.composer-send:disabled { cursor: default; }
.history-toggle { margin-left: -10px; border-radius: 10px; }
.history-toggle svg { font-size: 18px; }
.history-toggle:hover { color: var(--ink); background: rgba(98, 88, 76, 0.06); }
.conversation {
  position: fixed;
  z-index: 4;
  top: var(--conversation-top, 32vh);
  left: var(--conversation-left, 42vw);
  display: flex;
  flex-direction: column;
  width: var(--conversation-width, 336px);
  max-height: var(--conversation-height, 420px);
  min-height: 0;
  pointer-events: auto;
}
.conversation.is-preparing-turn {
  visibility: hidden;
  pointer-events: none;
}
.conversation.is-preparing-turn .chat-message {
  transition: none !important;
}
.conversation-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding-left: 4px;
}
.conversation-caption { margin: 0; color: var(--muted); font-size: 11px; line-height: 16px; }
.conversation-actions { display: flex; flex: 0 0 auto; }
.conversation-actions .icon-button { border-radius: 50%; }
.conversation-actions .icon-button:hover { background: rgba(241, 234, 222, 0.5); }
.conversation-scroll {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 4px 14px 10px 2px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  overflow-anchor: none;
  scrollbar-width: thin;
  scrollbar-color: rgba(98, 88, 76, 0.35) transparent;
}
.conversation-scroll::-webkit-scrollbar { width: 5px; }
.conversation-scroll::-webkit-scrollbar-track { background: transparent; }
.conversation-scroll::-webkit-scrollbar-thumb { border-radius: 5px; background: rgba(98, 88, 76, 0.35); }
.conversation-scroll:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 12px; }
.chat-message { position: relative; flex: 0 0 auto; max-width: 100%; overflow-wrap: anywhere; }
.chat-message p { margin: 0; white-space: pre-wrap; }
.chat-message--user {
  align-self: flex-end;
  max-width: 88%;
  padding: 8px 12px;
  border-radius: 14px 14px 4px 14px;
  background: rgba(241, 234, 222, 0.46);
  color: var(--ink);
  font-size: 12px;
  line-height: 1.5;
}
.chat-message--assistant {
  align-self: flex-start;
  padding: 16px 18px;
  border: 1px solid rgba(185, 170, 152, 0.75);
  border-radius: 18px 18px 4px 18px;
  background: rgba(241, 234, 222, 0.97);
  color: var(--ink);
  font-size: 14px;
  line-height: 1.6;
  box-shadow: 0 4px 14px rgba(41, 39, 34, 0.045);
}
[data-chat-mode="portrait"] .chat-message--assistant { align-self: flex-end; }
[data-chat-mode="portrait"] .chat-message--user {
  align-self: flex-start;
  border-radius: 14px 14px 14px 4px;
}
[data-chat-mode="portrait"] .chat-message--assistant.is-latest::after {
  content: '';
  position: absolute;
  top: 24px;
  right: -7px;
  width: 12px;
  height: 12px;
  transform: rotate(-45deg);
  border-right: 1px solid rgba(185, 170, 152, 0.75);
  border-bottom: 1px solid rgba(185, 170, 152, 0.75);
  border-radius: 0 0 3px 0;
  background: var(--panel);
}
.chat-message--thinking { min-width: 106px; color: var(--muted); }
.latest-reply {
  display: inline-grid;
  position: relative;
  place-items: center;
  align-self: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  min-height: 34px;
  padding: 0;
  border: 1px solid rgba(185, 170, 152, 0.58);
  border-radius: 50%;
  background: rgba(241, 234, 222, 0.78);
  color: var(--muted);
  transition: color 160ms ease, border-color 160ms ease, background-color 160ms ease;
}
.latest-reply::before { content: ''; position: absolute; inset: -5px; border-radius: 50%; }
.latest-reply svg { width: 15px; height: 15px; }
.latest-reply:hover { border-color: var(--line); background: var(--panel); color: var(--ink); }
[data-chat-mode="docked"] .conversation {
  top: auto;
  bottom: var(--conversation-bottom, 80px);
  overflow: hidden;
  border: 1px solid rgba(185, 170, 152, 0.9);
  border-radius: 20px;
  background: rgba(241, 234, 222, 0.97);
}
[data-chat-mode="docked"] .conversation-header { padding: 0 4px 0 16px; border-bottom: 1px solid rgba(185, 170, 152, 0.5); }
[data-chat-mode="docked"].is-reading .conversation { height: var(--conversation-height); }
[data-chat-mode="docked"] .conversation-scroll { gap: 12px; padding: 14px 16px; }
[data-chat-mode="docked"] .chat-message--assistant { padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
[data-chat-mode="docked"] .chat-message--user { background: var(--paper); }
[data-chat-mode="docked"] .latest-reply {
  position: absolute;
  z-index: 3;
  top: 5px;
  bottom: auto;
  left: 50%;
  margin: 0;
  transform: translateX(-50%);
  box-shadow: none;
}
[data-chat-mode="docked"] .conversation-scroll { touch-action: pan-y; }
.quiet-ui.is-chat-reading .quiet-stack { visibility: hidden; }
.capabilities { margin-top: 14px; border-top: 1px solid var(--line); }
.capability-row { display: grid; grid-template-columns: 72px 1fr; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(185, 170, 152, 0.45); font-size: 12px; line-height: 1.5; }
.capability-row strong { font-weight: 500; }
.capability-row span { color: var(--muted); }
@keyframes reply-arrive { from { opacity: 0; transform: translate(10px, 4px) scale(0.98); } to { opacity: 1; transform: none; } }
.response-arrive { transform-origin: right top; animation: reply-arrive 280ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@media (max-width: 639px) {
  .bottom-composer { min-height: 54px; padding: 4px 4px 4px 16px; }
  .bottom-composer input { font-size: 16px; }
  .chat-message--assistant { font-size: 14px; line-height: 1.55; }
}

.prompt-suggestions {
  position: absolute;
  bottom: calc(100% + 10px);
  left: -3px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: calc(100% + 6px);
  padding: 4px 3px;
}
.prompt-chip {
  flex: 0 0 auto;
  min-height: 44px;
  max-width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(185, 170, 152, 0.72);
  border-radius: 22px;
  background: rgba(241, 234, 222, 0.86);
  color: var(--ink);
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  transition: background-color 180ms ease, transform 180ms ease;
}
.prompt-chip:hover:not(:disabled) {
  background: var(--panel);
  transform: translateY(-2px);
}
.prompt-chip:disabled { opacity: 0.55; cursor: default; }
.message-links { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 8px; }
.message-links a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  color: var(--ink);
  font-size: 13px;
  text-decoration: underline;
  text-decoration-color: var(--line);
  text-underline-offset: 4px;
}
.message-links a:hover { color: var(--focus); }
.message-links svg { font-size: 14px; }
.chat-experience.is-short-viewport .prompt-suggestions {
  flex-wrap: nowrap;
  justify-content: flex-start;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(98, 88, 76, 0.35) transparent;
}
@media (max-width: 639px) {
  .prompt-suggestions {
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(98, 88, 76, 0.35) transparent;
  }
}

.chat-message-body { display: contents; }
#conversation-spacer { display: none; }

[data-chat-mode="portrait"] .conversation { height: var(--conversation-height); }

[data-chat-mode="portrait"] #conversation-spacer:not([hidden]) {
  display: block;
  flex: 0 0 auto;
  width: 1px;
  min-height: 0;
  pointer-events: none;
}
[data-chat-mode="portrait"] .conversation-scroll {
  /* Fixed descendants escape this native scroller's clip. Do not add a mask,
     transform, filter, or containment to it or the conversation ancestors. */
  -webkit-mask-image: none;
  mask-image: none;
}
[data-chat-mode="portrait"] .chat-message {
  position: fixed;
  z-index: 1;
  top: var(--whole-bubble-y, -200vh);
  left: var(--whole-bubble-x, -200vw);
  width: max-content;
  max-width: var(--whole-bubble-max-width, 300px);
  opacity: var(--whole-bubble-opacity, 0);
}
[data-chat-mode="portrait"] .chat-message[data-whole-bubble-hidden="true"] {
  pointer-events: none;
}
[data-chat-mode="portrait"] .conversation-header,
[data-chat-mode="portrait"] .latest-reply {
  position: relative;
  z-index: 2;
}
[data-chat-mode="portrait"] .conversation-header {
  justify-content: flex-end;
  gap: 8px;
  transform: translateX(calc(-100% - 16px));
}
[data-chat-mode="portrait"] .latest-reply {
  /* Showing this control must not move a bubble being read or scrolled. */
  position: absolute;
  right: calc(100% + 16px);
  bottom: 0;
  white-space: nowrap;
}
[data-chat-mode="portrait"] .chat-message-body {
  display: block;
  min-width: 0;
  max-height: var(--whole-bubble-body-height, none);
  overflow-y: auto;
  overscroll-behavior-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(98, 88, 76, 0.35) transparent;
}
[data-chat-mode="portrait"] .chat-message-body::-webkit-scrollbar { width: 5px; }
[data-chat-mode="portrait"] .chat-message-body::-webkit-scrollbar-track { background: transparent; }
[data-chat-mode="portrait"] .chat-message-body::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: rgba(98, 88, 76, 0.35);
}
[data-chat-mode="portrait"] .chat-message-body:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: -2px;
  border-radius: 4px;
}
/* The existing arrival animation must not retain opacity: 1 and override the
   scroll-driven opacity. Retain only its gentle movement on desktop. */
@keyframes whole-bubble-arrive {
  from { transform: translate(10px, 4px) scale(0.98); }
  to { transform: none; }
}
[data-chat-mode="portrait"] .response-arrive { animation-name: whole-bubble-arrive; }

.conversation-scroll { --conversation-turn-gap: 32px; }
[data-chat-mode="docked"] .chat-message + .chat-message--user {
  margin-top: calc(var(--conversation-turn-gap) - 12px);
}
[data-chat-mode="portrait"] .chat-message {
  transition: opacity 180ms ease;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}

</style>
