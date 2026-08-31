<script setup lang="ts">
defineProps<{ name: 'message' | 'send' | 'back' | 'external' | 'close' }>()
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-if="name === 'message'" d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    <path v-else-if="name === 'send'" d="m5 12 7-7 7 7M12 19V5" />
    <path v-else-if="name === 'back'" d="m12 19-7-7 7-7M5 12h14" />
    <path v-else-if="name === 'external'" d="M7 7h10v10M7 17 17 7" />
    <path v-else d="m18 6-12 12M6 6l12 12" />
  </svg>
</template>
