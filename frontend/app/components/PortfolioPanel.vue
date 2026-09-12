<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useChatStream } from '~/composables/useChatStream'
import { renderSafeMarkdown } from '~/utils/markdown'

const sections = ['About', 'Work', 'Contact', 'Chat'] as const
type Section = typeof sections[number]
const active = ref<Section | null>(null)
const panel = ref<HTMLElement | null>(null)
let trigger: HTMLButtonElement | null = null
const draft = ref('')
const transcript = ref<HTMLElement | null>(null)
const messages = ref<{ id: number; role: 'user' | 'assistant'; text: string; error?: string }[]>([])
const announcement = ref('')
const following = ref(true)
const { active: thinking, responseText, error, start, dispose } = useChatStream({ endpoint: '/api/v1/lucasai/stream' })
let replyId: number | undefined
let nextId = 1

async function followLatest() {
  await nextTick()
  if (following.value && transcript.value) transcript.value.scrollTop = transcript.value.scrollHeight
}
function onScroll() {
  const element = transcript.value
  if (element) following.value = element.scrollHeight - element.scrollTop - element.clientHeight < 32
}
watch(responseText, text => {
  const reply = messages.value.find(message => message.id === replyId)
  if (reply) reply.text = text
  void followLatest()
}, { flush: 'sync' })

async function send() {
  const text = draft.value.trim()
  if (!text || text.length > 2000 || thinking.value) return
  draft.value = ''
  announcement.value = ''
  const user = { id: nextId++, role: 'user' as const, text }
  const reply = { id: nextId++, role: 'assistant' as const, text: '' }
  replyId = reply.id
  messages.value.push(user, reply)
  following.value = true
  void followLatest()
  await start({ clientRequestId: `portfolio-${Date.now()}-${user.id}`, messages: [{ id: String(user.id), role: 'user', content: text }] })
  const saved = messages.value.find(message => message.id === reply.id)
  if (saved) {
    saved.error = error.value?.message
    announcement.value = saved.error || saved.text
  }
  replyId = undefined
  void followLatest()
}

async function close() {
  active.value = null
  await nextTick()
  trigger?.focus({ preventScroll: true })
}

async function select(section: Section, event: MouseEvent) {
  trigger = event.currentTarget as HTMLButtonElement
  if (active.value === section) return close()
  active.value = section
  await nextTick()
  panel.value?.scrollTo?.({ top: 0 })
  panel.value?.focus({ preventScroll: true })
  if (section === 'Chat') {
    following.value = true
    void followLatest()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && active.value) {
    event.preventDefault()
    void close()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  dispose()
})
</script>

