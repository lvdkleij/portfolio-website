// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      chatApiUrl: '/api/chat/stream',
      resumeUrl: ''
    }
  },
  app: {
    head: {
      title: 'Asterra Bank AI Assistant — A Case Study by Lucas van der Kleij',
      meta: [
        { name: 'description', content: 'A fictional European AI banking assistant case study by Lucas van der Kleij.' },
        { name: 'theme-color', content: '#F5F7FF' }
      ]
    }
  }
})
