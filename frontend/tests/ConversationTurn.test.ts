import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConversationTurn from '../app/components/ConversationTurn.vue'

describe('ConversationTurn', () => {
  it('renders the customer prompt and the Asterra assistant identity', () => {
    const wrapper = mount(ConversationTurn, {
      props: { label: 'You · 01' },
      slots: {
        prompt: 'Tell me more',
        answer: 'Certainly.'
      }
    })

    expect(wrapper.get('.customer-message > p').text()).toBe('Tell me more')
    expect(wrapper.get('.assistant-label').text()).toBe('Alex · Asterra assistant')
    expect(wrapper.get('.answer-body').text()).toBe('Certainly.')
  })
})
