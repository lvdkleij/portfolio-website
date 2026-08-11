<script setup lang="ts">
import type { ChatRuntimeContext } from '~/types/chat'

const props = defineProps<{
  open: boolean
  runtime?: ChatRuntimeContext | null
}>()

defineEmits<{ close: [] }>()

const tools = computed(() => props.runtime?.trace.filter(stage => stage.kind === 'tool') ?? [])
const stateLabel = computed(() => {
  if (!props.runtime || props.runtime.state === 'idle') return 'Awaiting chat'
  if (props.runtime.state === 'connecting') return 'Connecting'
  if (props.runtime.state === 'streaming') return 'Streaming'
  if (props.runtime.state === 'complete') return 'Ready'
  if (props.runtime.state === 'cancelled') return 'Stopped'
  return 'Unavailable'
})
</script>

<template>
  <button class="rail-backdrop" :class="{ open }" type="button" aria-label="Close system context" @click="$emit('close')" />
  <aside id="system-context" class="context-rail" :class="{ open }" :aria-hidden="!open" :inert="!open">
    <header>
      <div><h2>System context</h2><button type="button" aria-label="Close system context" @click="$emit('close')">×</button></div>
      <p>What this AI reported</p>
      <div class="rail-ready">
        <span><i class="dot" />{{ stateLabel }}</span>
        <span v-if="runtime?.sources.length">{{ runtime.sources.length }} source{{ runtime.sources.length === 1 ? '' : 's' }}</span>
      </div>
    </header>

    <div class="rail-scroll">
      <dl class="model-grid">
        <div v-if="runtime?.model"><dt>Model</dt><dd>{{ runtime.model }}</dd></div>
        <div><dt>Memory</dt><dd>Browser session</dd></div>
        <div v-if="runtime?.durationMs !== undefined"><dt>Duration</dt><dd>{{ runtime.durationMs }}ms</dd></div>
        <div v-if="runtime?.usage?.outputTokens !== undefined"><dt>Output</dt><dd>{{ runtime.usage.outputTokens }} tokens</dd></div>
      </dl>

      <section v-if="runtime?.sources.length">
        <div class="section-title"><h3>Knowledge</h3><span>{{ runtime.sources.length }} reported</span></div>
        <article v-for="source in runtime.sources" :key="source.id" class="source-row used">
          <div>
            <i>{{ source.kind?.slice(0, 3).toUpperCase() || 'SRC' }}</i>
            <strong>{{ source.title }}</strong>
            <b>Used</b>
          </div>
          <p v-if="source.detail"><span>{{ source.detail }}</span></p>
        </article>
      </section>

      <section v-if="tools.length">
        <div class="section-title"><h3>Tools</h3><span>{{ tools.length }} reported</span></div>
        <article v-for="tool in tools" :key="tool.id" class="tool-row used">
          <div><strong>{{ tool.label }}</strong><b class="active">{{ tool.state }}</b></div>
          <p v-if="tool.detail">{{ tool.detail }}</p>
          <small v-if="tool.durationMs !== undefined">{{ tool.durationMs }}ms</small>
        </article>
      </section>

      <p v-if="!runtime?.model && !runtime?.sources.length && !tools.length" class="rail-empty">
        Runtime details appear here only when the chat API reports them.
      </p>
    </div>
  </aside>
</template>
