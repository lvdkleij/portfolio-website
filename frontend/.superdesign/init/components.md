# Components

Framework: Vue 3 single-file components via Nuxt 4. The repository has no third-party component library and no separate primitive library; these are the shared interaction components with reusable UI behavior.

## ConversationTurn

- Path: `frontend/app/components/ConversationTurn.vue`
- Description: Reusable chat-turn wrapper with user prompt and assistant-answer slots.

```vue
<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <section class="turn">
    <div class="question"><small>{{ label }}</small><p class="question-bubble"><slot name="prompt" /></p></div>
    <div class="answer">
      <div class="answer-label"><span>LUCAS / AI</span></div>
      <div class="answer-body"><slot name="answer" /></div>
    </div>
  </section>
</template>
```

## PromptTrace

- Path: `frontend/app/components/PromptTrace.vue`
- Description: Expandable request-status and execution-metadata disclosure used below assistant responses.

```vue
<script setup lang="ts">
import type { ChatState, ChatTraceStage, ChatUsage } from '~/types/chat'

const props = withDefaults(defineProps<{
  state: ChatState
  steps?: ChatTraceStage[]
  durationMs?: number
  sourceCount?: number
  usage?: ChatUsage
}>(), {
  steps: () => []
})

const traceId = useId()
const open = ref(false)
const completeCount = computed(() => props.steps.filter(step => step.state === 'complete').length)
const hasDetails = computed(() => props.steps.length > 0)

const summary = computed(() => {
  if (props.state === 'connecting') return props.steps.length
    ? `Processing request · ${completeCount.value} / ${props.steps.length}`
    : 'Connecting to assistant'
  if (props.state === 'streaming') return props.steps.length
    ? `Response streaming · ${completeCount.value} / ${props.steps.length} stages`
    : 'Response streaming'
  if (props.state === 'error') return 'Request interrupted'
  if (props.state === 'cancelled') return 'Response stopped'

  const parts = ['Request complete']
  if (props.durationMs !== undefined) parts.push(formatDuration(props.durationMs))
  if (props.steps.length) parts.push(`${props.steps.length} stages`)
  return parts.join(' · ')
})

const disclosure = computed(() => {
  const parts = ['Server-reported execution metadata—not private model reasoning.']
  if (props.sourceCount) parts.push(`${props.sourceCount} source${props.sourceCount === 1 ? '' : 's'} reported.`)
  if (props.usage?.inputTokens !== undefined || props.usage?.outputTokens !== undefined) {
    parts.push(`Usage: ${props.usage.inputTokens ?? '—'} input / ${props.usage.outputTokens ?? '—'} output tokens.`)
  }
  return parts.join(' ')
})

function formatDuration(duration: number) {
  return duration >= 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`
}
</script>

<template>
  <section class="prompt-trace" :class="{ open, live: state === 'connecting' || state === 'streaming' }">
    <button
      class="trace-toggle"
      type="button"
      :aria-expanded="hasDetails ? open : undefined"
      :aria-controls="hasDetails ? traceId : undefined"
      :disabled="!hasDetails"
      @click="hasDetails && (open = !open)"
    >
      <span class="trace-activity" aria-hidden="true"><i /><i /><i /></span>
      <span class="trace-summary" aria-live="polite">{{ summary }}</span>
      <span v-if="hasDetails" class="trace-chevron" aria-hidden="true">⌄</span>
    </button>

    <Transition name="trace-panel">
      <div v-if="open && hasDetails" :id="traceId" class="trace-panel">
        <ol class="trace-list">
          <li
            v-for="step in steps"
            :key="step.id"
            class="trace-step"
            :class="[`is-${step.state}`, step.kind === 'tool' ? 'tone-clay' : 'tone-blue']"
          >
            <span class="trace-node" aria-hidden="true">{{ step.state === 'complete' ? '✓' : step.code || '··' }}</span>
            <div class="trace-step-copy">
              <div class="trace-step-heading">
                <strong>{{ step.label }}</strong>
                <span>{{ step.state === 'active' ? 'Running…' : step.result || step.state }}</span>
              </div>
              <p v-if="step.detail">{{ step.detail }}</p>
            </div>
          </li>
        </ol>
        <p class="trace-disclosure"><span aria-hidden="true">ⓘ</span> {{ disclosure }}</p>
      </div>
    </Transition>
  </section>
</template>
```

## JobAttachmentSheet

- Path: `frontend/app/components/JobAttachmentSheet.vue`
- Description: Reusable add-context menu and pasted job-description form.

```vue
<script setup lang="ts">
import type { JobAttachment } from '~/types/chat'

type AddView = 'menu' | 'paste'

const emit = defineEmits<{
  attach: [attachment: JobAttachment]
  close: []
}>()

