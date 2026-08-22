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
