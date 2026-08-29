import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PortfolioLanding from '~/pages/index.vue'

beforeEach(() => {
  vi.stubGlobal('useSeoMeta', vi.fn())
  vi.stubGlobal('useHead', vi.fn())
})

afterEach(() => vi.unstubAllGlobals())

describe('portfolio landing page', () => {
  it('renders the current positioning, coming-soon work state, and profile links', () => {
    const wrapper = mount(PortfolioLanding, {
      global: {
        stubs: {
          PortfolioAssistant: { template: '<div data-test="portfolio-assistant" />' },
          NuxtLink: true
        }
      }
    })

    expect(wrapper.get('h1').text()).toContain('Lucas van')
    expect(wrapper.get('h1').text()).toContain('der Kleij')
    expect(wrapper.text()).toContain('Software engineer · Backend & architecture')
    expect(wrapper.get('#work').text()).toContain('Coming soon.')
    expect(wrapper.find('.portfolio-project').exists()).toBe(false)
    expect(wrapper.get('#about').text()).toContain('Backend foundations, architectural thinking')
    expect(wrapper.get('#contact').text()).toContain('Let’s build something useful.')
    expect(wrapper.get('a[href="https://www.linkedin.com/in/lucas-van-der-kleij"]').attributes('target')).toBe('_blank')
    expect(wrapper.get('a[href="https://github.com/lvdkleij"]').attributes('target')).toBe('_blank')
    expect(wrapper.find('[data-test="portfolio-assistant"]').exists()).toBe(true)
  })

  it('sets route-specific portfolio metadata', () => {
    mount(PortfolioLanding, {
      global: {
        stubs: {
          PortfolioAssistant: true,
          NuxtLink: true
        }
      }
    })

    expect(useSeoMeta).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Lucas van der Kleij — Software Engineer'
    }))
    expect(useHead).toHaveBeenCalledWith(expect.objectContaining({
      link: [{ rel: 'canonical', href: 'https://lucasvanderkleij.dev/' }]
    }))
  })
})