const view = ref<AddView>('menu')
const pastedText = ref('')
const error = ref('')
const firstMenuItem = ref<HTMLButtonElement>()
const pasteInput = ref<HTMLTextAreaElement>()
const titleId = useId()

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `job-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function showPaste() {
  view.value = 'paste'
  error.value = ''
  nextTick(() => pasteInput.value?.focus())
}

function showMenu() {
  view.value = 'menu'
  error.value = ''
  nextTick(() => firstMenuItem.value?.focus())
}

function attachRole() {
  error.value = ''
  const text = pastedText.value.trim()
  if (!text) {
    error.value = 'Paste a job description before attaching it.'
    pasteInput.value?.focus()
    return
  }

  const firstLine = text.split('\n').find(line => line.trim())?.trim() ?? 'Pasted job description'
  emit('attach', {
    id: createId(),
    source: 'paste',
    label: firstLine.length > 72 ? `${firstLine.slice(0, 69)}…` : firstLine,
    textExcerpt: text.slice(0, 4000)
  })
}

onMounted(() => nextTick(() => firstMenuItem.value?.focus()))
</script>

<template>
  <section
    id="job-context-sheet"
    class="job-context-sheet simple-add"
    role="dialog"
    aria-modal="false"
    :aria-labelledby="titleId"
    @keydown.esc.stop="$emit('close')"
  >
    <template v-if="view === 'menu'">
      <header class="add-menu-header">
        <h3 :id="titleId">Add</h3>
        <button type="button" aria-label="Close add menu" @click="$emit('close')">×</button>
      </header>
      <div class="add-menu-list" role="menu" aria-label="Add job context">
        <button ref="firstMenuItem" type="button" role="menuitem" @click="showPaste">
          <span class="add-menu-icon" aria-hidden="true">¶</span>
          <span><strong>Paste job description</strong><small>Up to 4,000 characters</small></span>
        </button>
        <button type="button" role="menuitem" disabled aria-disabled="true" title="File support is coming later">
          <span class="add-menu-icon" aria-hidden="true">↥</span>
          <span><strong>Upload a file</strong><small>Coming later</small></span>
        </button>
        <button type="button" role="menuitem" disabled aria-disabled="true" title="Link support is coming later">
          <span class="add-menu-icon" aria-hidden="true">↗</span>
          <span><strong>Add job-posting link</strong><small>Coming later</small></span>
        </button>
      </div>
    </template>

    <template v-else>
      <header class="add-editor-header">
        <button type="button" aria-label="Back to add menu" @click="showMenu">←</button>
        <h3 :id="titleId">Paste job description</h3>
        <button type="button" aria-label="Close add menu" @click="$emit('close')">×</button>
      </header>

      <div class="job-sheet-panel">
        <label for="job-description">Job description</label>
        <textarea
          id="job-description"
          ref="pasteInput"
          v-model="pastedText"
          rows="4"
          maxlength="4000"
          placeholder="Paste the role description…"
          @input="error = ''"
        />
      </div>

      <p v-if="error" class="job-sheet-error" role="alert">{{ error }}</p>
      <footer class="job-sheet-footer compact">
        <p>Sent with the chat request · not saved by this site</p>
        <button class="attach-role" type="button" @click="attachRole">Attach</button>
      </footer>
    </template>
  </section>
</template>
```

## StudioComposer

- Path: `frontend/app/components/StudioComposer.vue`
- Description: Reusable multiline chat composer with attachment, privacy, voice, send, and stop states.