<template>
  <div class="portfolio-overlay">
    <header class="portfolio-identity">
      <h1>Lucas van der Kleij</h1>
      <p>Software engineer</p>
    </header>

    <Transition name="panel">
      <section
        v-if="active"
        id="portfolio-panel"
        ref="panel"
        class="portfolio-panel"
        :class="{ 'portfolio-panel--chat': active === 'Chat' }"
        role="region"
        aria-labelledby="portfolio-panel-title"
        tabindex="-1"
      >
        <div class="portfolio-panel__header">
          <h2 id="portfolio-panel-title">{{ active }}</h2>
          <button class="portfolio-close" type="button" aria-label="Close panel" @click="close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div v-if="active === 'About'" class="portfolio-copy">
          <p>I’m Lucas, a software engineer with experience building software in financial services.</p>
          <p>My focus is backend development and architecture. I also work on the frontend and enjoy exploring what AI can bring to the things I build.</p>
        </div>
        <div v-else-if="active === 'Work'" class="portfolio-copy">
          <p>I build and maintain backend systems, working with Java, Kotlin, and Spring Boot.</p>
          <p>My work spans architecture, cloud infrastructure on Azure, CI/CD, testing, and observability. On the frontend, I’ve worked with Angular and Nuxt.</p>
          <a class="portfolio-link" href="https://github.com/lvdkleij" target="_blank" rel="noopener noreferrer">Explore my GitHub <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>
        </div>
        <div v-else-if="active === 'Contact'" class="portfolio-copy">
          <p>Want to get in touch? You can find me here.</p>
          <div class="portfolio-contact">
            <a class="portfolio-link" href="https://www.linkedin.com/in/lucas-van-der-kleij" target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>
            <a class="portfolio-link" href="https://github.com/lvdkleij" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>
          </div>
        </div>
        <div v-else class="panel-chat">
          <p class="chat-caption">AI-generated replies in my voice.</p>
          <div ref="transcript" class="chat-transcript" role="log" aria-label="Conversation" aria-live="off" tabindex="0" @scroll="onScroll">
            <p v-if="!messages.length" class="chat-empty">Ask me about my work, background, or what I’m building.</p>
            <article v-for="message in messages" :key="message.id" class="panel-message" :class="{ 'panel-message--user': message.role === 'user' }" :aria-label="message.role === 'user' ? 'Your message' : 'AI reply'">
              <p v-if="message.role === 'user'">{{ message.text }}</p>
              <div v-else-if="message.text" class="chat-markdown" v-html="renderSafeMarkdown(message.text)" />
              <p v-else-if="thinking && message.id === replyId" class="chat-caption">Thinking…</p>
              <p v-if="message.error" class="chat-error">{{ message.error }}</p>
            </article>
          </div>
          <button v-if="!following && messages.length" class="chat-latest" type="button" @click="following = true; followLatest()">Latest reply ↓</button>
          <form class="panel-composer" aria-label="Chat" @submit.prevent="send">
            <label class="sr-only" for="panel-chat-input">Your message</label>
            <input id="panel-chat-input" v-model="draft" placeholder="Ask me anything…" maxlength="2000" autocomplete="off" aria-describedby="panel-chat-note">
            <button type="submit" aria-label="Send message" :disabled="!draft.trim() || thinking">↑</button>
          </form>
          <p id="panel-chat-note" class="chat-caption chat-note">Conversation memory isn’t available yet.</p>
        </div>
      </section>
    </Transition>

    <nav class="portfolio-navigation" aria-label="Portfolio">
      <button
        v-for="section in sections"
        :key="section"
        type="button"
        :class="{ 'is-active': active === section }"
        :aria-expanded="active === section"
        :aria-controls="active ? 'portfolio-panel' : undefined"
        @click="select(section, $event)"
      >{{ section }}</button>
    </nav>
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
  </div>
</template>

