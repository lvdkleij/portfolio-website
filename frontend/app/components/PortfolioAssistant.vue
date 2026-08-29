<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'

type ChatRole = 'assistant' | 'user'

interface ChatMessage {
  id: number
  role: ChatRole
  text: string
}

const responses = {
  asterra: 'Asterra is a fictional banking-assistant demo Lucas built while exploring AI interaction patterns. It is an experiment, not client work.',
  work: 'Lucas is still putting together his selected-work section and will add projects when there is something worth sharing.',
  approach: 'Lucas is backend-first and architecture-minded. He focuses on clear boundaries, dependable services, pragmatic technical decisions, and a coherent product around them.',
  capabilities: 'Lucas’s strongest experience is backend engineering and software architecture. He also has frontend experience and is currently expanding into applied AI.',
  responsible: 'As Lucas gets further into AI, he is interested in systems that are transparent, respect user control, and use automation only where it adds real value.',
  contact: 'You can connect with Lucas through LinkedIn or view his work on GitHub using the links in the contact section.',
  fallback: 'I can tell you about Lucas’s backend and architecture experience, his approach, frontend background, AI journey, selected-work plans, or contact links.'
} as const

const expanded = ref(true)
const draft = ref('')
const thinking = ref(false)
const messages = ref<ChatMessage[]>([
  { id: 1, role: 'assistant', text: "Hello, I’m Lucas’ AI assistant. Ask me something." }
])
const nextMessageId = ref(2)
const input = ref<HTMLInputElement | null>(null)
const launcher = ref<HTMLButtonElement | null>(null)
const transcript = ref<HTMLElement | null>(null)
let responseTimer: ReturnType<typeof setTimeout> | undefined

function responseFor(question: string): string {
  const normalized = question.toLocaleLowerCase()

  if (/asterra|bank|banking/.test(normalized)) return responses.asterra
  if (/responsible|trust|permission|transparent|human handoff|safe|ethic/.test(normalized)) return responses.responsible
  if (/contact|email|linkedin|github|hire|collaborat|reach/.test(normalized)) return responses.contact
  if (/background|backend|architecture|capabilit|skill|technical|technology|tech stack|full.?stack|azure|cloud|infrastructure|engineer/.test(normalized)) return responses.capabilities
  if (/approach|process|how (does|do|lucas)|method|work style|product thinking/.test(normalized)) return responses.approach
  if (/work|project|portfolio|case stud|experience|build/.test(normalized)) return responses.work

  return responses.fallback
}

async function scrollToLatest() {
  await nextTick()
  if (transcript.value) transcript.value.scrollTop = transcript.value.scrollHeight
}

function ask(question = draft.value) {
  const trimmedQuestion = question.trim()
  if (!trimmedQuestion || thinking.value) return

  messages.value.push({ id: nextMessageId.value++, role: 'user', text: trimmedQuestion })
  draft.value = ''
  thinking.value = true
  void scrollToLatest()

  responseTimer = setTimeout(() => {
    messages.value.push({
      id: nextMessageId.value++,
      role: 'assistant',
      text: responseFor(trimmedQuestion)
    })
    thinking.value = false
    responseTimer = undefined
    void scrollToLatest()
  }, 550)
}

async function minimizeAssistant() {
  expanded.value = false
  await nextTick()
  launcher.value?.focus()
}

async function openAssistant() {
  expanded.value = true
  await nextTick()
  input.value?.focus()
}

onBeforeUnmount(() => {
  if (responseTimer) clearTimeout(responseTimer)
})
</script>

<template>
  <aside class="portfolio-assistant" aria-label="Lucas AI assistant">
    <section
      v-show="expanded"
      id="portfolio-assistant-card"
      class="portfolio-assistant__card portfolio-assistant__enter"
      aria-label="Chat with Lucas AI assistant"
      @keydown.esc="minimizeAssistant"
    >
      <header class="portfolio-assistant__header">
        <img
          class="portfolio-assistant__avatar"
          src="/images/lucas-portrait.png"
          alt=""
          aria-hidden="true"
        >
        <div class="portfolio-assistant__identity">
          <h2>Lucas AI assistant</h2>
          <p><span aria-hidden="true" /> Available</p>
        </div>
        <button
          type="button"
          class="portfolio-assistant__minimize"
          aria-label="Minimize Lucas AI assistant"
          aria-controls="portfolio-assistant-card"
          :aria-expanded="expanded"
          @click="minimizeAssistant"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
      </header>

      <div ref="transcript" class="portfolio-assistant__transcript" role="log" aria-live="polite" aria-relevant="additions">
        <div
          v-for="message in messages"
          :key="message.id"
          class="portfolio-assistant__message"
          :class="`portfolio-assistant__message--${message.role}`"
        >
          {{ message.text }}
        </div>
        <div v-if="thinking" class="portfolio-assistant__thinking" role="status">
          <span class="sr-only">Lucas AI assistant is thinking</span>
          <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
        </div>
      </div>

      <div v-if="messages.length === 1" class="portfolio-assistant__suggestions" aria-label="Suggested questions">
        <button type="button" :disabled="thinking" @click="ask('Tell me about Lucas’s background')">Lucas’s background</button>
        <button type="button" :disabled="thinking" @click="ask('How does Lucas work?')">How Lucas works</button>
      </div>

      <form class="portfolio-assistant__composer" aria-label="Ask Lucas AI assistant" @submit.prevent="ask()">
        <label for="portfolio-assistant-input" class="sr-only">Ask me anything</label>
        <input
          id="portfolio-assistant-input"
          ref="input"
          v-model="draft"
          type="text"
          autocomplete="off"
          placeholder="Ask me anything…"
          :disabled="thinking"
        >
        <button type="submit" aria-label="Send message" :disabled="!draft.trim() || thinking">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
        </button>
      </form>
      <p class="portfolio-assistant__note">Local prototype · no messages are sent</p>
    </section>

    <button
      v-show="!expanded"
      ref="launcher"
      type="button"
      class="portfolio-assistant__launcher"
      aria-label="Open Lucas AI assistant"
      aria-controls="portfolio-assistant-card"
      :aria-expanded="expanded"
      @click="openAssistant"
    >
      <span>AI Chat</span>
      <i aria-hidden="true" />
    </button>
  </aside>
</template>
