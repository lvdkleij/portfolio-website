import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemContextRail from '~/components/SystemContextRail.vue'

describe('SystemContextRail', () => {
  it('does not display agent availability state', () => {
    const wrapper = mount(SystemContextRail, {
      props: { open: true, runtime: { state: 'streaming', trace: [], sources: [] } }
    })

    expect(wrapper.find('.rail-ready').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Streaming')
    expect(wrapper.text()).not.toContain('Ready')
    expect(wrapper.text()).not.toContain('Paused')
  })

  it('keeps the reported source count in the rail header', () => {
    const wrapper = mount(SystemContextRail, {
      props: {
        open: true,
        runtime: {
          state: 'complete',
          trace: [],
          sources: [{ id: 'resume', title: 'Résumé' }]
        }
      }
    })

    expect(wrapper.get('.rail-sources').text()).toBe('1 source')
  })
})
