import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConversationTurn from '../app/components/ConversationTurn.vue'

describe('ConversationTurn', () => {
  it('renders the user prompt as a bubble without assistant label decorations', () => {
    const wrapper = mount(ConversationTurn, {
      props: { label: 'YOU / 01' },
      slots: {
        prompt: 'Tell me more',
        answer: 'Certainly.'
      }
    })

    expect(wrapper.get('.question-bubble').text()).toBe('Tell me more')
    expect(wrapper.get('.answer-label').text()).toBe('LUCAS / AI')
    expect(wrapper.find('.answer-label .typing').exists()).toBe(false)
    expect(wrapper.find('.answer-label .rule').exists()).toBe(false)
  })
})
