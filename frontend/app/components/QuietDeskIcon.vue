<script setup lang="ts">
defineProps<{ name: 'message' | 'send' | 'back' | 'external' | 'close' | 'minus' | 'expand' | 'collapse' | 'history' }>()
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-if="name === 'message'" d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    <path v-else-if="name === 'send'" d="m5 12 7-7 7 7M12 19V5" />
    <path v-else-if="name === 'back'" d="m12 19-7-7 7-7M5 12h14" />
    <path v-else-if="name === 'external'" d="M7 7h10v10M7 17 17 7" />
    <path v-else-if="name === 'minus'" d="M5 12h14" />
    <path v-else-if="name === 'expand'" d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6" />
    <path v-else-if="name === 'collapse'" d="M9 3v6H3m12-6v6h6M9 21v-6H3m12 6v-6h6" />
    <path v-else-if="name === 'history'" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    <path v-else d="m18 6-12 12M6 6l12 12" />
  </svg>
</template>
