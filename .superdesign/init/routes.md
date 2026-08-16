# Routes

Nuxt 4 is configured as a client-side application (`ssr: false`). There is no `pages/` directory, so Nuxt renders `frontend/app/app.vue` as the single `/` route.

| URL | Entry | Layout |
| --- | --- | --- |
| `/` | `frontend/app/app.vue` | Root studio shell in the same file |

The route renders a portfolio chat: header, scrollable transcript, fixed composer dock, and collapsible system-context rail.

## Nuxt configuration

```ts
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
```

