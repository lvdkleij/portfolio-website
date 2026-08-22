import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from '~/components/AppHeader.vue'
import type { BackendHeartbeatState } from '~/composables/useBackendHeartbeat'

beforeEach(() => {
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { resumeUrl: '' } }))
})

afterEach(() => vi.unstubAllGlobals())

describe('AppHeader', () => {
  it.each([
    ['ready', 'Ready'],
    ['connecting', 'Waking up'],
    ['stopped', 'Paused']
  ] as const)('shows the %s heartbeat state in the header badge', (agentState, label) => {
    const wrapper = mount(AppHeader, {
      props: { agentState: agentState as BackendHeartbeatState }
    })
    const badge = wrapper.get('.agent-availability')

    expect(badge.attributes('data-state')).toBe(agentState)
    expect(badge.attributes('aria-label')).toBe(`AI chat status: ${label}`)
    expect(badge.text()).toBe(label)
    expect(badge.text()).not.toContain('Streaming')
  })

  it('resets the demo conversation from the close control', async () => {
    const wrapper = mount(AppHeader, { props: { agentState: 'ready' } })

    await wrapper.get('button[aria-label="Close and reset demo chat"]').trigger('click')

    expect(wrapper.emitted('newChat')).toHaveLength(1)
  })
})
