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
