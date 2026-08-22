# Shared UI Components

The frontend uses custom Vue single-file components rather than a third-party component library.

## CaseStudyPanel

- Path: `frontend/app/components/CaseStudyPanel.vue`
- Description: Static case-study document and fictional customer record.

```vue
<template>
  <aside id="case-study" class="case-study-panel" aria-label="Case study explanation">
    <article class="case-study-document">
      <p class="case-study-kicker">AI banking experience · Customer guidance</p>
      <h1>AI banking guidance, grounded in customer context</h1>
      <p class="case-study-intro">
        This fictional European banking demo shows how an AI assistant can help customers understand accounts, compare
        products, explore financial decisions, and complete guided banking tasks using permissioned customer data and
        approved knowledge.
      </p>

      <hr>

      <section aria-labelledby="demo-shows-title">
        <h2 id="demo-shows-title">What the demo shows</h2>
        <ul class="demo-capabilities">
          <li>Natural-language help across everyday banking and bigger decisions</li>
          <li>Permission before personal-data use</li>
          <li>Balance and account explanations</li>
          <li>Approved fictional product comparison with clear fees and risks</li>
          <li>Product subscription or human handoff with explicit review and confirmation</li>
        </ul>
      </section>

      <hr>

      <section aria-labelledby="customer-title">
        <h2 id="customer-title">Fictional customer</h2>
        <dl class="customer-record">
          <div class="customer-group">
            <p>Relationship</p>
            <div class="customer-rows">
              <div><dt>Name</dt><dd>Lucas De Smet</dd></div>
              <div><dt>Customer ID</dt><dd>AST-10482</dd></div>
              <div><dt>Residency</dt><dd>Brussels, Belgium</dd></div>
              <div><dt>Customer since</dt><dd>2019</dd></div>
              <div><dt>Relationship</dt><dd>Personal Banking</dd></div>
              <div><dt>Products</dt><dd>Current account · Savings account</dd></div>
              <div><dt>Employment</dt><dd>Salaried · Permanent contract</dd></div>
            </div>
          </div>

          <div class="customer-group">
            <p>Financial picture</p>
            <div class="customer-rows">
              <div><dt>Savings</dt><dd>€20,000</dd></div>
              <div><dt>Monthly income</dt><dd>€3,450</dd></div>
              <div><dt>Essential spending</dt><dd>€2,050 / month</dd></div>
              <div><dt>Risk tolerance</dt><dd>Medium</dd></div>
              <div><dt>Horizon</dt><dd>10+ years</dd></div>
              <div><dt>Primary goal</dt><dd>Long-term growth</dd></div>
              <div><dt>Liquidity preference</dt><dd>Keep six months accessible</dd></div>
            </div>
          </div>

          <div class="customer-group">
            <p>Preferences &amp; permissions</p>
            <div class="customer-rows">
              <div><dt>Preferred channel</dt><dd>Mobile app</dd></div>
              <div><dt>AI data consent</dt><dd>Not yet requested</dd></div>
              <div><dt>KYC profile</dt><dd>Verified · Reviewed 18 Jul 2026</dd></div>
              <div><dt>CRM refreshed</dt><dd>22 Aug 2026 · 09:04 CET</dd></div>
            </div>
          </div>
        </dl>
      </section>

      <blockquote>All customer data, products, fees, and projections are fictional and illustrative.</blockquote>
    </article>
  </aside>
</template>
```

## ConversationTurn

- Path: `frontend/app/components/ConversationTurn.vue`
- Description: Reusable customer/assistant conversation turn shell.

```vue
<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <section class="conversation-turn">
    <div class="customer-message">
      <small>{{ label }}</small>
      <p><slot name="prompt" /></p>
    </div>
    <div class="assistant-message">
      <div class="assistant-avatar" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M16 3.5 19.2 12.8 28.5 16l-9.3 3.2L16 28.5l-3.2-9.3L3.5 16l9.3-3.2L16 3.5Z" stroke="currentColor" stroke-width="1.5" />
          <circle cx="16" cy="16" r="3" fill="currentColor" />
        </svg>
      </div>
      <div class="assistant-message-content">
        <div class="assistant-label">Alex · Asterra assistant</div>
        <div class="answer-body"><slot name="answer" /></div>
      </div>
    </div>
  </section>
</template>
```

## JobAttachmentSheet

