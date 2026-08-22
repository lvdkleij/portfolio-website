import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CaseStudyPanel from '~/components/CaseStudyPanel.vue'

describe('CaseStudyPanel', () => {
  it('identifies all customer information as fictional and illustrative', () => {
    const wrapper = mount(CaseStudyPanel)

    expect(wrapper.get('h1').text()).toBe('AI banking guidance, grounded in customer context')
    expect(wrapper.get('#customer-title').text()).toBe('Fictional customer')
    expect(wrapper.text()).toContain('Lucas De Smet')
    expect(wrapper.text()).toContain('All customer data, products, fees, and projections are fictional and illustrative.')
  })
})
