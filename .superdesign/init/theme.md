# Current portfolio tokens
The `/` route is image-only. No visible fonts, links, menus, or buttons. Viewport 100dvh with 100vh fallback, safe-area aware gap clamp(8px,.65vw,14px), frame radius clamp(20px,1.8vw,32px), off-white #e8e6e1, image fallback #c5b09a. Exact image 3344x1882. object-fit cover, position 68% 100%; no mobile max-height. Ultrawide min-aspect-ratio 5/2 caps frame width with aspect-ratio 5/2.

Global typography is Inter but inherited banking palette is overridden by the landing root. Never revive old cobalt/violet, dark mountain portfolio, Space Grotesk, or JetBrains Mono. No Tailwind config or theme provider. The two >900-line global stylesheets mostly style nonrendered, out-of-scope old portfolio/banking classes. Only these applicable global ranges are included, with the complete current scoped page below.

## Applicable global source: main.css lines 1–88 and 1508–1516
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Space+Grotesk:wght@600;700&display=swap');

:root {
  --paper: #f5f7ff;
  --surface: #ffffff;
  --subtle: #eef1ff;
  --ink: #111629;
  --ink-muted: #35405c;
  --ink-soft: #65708b;
  --cobalt: #2f43d8;
  --cobalt-bright: #5267ff;
  --cobalt-soft: #e7ebff;
  --violet: #7447e8;
  --violet-soft: #f0e9ff;
  --aqua: #087f91;
  --aqua-bright: #27c4d4;
  --aqua-soft: #dcf7fa;
  --line: #d8deee;
  --line-strong: #aab4d2;
  --amber: #8b5c12;
  --amber-soft: #f8eed8;
  --red: #8b342f;
  --red-soft: #f7e7e5;
  --strip-height: 28px;
  font-synthesis: none;
}

* {
  box-sizing: border-box;
}

html,
body,
#__nuxt {
  width: 100%;
  min-height: 100%;
}

html {
  background: var(--paper);
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: Inter, sans-serif;
  -webkit-font-smoothing: antialiased;
}

button,
textarea {
  color: inherit;
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
  text-decoration: none;
}

button:focus-visible,
a:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--cobalt);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.asterra-app {
  min-height: 100dvh;
  background: var(--paper);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

```
## Full current page and scoped CSS
```vue
<script setup lang="ts">
useSeoMeta({
  title: 'Lucas van der Kleij — Software Engineer',
  description: 'Software engineer focused on backend systems and architecture, with frontend experience and a growing interest in AI.',
  ogTitle: 'Lucas van der Kleij — Software Engineer',
  ogDescription: 'Backend-focused software engineer with experience in architecture, frontend development, and a growing interest in AI.',
  ogType: 'website',
  ogImage: 'https://lucasvanderkleij.dev/images/lucas-desk-scene.png',
  ogImageAlt: 'Lucas van der Kleij working at a wooden desk in a warm, minimal studio.'
})

useHead({
  link: [{ rel: 'canonical', href: 'https://lucasvanderkleij.dev/' }],
  meta: [{ name: 'theme-color', content: '#e8e6e1' }]
})
</script>

<template>
  <main class="desk-landing" aria-label="Lucas van der Kleij">
    <div class="desk-landing__frame">
      <img
        class="desk-landing__image"
        src="/images/lucas-desk-scene.png"
        alt="Lucas van der Kleij working on a laptop at a wooden desk, with a lamp and coffee cup, in a warm beige studio."
        width="3344"
        height="1882"
        loading="eager"
        fetchpriority="high"
        decoding="async"
      >
    </div>
  </main>
</template>

<style scoped>
.desk-landing {
  --frame-gap: clamp(8px, 0.65vw, 14px);
  --frame-top: max(var(--frame-gap), env(safe-area-inset-top, 0px));
  --frame-right: max(var(--frame-gap), env(safe-area-inset-right, 0px));
  --frame-bottom: max(var(--frame-gap), env(safe-area-inset-bottom, 0px));
  --frame-left: max(var(--frame-gap), env(safe-area-inset-left, 0px));
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  padding: var(--frame-top) var(--frame-right) var(--frame-bottom) var(--frame-left);
  background: #e8e6e1;
}

.desk-landing__frame {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: clamp(20px, 1.8vw, 32px);
  background: #c5b09a;
}

.desk-landing__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 68% 100%;
}

@media (min-aspect-ratio: 5 / 2) {
  .desk-landing__frame {
    width: auto;
    max-width: 100%;
    aspect-ratio: 5 / 2;
  }
}
</style>

```