```vue
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ChatState, ChatSubmission, JobAttachment } from '~/types/chat'
import { MAX_CHAT_PROMPT_LENGTH } from '~/utils/chatLimits'

const props = withDefaults(defineProps<{ state?: ChatState }>(), { state: 'idle' })

const prompt = ref('')
const listening = ref(false)
const input = ref<HTMLTextAreaElement>()
const dock = ref<HTMLElement>()
const privacyControl = ref<HTMLElement>()
const privacyButton = ref<HTMLButtonElement>()
const sheetOpen = ref(false)
const privacyOpen = ref(false)
const attachment = ref<JobAttachment>()
const emit = defineEmits<{ send: [submission: ChatSubmission], stop: [] }>()
const active = computed(() => props.state === 'connecting' || props.state === 'streaming')
const nearPromptLimit = computed(() => prompt.value.length >= MAX_CHAT_PROMPT_LENGTH - 50)
function resize() { if (input.value) { input.value.style.height = 'auto'; input.value.style.height = `${Math.min(input.value.scrollHeight, 180)}px` } }
function handleInput() {
  if (prompt.value.length > MAX_CHAT_PROMPT_LENGTH) {
    prompt.value = prompt.value.slice(0, MAX_CHAT_PROMPT_LENGTH)
  }
  nextTick(resize)
}
function submit() {
  const value = prompt.value.slice(0, MAX_CHAT_PROMPT_LENGTH).trim()
  if (!value || active.value) return
  emit('send', {
    prompt: value,
    attachment: attachment.value ? { ...attachment.value } : undefined
  })
  prompt.value = ''
  attachment.value = undefined
  sheetOpen.value = false
  privacyOpen.value = false
  nextTick(resize)
}
function toggleSheet() {
  if (active.value) return
  privacyOpen.value = false
  sheetOpen.value = !sheetOpen.value
}
function togglePrivacy() {
  sheetOpen.value = false
  privacyOpen.value = !privacyOpen.value
}
function attachRole(nextAttachment: JobAttachment) {
  attachment.value = nextAttachment
  sheetOpen.value = false
  privacyOpen.value = false
  if (!prompt.value.trim()) prompt.value = 'Compare my résumé with this role'
  nextTick(() => {
    resize()
    input.value?.focus()
  })
}
function removeAttachment() {
  attachment.value = undefined
  input.value?.focus()
}
function startListening() {
  if (active.value) return
  sheetOpen.value = false
  privacyOpen.value = false
  listening.value = true
}
function handleOutsideClick(event: PointerEvent) {
  const target = event.target as Node
  if (sheetOpen.value && !dock.value?.contains(target)) sheetOpen.value = false
  if (privacyOpen.value && !privacyControl.value?.contains(target)) privacyOpen.value = false
}
function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (privacyOpen.value) {
    privacyOpen.value = false
    nextTick(() => privacyButton.value?.focus())
  } else if (sheetOpen.value) {
    sheetOpen.value = false
    input.value?.focus()
  }
}
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    submit()
  }
}
onMounted(() => {
  document.addEventListener('pointerdown', handleOutsideClick)
  document.addEventListener('keydown', handleDocumentKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsideClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<template>
  <div ref="dock" class="composer-dock" :class="{ 'has-sheet': sheetOpen }">
    <Transition name="job-sheet">
      <div v-if="sheetOpen" class="job-sheet-anchor">
        <JobAttachmentSheet @attach="attachRole" @close="sheetOpen = false" />
      </div>
    </Transition>
    <div class="composer">
      <template v-if="!listening">
        <label class="sr-only" for="prompt">Ask Lucas anything</label>
        <div v-if="attachment" class="composer-attachment">
          <span aria-hidden="true">{{ attachment.source === 'file' ? 'DOC' : attachment.source === 'link' ? 'URL' : 'TXT' }}</span>
          <strong>{{ attachment.label }}</strong>
          <small>{{ attachment.source }}</small>
          <button type="button" aria-label="Remove job description" @click="removeAttachment">×</button>
        </div>
        <textarea id="prompt" ref="input" v-model="prompt" rows="2" :maxlength="MAX_CHAT_PROMPT_LENGTH" aria-describedby="prompt-character-count" placeholder="Ask Lucas anything about full-stack engineering…" @input="handleInput" @keydown="handleKeydown" />
        <div class="composer-controls">
          <div class="composer-meta">
            <button
              class="composer-add"
              type="button"
              :disabled="active"
              aria-label="Add job context"
              aria-controls="job-context-sheet"
              :aria-expanded="sheetOpen"
              @click="toggleSheet"
            >＋</button>
            <div ref="privacyControl" class="privacy-control">
              <button
                ref="privacyButton"
                class="composer-privacy-tag"
                type="button"
                aria-controls="ephemeral-chat-info"
                :aria-expanded="privacyOpen"
                @click="togglePrivacy"
              >
                <svg class="ephemeral-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 2h14M5 22h14" />
                  <path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22" />
                </svg>
                <span>Ephemeral chat · This site stores no history</span>
              </button>
              <Transition name="privacy-cloud">
                <div v-if="privacyOpen" id="ephemeral-chat-info" class="privacy-cloud" role="note">
                  <strong>Private for this visit</strong>
                  <p>
                    Messages and pasted attachments are sent to Azure AI only to generate responses. This site does not save
                    the conversation; it is discarded from this browser session when the chat ends. Azure may retain content
                    flagged under its abuse-monitoring policy.
                  </p>
                </div>
              </Transition>
            </div>
          </div>
          <div class="composer-actions">
            <span
              id="prompt-character-count"
              class="composer-character-count"
              :class="{ 'is-near-limit': nearPromptLimit }"
              :aria-label="`${prompt.length} of ${MAX_CHAT_PROMPT_LENGTH} characters used`"
            >{{ prompt.length }} / {{ MAX_CHAT_PROMPT_LENGTH }}</span>
            <button class="voice-trigger" type="button" :disabled="active" aria-label="Start voice input" title="Start voice input" @click="startListening">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
              </svg>
            </button>
            <button v-if="active" class="send stop-stream" type="button" aria-label="Stop response" @click="$emit('stop')">■</button>
            <button v-else class="send" type="button" :disabled="!prompt.trim()" aria-label="Send" @click="submit">↑</button>
          </div>
        </div>
      </template>
      <div v-else class="voice">
        <div><span>Listening</span><i v-for="bar in 5" :key="bar" :style="{ height: `${4 + bar * 3}px`, animationDelay: `${bar * -0.1}s` }" /><small>00:12</small></div>
        <p>“How does this assistant stay reliable?”</p>
        <button type="button">Mute</button><button class="stop" type="button" @click="listening = false">Stop</button>
      </div>
    </div>
  </div>
</template>
```

