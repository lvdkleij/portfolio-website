<script setup lang="ts">
import type { ChatState, ChatTraceStage, ChatUsage } from '~/types/chat'

const props = withDefaults(defineProps<{
  state: ChatState
  steps?: ChatTraceStage[]
  durationMs?: number
  sourceCount?: number
  usage?: ChatUsage
}>(), {
  steps: () => []
})

const traceId = useId()
const open = ref(false)
const completeCount = computed(() => props.steps.filter(step => step.state === 'complete').length)
const hasDetails = computed(() => props.steps.length > 0)

const summary = computed(() => {
  if (props.state === 'connecting') return props.steps.length
    ? `Processing request · ${completeCount.value} / ${props.steps.length}`
    : 'Connecting to assistant'
  if (props.state === 'streaming') return props.steps.length
    ? `Response streaming · ${completeCount.value} / ${props.steps.length} stages`
    : 'Response streaming'
  if (props.state === 'error') return 'Request interrupted'
  if (props.state === 'cancelled') return 'Response stopped'

  const parts = ['Request complete']
  if (props.durationMs !== undefined) parts.push(formatDuration(props.durationMs))
  if (props.steps.length) parts.push(`${props.steps.length} stages`)
  return parts.join(' · ')
})

const disclosure = computed(() => {
  const parts = ['Server-reported execution metadata—not private model reasoning.']
  if (props.sourceCount) parts.push(`${props.sourceCount} source${props.sourceCount === 1 ? '' : 's'} reported.`)
  if (props.usage?.inputTokens !== undefined || props.usage?.outputTokens !== undefined) {
    parts.push(`Usage: ${props.usage.inputTokens ?? '—'} input / ${props.usage.outputTokens ?? '—'} output tokens.`)
  }
  return parts.join(' ')
})

function formatDuration(duration: number) {
  return duration >= 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`
}
</script>

<template>
  <section class="prompt-trace" :class="{ open, live: state === 'connecting' || state === 'streaming' }">
    <button
      class="trace-toggle"
      type="button"
      :aria-expanded="hasDetails ? open : undefined"
      :aria-controls="hasDetails ? traceId : undefined"
      :disabled="!hasDetails"
      @click="hasDetails && (open = !open)"
    >
      <span class="trace-activity" aria-hidden="true"><i /><i /><i /></span>
      <span class="trace-summary" aria-live="polite">{{ summary }}</span>
      <span v-if="hasDetails" class="trace-chevron" aria-hidden="true">⌄</span>
    </button>

    <Transition name="trace-panel">
      <div v-if="open && hasDetails" :id="traceId" class="trace-panel">
        <ol class="trace-list">
          <li
            v-for="step in steps"
            :key="step.id"
            class="trace-step"
            :class="[`is-${step.state}`, step.kind === 'tool' ? 'tone-clay' : 'tone-blue']"
          >
            <span class="trace-node" aria-hidden="true">{{ step.state === 'complete' ? '✓' : step.code || '··' }}</span>
            <div class="trace-step-copy">
              <div class="trace-step-heading">
                <strong>{{ step.label }}</strong>
                <span>{{ step.state === 'active' ? 'Running…' : step.result || step.state }}</span>
              </div>
              <p v-if="step.detail">{{ step.detail }}</p>
            </div>
          </li>
        </ol>
        <p class="trace-disclosure"><span aria-hidden="true">ⓘ</span> {{ disclosure }}</p>
      </div>
    </Transition>
  </section>
</template>
