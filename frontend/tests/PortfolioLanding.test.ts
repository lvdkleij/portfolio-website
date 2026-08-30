import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PortfolioLanding from '~/pages/index.vue'

beforeEach(() => {
  vi.stubGlobal('useSeoMeta', vi.fn())
  vi.stubGlobal('useHead', vi.fn())
})

afterEach(() => vi.unstubAllGlobals())

describe('portfolio landing page', () => {
  it('renders the locally hosted desk image and Brussels clock in an accessible main landmark', () => {
    const wrapper = mount(PortfolioLanding)

    expect(wrapper.get('main').attributes('aria-label')).toBe('Lucas van der Kleij')
    expect(wrapper.get('.brussels-clock').text()).toContain('BRUSSELS')
    expect(wrapper.get('.brussels-clock').attributes('aria-label')).toContain('Local time in Brussels')
    expect(wrapper.findAll('img')).toHaveLength(1)
    expect(wrapper.get('img').attributes()).toMatchObject({
      src: '/images/lucas-desk-scene.png',
      alt: 'Lucas van der Kleij working on a laptop at a wooden desk, with a lamp and coffee cup, in a warm beige studio.',
      width: '3344',
      height: '1882',
      loading: 'eager',
      fetchpriority: 'high'
    })
    expect(existsSync(resolve(process.cwd(), 'public/images/lucas-desk-scene.png'))).toBe(true)
  })

  it('keeps the visual page free of navigation, chat controls or other interactive content', () => {
    const wrapper = mount(PortfolioLanding, {
      global: {
        stubs: { PortfolioAssistant: { template: '<div data-test="portfolio-assistant" />' } }
      }
    })

    expect(wrapper.text()).toContain('BRUSSELS')
    expect(wrapper.find('header, nav, footer, h1, h2, p, a, button, input, textarea, video, canvas').exists()).toBe(false)
    expect(wrapper.find('[data-test="portfolio-assistant"]').exists()).toBe(false)
  })

  it('keeps route-specific metadata without adding visible text', () => {
    mount(PortfolioLanding)

    expect(useSeoMeta).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Lucas van der Kleij — Software Engineer',
      ogImage: 'https://lucasvanderkleij.dev/images/lucas-desk-scene.png'
    }))
    expect(useHead).toHaveBeenCalledWith({
      link: [{ rel: 'canonical', href: 'https://lucasvanderkleij.dev/' }],
      meta: [{ name: 'theme-color', content: '#e8e6e1' }]
    })
  })
})