- Path: `frontend/app/components/JobAttachmentSheet.vue`
- Description: Accessible sheet for attaching pasted supporting context.

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
    error.value = 'Paste supporting context before attaching it.'
    pasteInput.value?.focus()
    return
  }

  const firstLine = text.split('\n').find(line => line.trim())?.trim() ?? 'Pasted context'
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
      <div class="add-menu-list" role="menu" aria-label="Add supporting context">
        <button ref="firstMenuItem" type="button" role="menuitem" @click="showPaste">
          <span class="add-menu-icon" aria-hidden="true">¶</span>
          <span><strong>Paste supporting context</strong><small>Up to 4,000 characters</small></span>
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
        <h3 :id="titleId">Paste supporting context</h3>
        <button type="button" aria-label="Close add menu" @click="$emit('close')">×</button>
      </header>

      <div class="job-sheet-panel">
        <label for="job-description">Supporting context</label>
        <textarea
          id="job-description"
          ref="pasteInput"
          v-model="pastedText"
          rows="4"
          maxlength="4000"
          placeholder="Paste information for Alex to consider…"
          @input="error = ''"
        />
      </div>

      <p v-if="error" class="job-sheet-error" role="alert">{{ error }}</p>
      <footer class="job-sheet-footer compact">
        <p>Sent with the chat request · not saved by this site</p>
        <button class="attach-role" type="button" @click="attachRole">Attach context</button>
      </footer>
    </template>
  </section>
</template>
```

## PromptTrace

- Path: `frontend/app/components/PromptTrace.vue`
- Description: Expandable server-reported execution metadata and progress trace.

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

## StudioComposer

- Path: `frontend/app/components/StudioComposer.vue`
- Description: Persistent Asterra chat composer with attachment, send, and stop controls.

```vue
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import JobAttachmentSheet from './JobAttachmentSheet.vue'
import type { ChatState, ChatSubmission, JobAttachment } from '~/types/chat'
import { MAX_CHAT_PROMPT_LENGTH } from '~/utils/chatLimits'

const props = withDefaults(defineProps<{ state?: ChatState }>(), { state: 'idle' })
const emit = defineEmits<{ send: [submission: ChatSubmission], stop: [] }>()

const prompt = ref('')
const input = ref<HTMLTextAreaElement>()
const dock = ref<HTMLElement>()
const sheetOpen = ref(false)
const attachment = ref<JobAttachment>()

const active = computed(() => props.state === 'connecting' || props.state === 'streaming')
const nearPromptLimit = computed(() => prompt.value.length >= MAX_CHAT_PROMPT_LENGTH - 50)

function resize() {
  if (!input.value) return
  input.value.style.height = 'auto'
  input.value.style.height = `${Math.min(input.value.scrollHeight, 128)}px`
}

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
  nextTick(resize)
}

function toggleSheet() {
  if (active.value) return
  sheetOpen.value = !sheetOpen.value
}

function attachContext(nextAttachment: JobAttachment) {
  attachment.value = nextAttachment
  sheetOpen.value = false
  nextTick(() => {
    resize()
    input.value?.focus()
  })
}

function removeAttachment() {
  attachment.value = undefined
  input.value?.focus()
}

function handleOutsideClick(event: PointerEvent) {
  if (sheetOpen.value && !dock.value?.contains(event.target as Node)) sheetOpen.value = false
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !sheetOpen.value) return
  sheetOpen.value = false
  nextTick(() => input.value?.focus())
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
  <div ref="dock" class="composer-dock">
    <Transition name="context-sheet">
      <div v-if="sheetOpen" class="context-sheet-anchor">
        <JobAttachmentSheet @attach="attachContext" @close="sheetOpen = false" />
      </div>
    </Transition>

    <form class="composer" aria-label="Message Alex" @submit.prevent="submit">
      <div v-if="attachment" class="composer-attachment">
        <span aria-hidden="true">TXT</span>
        <strong>{{ attachment.label }}</strong>
        <button type="button" aria-label="Remove attached context" @click="removeAttachment">×</button>
      </div>

      <div class="composer-row">
        <button
          class="composer-attach"
          type="button"
          :disabled="active"
          aria-label="Attach supporting context"
          aria-controls="job-context-sheet"
          :aria-expanded="sheetOpen"
          @click="toggleSheet"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m20.5 11.5-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.7 9.7a2 2 0 1 1-2.8-2.8l8.9-8.9" />
          </svg>
        </button>

        <label class="sr-only" for="asterra-question">Message Alex</label>
        <textarea
          id="asterra-question"
          ref="input"
          v-model="prompt"
          rows="1"
          :maxlength="MAX_CHAT_PROMPT_LENGTH"
          aria-describedby="prompt-character-count"
          placeholder="Message Alex"
          @input="handleInput"
          @keydown="handleKeydown"
        />

        <span
          id="prompt-character-count"
          class="composer-character-count"
          :class="{ 'is-near-limit': nearPromptLimit }"
          :aria-label="`${prompt.length} of ${MAX_CHAT_PROMPT_LENGTH} characters used`"
        >{{ prompt.length }} / {{ MAX_CHAT_PROMPT_LENGTH }}</span>

        <button v-if="active" class="composer-send stop-stream" type="button" aria-label="Stop response" @click="$emit('stop')">
          <span aria-hidden="true" />
        </button>
        <button v-else class="composer-send" type="submit" :disabled="!prompt.trim()" aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 11 6-6 6 6M12 5v14" />
          </svg>
        </button>
      </div>
    </form>
  </div>
</template>
```
