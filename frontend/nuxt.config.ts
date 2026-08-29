// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css', '~/assets/css/portfolio.css'],
  routeRules: {
    '/': { prerender: true },
    '/asterra': { ssr: false }
  },
  nitro: {
    prerender: {
      routes: ['/']
    }
  },
  runtimeConfig: {
    public: {
      chatApiUrl: '/api/chat/stream',
      resumeUrl: ''
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Lucas van der Kleij — Software Engineer',
      meta: [
        { name: 'description', content: 'Software engineer focused on backend systems and architecture, with frontend experience and a growing interest in AI.' }
      ]
    }
  }
})
