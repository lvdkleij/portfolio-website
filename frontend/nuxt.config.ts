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
      title: 'Lucas van der Kleij — AI Engineer',
      meta: [
        { name: 'description', content: 'Lucas van der Kleij — AI engineer and product-minded developer building clear, trustworthy digital products.' }
      ]
    }
  }
})
