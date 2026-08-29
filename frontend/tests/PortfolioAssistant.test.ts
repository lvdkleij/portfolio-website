import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PortfolioAssistant from '~/components/PortfolioAssistant.vue'

describe('PortfolioAssistant', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('opens with the greeting and minimizes to the AI Chat launcher', async () => {
    const wrapper = mount(PortfolioAssistant, { attachTo: document.body })

    expect(wrapper.get('#portfolio-assistant-card').isVisible()).toBe(true)
    expect(wrapper.text()).toContain("Hello, I’m Lucas’ AI assistant. Ask me something.")
    expect(wrapper.get('.portfolio-assistant__launcher').isVisible()).toBe(false)

    await wrapper.get('button[aria-label="Minimize Lucas AI assistant"]').trigger('click')

    const launcher = wrapper.get<HTMLButtonElement>('.portfolio-assistant__launcher')
    expect(launcher.isVisible()).toBe(true)
    expect(launcher.text()).toBe('AI Chat')
    expect(document.activeElement).toBe(launcher.element)

    await launcher.trigger('click')

    expect(wrapper.get('#portfolio-assistant-card').isVisible()).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('#portfolio-assistant-input').element)
    wrapper.unmount()
  })

  it.each([
    ['Tell me about Asterra', 'fictional European banking-assistant'],
    ['What work has Lucas done?', 'complex systems need to feel clear and trustworthy'],
    ['What is his approach?', 'approaches AI as a product discipline'],
    ['What are his technical capabilities?', 'Microsoft Azure infrastructure'],
    ['How do you think about responsible AI?', 'preserve user control'],
    ['How can I contact Lucas?', 'contact details and profile links are being finalized'],
    ['What is his favorite sandwich?', 'selected work, Asterra, his approach']
  ])('responds locally to “%s”', async (question, expectedResponse) => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const wrapper = mount(PortfolioAssistant)
    const input = wrapper.get<HTMLInputElement>('#portfolio-assistant-input')

    await input.setValue(question)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="status"]').text()).toContain('Lucas AI assistant is thinking')
    await vi.advanceTimersByTimeAsync(600)

    expect(wrapper.text()).toContain(expectedResponse)
    expect(fetchSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keeps a multi-turn transcript for the current page visit', async () => {
    const wrapper = mount(PortfolioAssistant)
    const input = wrapper.get<HTMLInputElement>('#portfolio-assistant-input')

    await input.setValue('Tell me about Asterra')
    await wrapper.get('form').trigger('submit')
    await vi.advanceTimersByTimeAsync(600)
    await input.setValue('What is Lucas’s approach?')
    await wrapper.get('form').trigger('submit')
    await vi.advanceTimersByTimeAsync(600)

    expect(wrapper.findAll('.portfolio-assistant__message--user')).toHaveLength(2)
    expect(wrapper.findAll('.portfolio-assistant__message--assistant')).toHaveLength(3)
    wrapper.unmount()
  })
})
