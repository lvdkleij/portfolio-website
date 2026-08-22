<script setup lang="ts">
import { computed } from 'vue'
import type { BackendHeartbeatState } from '~/composables/useBackendHeartbeat'

const props = defineProps<{ agentState: BackendHeartbeatState }>()
defineEmits<{ newChat: [] }>()

const availabilityLabel = computed(() => {
  if (props.agentState === 'connecting') return 'Waking up'
  if (props.agentState === 'ready') return 'Ready'
  return 'Paused'
})
</script>

<template>
  <header class="asterra-toolbar" aria-label="Asterra toolbar">
    <div class="asterra-brand">
      <svg aria-hidden="true" viewBox="0 0 32 32" fill="none">
        <path d="M16 2.5 19.7 12.3 29.5 16l-9.8 3.7L16 29.5l-3.7-9.8L2.5 16l9.8-3.7L16 2.5Z" stroke="currentColor" stroke-width="1.5" />
        <circle cx="16" cy="16" r="3.5" fill="currentColor" />
      </svg>
      <span>Asterra Bank</span>
      <span class="demo-badge">Illustrative demo</span>
    </div>

    <nav aria-label="Demo actions">
      <span
        class="agent-availability"
        :data-state="agentState"
        :aria-label="`AI chat status: ${availabilityLabel}`"
        aria-live="polite"
      >
        <i aria-hidden="true" />
        {{ availabilityLabel }}
      </span>
      <a class="toolbar-action" href="#case-study" aria-label="Read demo information">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9a2.3 2.3 0 0 1 4.4.9c0 1.7-2.2 2-2.2 3.6M12 17h.01" />
        </svg>
        <span>Help</span>
      </a>
      <button class="toolbar-action outlined" type="button" aria-label="Close and reset demo chat" @click="$emit('newChat')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
        <span>Close</span>
      </button>
    </nav>
  </header>
</template>
