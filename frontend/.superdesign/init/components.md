# Shared UI Components

Framework: Vue 3 SFCs in Nuxt 4. Styling is custom global CSS; there is no component library.

## PromptTrace
Path: `app/components/PromptTrace.vue`
Props: `prompt: string`, `pending?: boolean`, `progress?: number`, `defaultOpen?: boolean`, `durationMs?: number`, `sourceCount?: number`

Expandable six-stage execution trace for tokenization, prompt security, context assembly, knowledge retrieval, tool use, and response synthesis. It animates live for guest prompts, detects the adversarial demo prompt, and displays observable metadata without exposing private reasoning.

## ConversationTurn
Path: `app/components/ConversationTurn.vue`
Props: `label: string`, `muted?: boolean`; named prompt, answer-label, and answer slots.

```vue
<script setup lang="ts">
defineProps<{ label: string, muted?: boolean }>()
</script>

<template>
  <section class="turn" :class="{ muted }">
    <div class="question"><small>{{ label }}</small><p><slot name="prompt" /></p></div>
    <div class="answer">
      <div class="answer-label"><span>LUCAS / AI</span><slot name="answer-label"><i class="rule" /></slot></div>
      <div class="answer-body"><slot name="answer" /></div>
    </div>
  </section>
</template>
```
