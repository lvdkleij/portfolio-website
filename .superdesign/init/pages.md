# Complete dependency tree — portfolio target
## `/`
Entry: frontend/app/pages/index.vue
- No local imports or component children; uses built-in Nuxt SEO composables only.
- frontend/app/app.vue: NuxtPage + NuxtRouteAnnouncer (built-in).
- frontend/nuxt.config.ts: route SSR/pre-render and global styles.
  - frontend/app/assets/css/main.css: globals 1–88 and reduced motion 1508–1516 apply. Other selectors are banking-only.
  - frontend/app/assets/css/portfolio.css: `.portfolio-page` / `.portfolio-*` classes are not rendered; only global reduced-motion html rule applies.
- frontend/public/images/lucas-desk-scene.png: approved upscaled hero. Upload as final content, not brand or a regenerated image.

There is no custom layout. `/asterra` and its dependency tree are deliberately excluded: unrelated product, no shared shell rendered by `/`.

