<script setup lang="ts">
defineProps<{ contextOpen: boolean }>()
defineEmits<{ newChat: [], toggleContext: [] }>()

const config = useRuntimeConfig()
const resumeUrl = computed(() => String(config.public.resumeUrl || ''))
const resumeConfigured = computed(() => Boolean(resumeUrl.value))

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
    <div class="grounded"><i class="dot" /> Interactive Portfolio · AI Chat</div>
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
