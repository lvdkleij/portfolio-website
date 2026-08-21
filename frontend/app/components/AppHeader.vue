<script setup lang="ts">
import { computed } from 'vue'
import type { BackendHeartbeatState } from '~/composables/useBackendHeartbeat'

const props = defineProps<{
  contextOpen: boolean
  agentState: BackendHeartbeatState
}>()
defineEmits<{ newChat: [], toggleContext: [] }>()

const config = useRuntimeConfig()
const resumeUrl = computed(() => String(config.public.resumeUrl || ''))
const resumeConfigured = computed(() => Boolean(resumeUrl.value))
const availabilityLabel = computed(() => {
  if (props.agentState === 'connecting') return 'Waking up'
  if (props.agentState === 'ready') return 'Ready'
  return 'Paused'
})

function preventUnconfiguredDownload(event: MouseEvent) {
  if (!resumeConfigured.value) event.preventDefault()
}
</script>

<template>
  <header class="studio-header">
    <div class="brand">
      <a href="#top">Lucas van der Kleij</a>
      <span>Full Stack Engineer · Brussels</span>
    </div>
    <div
      class="grounded agent-availability"
      :data-state="agentState"
      :aria-label="`AI chat status: ${availabilityLabel}`"
      aria-live="polite"
    >
      <i class="dot" />
      <span><span class="availability-identity">Interactive Portfolio · AI Chat · </span>{{ availabilityLabel }}</span>
    </div>
    <nav aria-label="Primary navigation">
      <button class="new-chat" type="button" @click="$emit('newChat')">+ New Chat</button>
      <a href="#work">Work</a>
      <a
        class="resume"
        :href="resumeConfigured ? resumeUrl : undefined"
        :aria-disabled="!resumeConfigured"
        :title="resumeConfigured ? 'Download résumé' : 'Résumé download is not configured'"
        rel="noopener"
        @click="preventUnconfiguredDownload"
      >Résumé ↓</a>
      <button class="context-toggle" type="button" :aria-expanded="contextOpen" @click="$emit('toggleContext')">
        {{ contextOpen ? 'Hide context' : 'Context' }}
      </button>
    </nav>
  </header>
</template>
