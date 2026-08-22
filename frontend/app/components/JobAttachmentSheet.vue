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
