// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PortfolioPanel from '~/components/PortfolioPanel.vue'

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

describe('Portfolio navigation', () => {
  it('only requests a reply on submit and preserves chat when switching panels', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('event: delta\ndata: {"type":"delta","text":"Hello from the model."}\n\nevent: done\ndata: {"type":"done"}\n\n', { headers: { 'content-type': 'text/event-stream' } }))
    vi.stubGlobal('fetch', fetcher)
    const wrapper = mount(PortfolioPanel)
    const buttons = wrapper.findAll('nav button')
    await buttons[3]!.trigger('click')
    expect(wrapper.get('h2').text()).toBe('Chat')
    expect(fetcher).not.toHaveBeenCalled()
    await wrapper.get('input').setValue('What do you work with?')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher.mock.calls[0]![0]).toBe('/api/v1/lucasai/stream')
    expect(wrapper.get('[role="log"]').text()).toContain('Hello from the model.')
    await wrapper.get('input').setValue('Another question')
    await buttons[0]!.trigger('click')
    await buttons[3]!.trigger('click')
    expect(wrapper.get('[role="log"]').text()).toContain('Hello from the model.')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('Another question')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('shows a request failure and allows a new message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))
    const wrapper = mount(PortfolioPanel)
    await wrapper.findAll('nav button')[3]!.trigger('click')
    await wrapper.get('input').setValue('Hello')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.chat-error').text()).toContain('temporarily unavailable')
    await wrapper.get('input').setValue('Try again')
    expect(wrapper.get('[aria-label="Send message"]').attributes('disabled')).toBeUndefined()
  })
  it('opens, switches, and toggles a single content panel', async () => {
    const wrapper = mount(PortfolioPanel)
    const buttons = wrapper.findAll('nav button')
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    await buttons[0]!.trigger('click')
    expect(wrapper.get('h2').text()).toBe('About')
    expect(buttons[0]!.attributes('aria-expanded')).toBe('true')
    await buttons[1]!.trigger('click')
    expect(wrapper.findAll('[role="region"]')).toHaveLength(1)
    expect(wrapper.get('h2').text()).toBe('Work')
    expect(buttons[0]!.attributes('aria-expanded')).toBe('false')
    await buttons[1]!.trigger('click')
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })

  it('focuses the panel and restores the selected trigger after Escape or close', async () => {
    const wrapper = mount(PortfolioPanel, { attachTo: document.body })
    const contact = wrapper.findAll('nav button')[2]!
    await contact.trigger('click')
    expect(document.activeElement).toBe(wrapper.get('[role="region"]').element)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(document.activeElement).toBe(contact.element)
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    await contact.trigger('click')
    await wrapper.get('[aria-label="Close panel"]').trigger('click')
    expect(document.activeElement).toBe(contact.element)
  })

  it('provides the existing contact destinations without a chat composer', async () => {
    const wrapper = mount(PortfolioPanel)
    await wrapper.findAll('nav button')[2]!.trigger('click')
    expect(wrapper.findAll('a').map(link => link.attributes('href'))).toEqual([
      'https://www.linkedin.com/in/lucas-van-der-kleij',
      'https://github.com/lvdkleij',
    ])
    expect(wrapper.find('input, form').exists()).toBe(false)
  })
})
