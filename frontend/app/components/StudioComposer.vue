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
        <textarea id="prompt" ref="input" v-model="prompt" rows="2" :maxlength="MAX_CHAT_PROMPT_LENGTH" placeholder="Ask Lucas anything about full-stack engineering…" @input="handleInput" @keydown="handleKeydown" />
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
