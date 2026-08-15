// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      chatApiUrl: '/api/hello',
      resumeUrl: ''
    }
  },
  app: {
    head: {
      title: 'Lucas van der Kleij — AI Engineer Studio',
      meta: [
        { name: 'description', content: 'A grounded AI portfolio and conversation studio by AI engineer Lucas van der Kleij.' },
        { name: 'theme-color', content: '#F6F0DF' }
      ]
    }
  }
})
