<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <section class="turn">
    <div class="question"><small>{{ label }}</small><p><slot name="prompt" /></p></div>
    <div class="answer">
      <div class="answer-label"><span>LUCAS / AI</span><slot name="answer-label"><i class="rule" /></slot></div>
      <div class="answer-body"><slot name="answer" /></div>
    </div>
  </section>
</template>
