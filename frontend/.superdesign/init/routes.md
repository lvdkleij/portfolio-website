# Routes

## Framework routing

- Framework: Nuxt 4 / Vue 3.
- Rendering: client-side SPA (`ssr: false`).
- The repository has no `app/pages/` directory and no explicit Vue Router configuration.
- URL `/` renders `frontend/app/app.vue` as the entire customer-facing experience.
- Nuxt auto-registers the components under `frontend/app/components/`.
- Server endpoints (not visual routes): `POST /api/chat/stream` and `POST /api/heartbeat`.

## Root route — /

Entry: `frontend/app/app.vue`

Renders the Lucas-authored AI portfolio shell with a global header, a chat transcript/workspace, a persistent or overlay system-context rail, and the composer dock.

## Nuxt configuration

```ts
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
      title: 'Lucas van der Kleij — AI Engineer Studio',
      meta: [
        { name: 'description', content: 'A grounded AI portfolio and conversation studio by AI engineer Lucas van der Kleij.' },
        { name: 'theme-color', content: '#F6F0DF' }
      ]
    }
  }
})
```
