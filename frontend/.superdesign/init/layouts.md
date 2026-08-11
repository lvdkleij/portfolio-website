# Shared Layouts

## Root shell — `app/app.vue`

```vue
<script setup lang="ts">
const contextOpen = ref(true)
onMounted(() => { if (window.innerWidth <= 900) contextOpen.value = false })
</script>

<template>
  <div class="studio-shell">
    <NuxtRouteAnnouncer />
    <AppHeader :context-open="contextOpen" @toggle-context="contextOpen = !contextOpen" />
    <div class="studio-body">
      <ConversationWorkspace />
      <SystemContextRail :open="contextOpen" @close="contextOpen = false" />
      <button v-if="!contextOpen" class="context-tab" type="button" @click="contextOpen = true"><i class="dot" /> Context</button>
    </div>
  </div>
</template>
```

## AppHeader — `app/components/AppHeader.vue`

```vue
<script setup lang="ts">
defineProps<{ contextOpen: boolean }>()
defineEmits<{ toggleContext: [] }>()
</script>

<template>
  <header class="studio-header">
    <div class="brand"><a href="#top">Lucas van der Kleij</a><span>AI Engineer</span></div>
    <div class="grounded"><i class="dot" /> AI Representation · Grounded</div>
    <nav aria-label="Primary navigation">
      <button class="new-chat" type="button">+ New Chat</button><a href="#work">Work</a>
      <a class="resume" href="#resume">Résumé ↓</a>
      <button class="context-toggle" type="button" :aria-expanded="contextOpen" @click="$emit('toggleContext')">{{ contextOpen ? 'Hide context' : 'Context' }}</button>
    </nav>
  </header>
</template>
```

## SystemContextRail
Path: `app/components/SystemContextRail.vue`. Fixed 340px desktop context rail; becomes an off-canvas drawer at 900px. Contains model, knowledge source, and tool status sections. Full source is passed directly for design work.
