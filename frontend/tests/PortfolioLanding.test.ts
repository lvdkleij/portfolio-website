import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PortfolioLanding from '~/pages/index.vue'

beforeEach(() => {
  vi.stubGlobal('useSeoMeta', vi.fn())
  vi.stubGlobal('useHead', vi.fn())
})

afterEach(() => vi.unstubAllGlobals())

describe('portfolio landing page', () => {
  it('renders the approved sections and links Asterra to its routed experience', () => {
    const wrapper = mount(PortfolioLanding, {
      global: {
        stubs: {
          PortfolioAssistant: { template: '<div data-test="portfolio-assistant" />' },
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>'
          }
        }
      }
    })

    expect(wrapper.get('h1').text()).toContain('Lucas van')
    expect(wrapper.get('h1').text()).toContain('der Kleij')
    expect(wrapper.get('#work').text()).toContain('Asterra — AI banking assistant')
    expect(wrapper.get('#about').text()).toContain('Bridging product thinking and engineering craft.')
    expect(wrapper.get('#contact').text()).toContain('Let’s build something useful.')
    expect(wrapper.get('a[href="/asterra"]').text()).toContain('View the case study')
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
      title: 'Lucas van der Kleij — AI Engineer'
    }))
    expect(useHead).toHaveBeenCalledWith(expect.objectContaining({
      link: [{ rel: 'canonical', href: 'https://lucasvanderkleij.dev/' }]
    }))
  })
})