<style scoped>
.portfolio-overlay {
  --ink: #292722;
  --muted: #62584c;
  --content-left: clamp(24px, 6vw, 96px);
  position: absolute;
  inset: var(--frame-top) var(--frame-right) var(--frame-bottom) var(--frame-left);
  color: var(--ink);
  font-family: Inter, sans-serif;
  pointer-events: none;
}
.portfolio-identity {
  position: absolute;
  top: clamp(56px, 13vh, 112px);
  left: var(--content-left);
  pointer-events: auto;
}
.portfolio-identity h1 {
  margin: 0;
  font: 400 clamp(40px, 2.75vw, 44px)/1.08 Newsreader, serif;
  letter-spacing: -0.025em;
}
.portfolio-identity p { margin: 8px 0 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
.portfolio-panel {
  position: absolute;
  top: clamp(170px, 27vh, 228px);
  left: var(--content-left);
  width: min(380px, 34vw);
  max-height: calc(100% - clamp(170px, 27vh, 228px) - 104px);
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 24px 28px 28px;
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 16px;
  background: rgb(244 239 230 / 95%);
  box-shadow: 0 8px 32px rgb(52 39 25 / 4%);
  pointer-events: auto;
  scrollbar-width: thin;
}
.portfolio-panel:focus { outline: none; }
.portfolio-panel--chat { display: flex; flex-direction: column; height: 440px; overflow: hidden; }
.portfolio-panel--chat .portfolio-panel__header { flex-shrink: 0; margin-bottom: 8px; }
.panel-chat { display: flex; flex-direction: column; min-height: 0; flex: 1; }
.chat-caption { margin: 0; color: var(--muted); font-size: 11px; line-height: 1.5; }
.chat-transcript { flex: 1; min-height: 32px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; margin: 16px 0; font-size: 14px; line-height: 1.65; overflow-wrap: anywhere; }
.chat-empty { margin: 0; color: var(--muted); }
.panel-message { margin: 0 0 20px; }
.panel-message p { margin: 0; white-space: pre-wrap; }
.panel-message--user { margin-left: 20px; padding: 8px 12px; border-radius: 10px; background: rgb(98 88 76 / 8%); }
.chat-markdown :deep(p) { margin: 0 0 10px; }
.chat-markdown :deep(ul), .chat-markdown :deep(ol) { padding-left: 20px; }
.chat-markdown :deep(a) { color: inherit; text-decoration: underline; }
.chat-markdown :deep(pre) { overflow-x: auto; max-width: 100%; font-size: 12px; }
.chat-markdown :deep(h1), .chat-markdown :deep(h2), .chat-markdown :deep(h3) { font: inherit; font-weight: 600; }
.panel-composer { display: flex; align-items: center; gap: 8px; flex-shrink: 0; border-bottom: 1px solid #b3a798; }
.panel-composer input { width: 100%; min-width: 0; padding: 12px 0; background: none; border: 0; color: var(--ink); font: 400 16px/1.5 Inter, sans-serif; }
.panel-composer button { width: 44px; height: 44px; flex-shrink: 0; border: 0; background: none; color: var(--ink); font-size: 24px; cursor: pointer; }
.panel-composer button:disabled { opacity: 0.35; cursor: default; }
.panel-composer input:focus-visible, .chat-transcript:focus-visible { outline: 2px solid #6b482f; outline-offset: 2px; }
.chat-note { margin-top: 8px; font-size: 10px; }
.chat-error { color: #8b342f; }
.chat-latest { align-self: center; background: none; border: 0; padding: 8px; color: var(--muted); cursor: pointer; }
.portfolio-panel__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.portfolio-panel h2 { margin: 0; font: 400 30px/1.2 Newsreader, serif; letter-spacing: -0.02em; }
.portfolio-close { display: grid; place-items: center; width: 44px; height: 44px; margin: -8px -12px -8px 0; padding: 0; border: 0; background: none; color: var(--muted); cursor: pointer; }
.portfolio-copy { font-size: 15px; line-height: 1.7; }
.portfolio-copy p { margin: 0 0 16px; }
.portfolio-copy > :last-child { margin-bottom: 0; }
.portfolio-contact { display: flex; flex-wrap: wrap; gap: 24px; }
.portfolio-link { color: inherit; text-decoration: underline; text-decoration-color: #b3a798; text-underline-offset: 5px; }
.portfolio-link span[aria-hidden] { margin-left: 4px; }
.portfolio-navigation {
  position: absolute;
  bottom: max(22px, env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: clamp(16px, 3.2vw, 48px);
  pointer-events: auto;
}
.portfolio-navigation button {
  position: relative;
  min-height: 44px;
  padding: 8px 4px;
  border: 0;
  background: none;
  color: var(--ink);
  font: 400 16px/1.5 Inter, sans-serif;
  cursor: pointer;
}
.portfolio-navigation button::after {
  content: '';
  position: absolute;
  right: 4px;
  bottom: 5px;
  left: 4px;
  height: 1px;
  background: currentColor;
  opacity: 0;
  transition: opacity 160ms ease;
}
.portfolio-navigation button:hover::after, .portfolio-navigation .is-active::after { opacity: 0.65; }
button:focus-visible, a:focus-visible { outline: 2px solid #6b482f; outline-offset: 4px; border-radius: 2px; }
.panel-enter-active, .panel-leave-active { transition: opacity 160ms ease; }
.panel-enter-from, .panel-leave-to { opacity: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 767px) {
  .portfolio-overlay { inset: 0; height: 100dvh; }
  .portfolio-identity { top: calc(76px + env(safe-area-inset-top, 0px)); left: 24px; right: 24px; }
  .portfolio-identity h1 { font-size: 32px; }
  .portfolio-panel { top: auto; bottom: calc(92px + env(safe-area-inset-bottom, 0px)); left: 24px; width: calc(100% - 48px); max-height: calc(100% - 270px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); padding: 20px 24px 24px; }
  .portfolio-navigation { bottom: calc(20px + env(safe-area-inset-bottom, 0px)); }
}
@media (max-height: 600px) and (min-width: 768px) {
  .portfolio-identity { top: 24px; }
  .portfolio-identity h1 { font-size: 30px; }
  .portfolio-panel { top: 106px; max-height: calc(100% - 180px); padding: 16px 24px 20px; }
  .portfolio-navigation { bottom: 12px; }
}
@media (max-height: 480px) and (max-width: 767px) {
  .portfolio-identity { top: 64px; }
  .portfolio-identity h1 { font-size: 26px; }
  .portfolio-panel { bottom: 72px; max-height: calc(100% - 210px); }
  .portfolio-navigation { bottom: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .panel-enter-active, .panel-leave-active, .portfolio-navigation button::after { transition: none; }
}
</style>
