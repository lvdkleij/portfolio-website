<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <section class="turn">
    <div class="question"><small>{{ label }}</small><p class="question-bubble"><slot name="prompt" /></p></div>
    <div class="answer">
      <div class="answer-label"><span>LUCAS / AI</span></div>
      <div class="answer-body"><slot name="answer" /></div>
    </div>
  </section>
</template>
