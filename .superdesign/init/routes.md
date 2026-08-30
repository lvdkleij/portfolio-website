# Routes
- `/`: `frontend/app/pages/index.vue`; server rendered and prerendered; image-only scene.
- `/asterra`: `frontend/app/pages/asterra.vue`; client-rendered separate banking application, excluded from this design. Do not mutate or import its UI.
Nuxt file-based routing; no custom router.
```ts
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

```

