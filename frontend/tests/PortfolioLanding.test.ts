import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createSSRApp, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import PortfolioLanding from '~/pages/index.vue'

let motionPreference: MediaQueryList

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.stubGlobal('useSeoMeta', vi.fn())
  vi.stubGlobal('useHead', vi.fn())
  motionPreference = Object.assign(new EventTarget(), {
    matches: false,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn()
  })
  vi.spyOn(window, 'matchMedia').mockReturnValue(motionPreference)
})

afterEach(() => vi.unstubAllGlobals())

describe('portfolio landing page', () => {
  it('autoplays the local video silently on a loop with inline mobile playback', async () => {
    const wrapper = mount(PortfolioLanding)
    await nextTick()

    expect(wrapper.get('main').attributes('aria-label')).toBe('Lucas van der Kleij')
    expect(wrapper.get('.brussels-clock').text()).toContain('BRUSSELS')
    expect(wrapper.get('.brussels-clock').attributes('aria-label')).toContain('Local time in Brussels')
    expect(wrapper.get('video').attributes()).toMatchObject({
      src: '/videos/lucas-desk-scene.mp4',
      poster: '/images/lucas-desk-scene.png',
      width: '1920',
      height: '1080',
      autoplay: '',
      loop: '',
      playsinline: '',
      preload: 'auto'
    })
    expect(wrapper.get('video').element.muted).toBe(true)
    expect(wrapper.get('video').element.controls).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'public/videos/lucas-desk-scene.mp4'))).toBe(true)
    expect(existsSync(resolve(process.cwd(), 'public/images/lucas-desk-scene.png'))).toBe(true)
  })

  it('keeps the visual page free of navigation, chat controls or other interactive content', async () => {
    const wrapper = mount(PortfolioLanding, {
      global: {
        stubs: { PortfolioAssistant: { template: '<div data-test="portfolio-assistant" />' } }
      }
    })
    await nextTick()

    expect(wrapper.text()).toContain('BRUSSELS')
    expect(wrapper.find('header, nav, footer, h1, h2, p, a, button, input, textarea, canvas').exists()).toBe(false)
    expect(wrapper.find('[data-test="portfolio-assistant"]').exists()).toBe(false)
  })

  it('prerenders the original image as a no-JavaScript fallback', async () => {
    const html = await renderToString(createSSRApp(PortfolioLanding))

    expect(html).toContain('src="/images/lucas-desk-scene.png"')
    expect(html).toContain('alt="Lucas van der Kleij working on a laptop')
    expect(html).not.toContain('<video')
  })

  it('does not load the video when reduced motion is preferred', async () => {
    Object.assign(motionPreference, { matches: true })
    const wrapper = mount(PortfolioLanding)
    await nextTick()

    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.get('img').attributes('src')).toBe('/images/lucas-desk-scene.png')
  })

  it('responds to motion preference changes and removes its listener on unmount', async () => {
    const removeListener = vi.spyOn(motionPreference, 'removeEventListener')
    const wrapper = mount(PortfolioLanding)
    await nextTick()

    Object.assign(motionPreference, { matches: true })
    motionPreference.dispatchEvent(new Event('change'))
    await nextTick()
    expect(wrapper.find('video').exists()).toBe(false)

    Object.assign(motionPreference, { matches: false })
    motionPreference.dispatchEvent(new Event('change'))
    await nextTick()
    expect(wrapper.find('video').exists()).toBe(true)

    wrapper.unmount()
    expect(removeListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('restores the still image if the video cannot load', async () => {
    const wrapper = mount(PortfolioLanding)
    await nextTick()
    await wrapper.get('video').trigger('error')

    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.get('img').attributes('src')).toBe('/images/lucas-desk-scene.png')
  })

  it('keeps route-specific metadata without adding visible text', () => {
    mount(PortfolioLanding)

    expect(useSeoMeta).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Lucas van der Kleij — Software Engineer',
      ogImage: 'https://lucasvanderkleij.dev/images/lucas-desk-scene.png'
    }))
    expect(useHead).toHaveBeenCalledWith({
      htmlAttrs: { class: 'desk-page' },
      bodyAttrs: { class: 'desk-page' },
      link: [{ rel: 'canonical', href: 'https://lucasvanderkleij.dev/' }],
      meta: [{ name: 'theme-color', content: '#e8e6e1' }]
    })
  })
})
