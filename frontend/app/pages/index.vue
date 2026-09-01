<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import QuietDeskOverlay from '~/components/QuietDeskOverlay.vue'

useSeoMeta({
  title: 'Lucas van der Kleij — Software Engineer',
  description: 'Software Engineer with 4+ years of experience building software solutions in financial services. Java, Kotlin, Spring Boot, Angular, Nuxt, and Azure.',
  ogTitle: 'Lucas van der Kleij — Software Engineer',
  ogDescription: 'Software Engineer with 4+ years of experience across architecture, development, cloud infrastructure, CI/CD, security, testing, and observability.',
  ogType: 'website',
  ogImage: 'https://lucasvanderkleij.dev/images/lucas-desk-scene.png',
  ogImageAlt: 'Lucas van der Kleij working at a wooden desk in a warm, minimal studio.'
})

useHead({
  htmlAttrs: { class: 'desk-page' },
  bodyAttrs: { class: 'desk-page' },
  link: [
    { rel: 'canonical', href: 'https://lucasvanderkleij.dev/' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400&display=swap' }
  ],
  meta: [{ name: 'theme-color', content: '#e8e6e1' }]
})

const brusselsDisplay = ref('— —:—')
const brusselsIso = ref('')
let brusselsTimer: ReturnType<typeof setInterval> | undefined

const brusselsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Brussels',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
})

function updateBrusselsTime() {
  const now = new Date()
  const parts = Object.fromEntries(brusselsFormatter.formatToParts(now).map((part) => [part.type, part.value]))
  brusselsDisplay.value = `${parts.weekday?.toUpperCase()} ${parts.hour}:${parts.minute}`
  brusselsIso.value = now.toISOString()
}

onMounted(() => {
  updateBrusselsTime()
  brusselsTimer = setInterval(updateBrusselsTime, 1000)
})

onBeforeUnmount(() => {
  if (brusselsTimer) clearInterval(brusselsTimer)
})
</script>

<template>
  <main class="desk-landing" aria-label="Lucas van der Kleij">
    <div class="brussels-clock" role="group" :aria-label="`Local time in Brussels: ${brusselsDisplay}`">
      <span class="brussels-clock__dot" aria-hidden="true" />
      <span>BRUSSELS</span>
      <time :datetime="brusselsIso">{{ brusselsDisplay }}</time>
    </div>
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
    <QuietDeskOverlay />
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
  position: relative;
  height: 100vh;
  height: 100dvh;
  padding: var(--frame-top) var(--frame-right) var(--frame-bottom) var(--frame-left);
  background: #e8e6e1;
}

.brussels-clock {
  position: absolute;
  z-index: 2;
  top: max(24px, env(safe-area-inset-top, 0px));
  left: 50%;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transform: translateX(-50%);
  padding: 8px 11px;
  border-radius: 8px;
  background: #000;
  color: #f5f5f5;
  font: 400 11px/16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.brussels-clock__dot {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: #30d68b;
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

@media (max-width: 1099px) {
  :global(html.desk-page),
  :global(body.desk-page) {
    width: 100%;
    height: 100%;
    overflow: hidden;
    overscroll-behavior: none;
  }
}

@media (max-width: 639px) {
  :global(html.desk-page),
  :global(body.desk-page) {
    background-color: #c5b09a;
  }

  .desk-landing {
    /* Keep the media in document flow: Safari clips fixed layers at its bars.
       lvh includes the space exposed when the browser controls retract. */
    height: 100vh;
    height: 100lvh;
    padding: 0;
    background: #c5b09a;
  }

  .desk-landing__frame {
    width: 100%;
    max-width: none;
    aspect-ratio: auto;
    border-radius: 0;
  }

  .brussels-clock {
    top: calc(12px + env(safe-area-inset-top, 0px));
    padding: 4px 8px;
    gap: 7px;
    border-radius: 6px;
    font-size: 10px;
  }
}
</style>
