import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from '~/components/AppHeader.vue'
import type { BackendHeartbeatState } from '~/composables/useBackendHeartbeat'

beforeEach(() => {
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { resumeUrl: '' } }))
})

afterEach(() => vi.unstubAllGlobals())

describe('AppHeader', () => {
  it.each(['ready', 'connecting', 'stopped'] as const)('hides the %s heartbeat state', (agentState) => {
    const wrapper = mount(AppHeader, {
      props: { agentState: agentState as BackendHeartbeatState }
    })

    expect(wrapper.find('.agent-availability').exists()).toBe(false)
  })

  it('resets the demo conversation from the close control', async () => {
    const wrapper = mount(AppHeader, { props: { agentState: 'ready' } })

    await wrapper.get('button[aria-label="Close and reset demo chat"]').trigger('click')

    expect(wrapper.emitted('newChat')).toHaveLength(1)
  })
})
