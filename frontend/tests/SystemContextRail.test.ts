import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemContextRail from '~/components/SystemContextRail.vue'
import type { ChatRuntimeContext, ChatState } from '~/types/chat'

function runtime(state: ChatState): ChatRuntimeContext {
  return { state, trace: [], sources: [] }
}

describe('SystemContextRail', () => {
  it.each([
    ['stopped', undefined, 'Assistant paused'],
    ['stopped', runtime('idle'), 'Assistant paused'],
    ['connecting', runtime('idle'), 'Waking up AI assistant…'],
    ['ready', runtime('idle'), 'Ready'],
    ['stopped', runtime('connecting'), 'Waking up AI assistant…'],
    ['ready', runtime('streaming'), 'Streaming'],
    ['stopped', runtime('streaming'), 'Streaming'],
    ['ready', runtime('complete'), 'Ready'],
    ['ready', runtime('cancelled'), 'Ready'],
    ['ready', runtime('error'), 'Ready']
  ] as const)('shows the expected agent status', (agentState, runtimeContext, expectedLabel) => {
    const wrapper = mount(SystemContextRail, {
      props: { open: true, runtime: runtimeContext, agentState }
    })

    expect(wrapper.get('.rail-ready').text()).toContain(expectedLabel)
  })
})
