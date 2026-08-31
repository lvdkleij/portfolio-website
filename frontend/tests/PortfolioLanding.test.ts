import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
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

  it('renders the approved identity, compact menu and inline AI chat entry', async () => {
    const wrapper = mount(PortfolioLanding)
    await nextTick()

    expect(wrapper.text()).toContain('BRUSSELS')
    expect(wrapper.get('h1').text()).toBe('Lucas van der Kleij')
    expect(wrapper.get('.quiet-identity p').text()).toBe('Software engineer')
    expect(wrapper.get('nav').text()).toContain('About')
    expect(wrapper.get('nav').text()).toContain('Approach')
    expect(wrapper.get('nav').text()).toContain('Contact')
    expect(wrapper.get('.quiet-chat-trigger').text()).toBe('AI Chat')
    expect(wrapper.find('[role="dialog"], .portfolio-assistant, video, canvas').exists()).toBe(false)
  })

  it('prerenders the original image without requiring JavaScript', async () => {
    const html = await renderToString(createSSRApp(PortfolioLanding))

    expect(html).toContain('src="/images/lucas-desk-scene.png"')
    expect(html).toContain('alt="Lucas van der Kleij working on a laptop')
    expect(html).toContain('<h1')
    expect(html).toContain('Software engineer')
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
