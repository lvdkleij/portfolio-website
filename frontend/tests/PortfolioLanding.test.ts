import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createSSRApp, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import PortfolioLanding from '~/pages/index.vue'

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.stubGlobal('useSeoMeta', vi.fn())
  vi.stubGlobal('useHead', vi.fn())
})

afterEach(() => vi.unstubAllGlobals())

describe('portfolio landing page', () => {
  it('shows the original upscaled image without loading a video', async () => {
    const wrapper = mount(PortfolioLanding)
    await nextTick()

    expect(wrapper.get('main').attributes('aria-label')).toBe('Lucas van der Kleij')
    expect(wrapper.get('.brussels-clock').text()).toContain('BRUSSELS')
    expect(wrapper.get('.brussels-clock').attributes('aria-label')).toContain('Local time in Brussels')
    expect(wrapper.get('.desk-landing__frame > img').attributes()).toMatchObject({
      src: '/images/lucas-desk-scene.png',
      alt: 'Lucas van der Kleij working on a laptop at a wooden desk, with a lamp and coffee cup, in a warm beige studio.',
      width: '3344',
      height: '1882',
      loading: 'eager',
      fetchpriority: 'high',
      decoding: 'async'
    })
    expect(wrapper.find('video, source').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('.mp4')
    expect(existsSync(resolve(process.cwd(), 'public/images/lucas-desk-scene.png'))).toBe(true)
  })

  it('renders the identity, bottom composer and example questions without a menu or chat modal', async () => {
    const wrapper = mount(PortfolioLanding)
    await nextTick()

    expect(wrapper.text()).toContain('BRUSSELS')
    expect(wrapper.get('h1').text()).toBe('Lucas van der Kleij')
    expect(wrapper.get('.quiet-identity p').text()).toBe('Software engineer')
    expect(wrapper.get('#chat-input').attributes('placeholder')).toBe('Ask me anything…')
    expect(wrapper.findAll('.prompt-chip').map(button => button.text())).toEqual([
      'What do you work with?',
      "What's your background?",
      'How can I reach you?',
    ])
    expect(wrapper.find('nav, [role="dialog"], .portfolio-assistant, video, canvas').exists()).toBe(false)
    expect(wrapper.get('#conversation').attributes('hidden')).toBeDefined()
  })

  it('adds current Brussels weather to the clock when it is available', async () => {
    vi.stubGlobal('$fetch', vi.fn(async () => ({
      icon: 'rain',
      iconNum: 11,
      summary: 'Rain',
      temperature: 13.6
    })))

    const wrapper = mount(PortfolioLanding)
    await flushPromises()

    expect(wrapper.get('.brussels-clock__weather').text()).toBe('14°RAIN')
    expect(wrapper.get('.brussels-clock__weather img').attributes('src')).toBe('/weather/amcharts/animated/rainy-5.svg')
    expect(wrapper.get('.brussels-clock__weather source').attributes('srcset')).toBe('/weather/amcharts/static/rainy-5.svg')
    expect(wrapper.get('.brussels-clock').attributes('aria-label')).toContain('Current weather: Rain, 14 degrees Celsius')
  })

  it('prerenders the original image and chat entry without requiring JavaScript', async () => {
    const html = await renderToString(createSSRApp(PortfolioLanding))

    expect(html).toContain('src="/images/lucas-desk-scene.png"')
    expect(html).toContain('alt="Lucas van der Kleij working on a laptop')
    expect(html).toContain('<h1')
    expect(html).toContain('Software engineer')
    expect(html).toContain('placeholder="Ask me anything…"')
    expect(html).not.toContain('<nav')
    expect(html).not.toContain('<video')
  })

  it('keeps route-specific metadata and loads the approved serif for this route', () => {
    mount(PortfolioLanding)

    expect(useSeoMeta).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Lucas van der Kleij — Software Engineer',
      ogImage: 'https://lucasvanderkleij.dev/images/lucas-desk-scene.png'
    }))
    expect(useHead).toHaveBeenCalledWith({
      htmlAttrs: { class: 'desk-page' },
      bodyAttrs: { class: 'desk-page' },
      link: [
        { rel: 'canonical', href: 'https://lucasvanderkleij.dev/' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400&display=swap' }
      ],
      meta: [{ name: 'theme-color', content: '#e8e6e1' }]
    })
  })
})
