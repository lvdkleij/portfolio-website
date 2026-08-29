<script setup lang="ts">
useSeoMeta({
  title: 'Lucas van der Kleij — Software Engineer',
  description: 'Software engineer focused on backend systems and architecture, with frontend experience and a growing interest in AI.',
  ogTitle: 'Lucas van der Kleij — Software Engineer',
  ogDescription: 'Backend-focused software engineer with experience in architecture, frontend development, and a growing interest in AI.',
  ogType: 'website'
})

useHead({
  link: [{ rel: 'canonical', href: 'https://lucasvanderkleij.dev/' }],
  meta: [{ name: 'theme-color', content: '#070809' }]
})
</script>

<template>
  <div class="portfolio-page">
    <header class="portfolio-header">
      <nav class="portfolio-nav portfolio-container" aria-label="Primary navigation">
        <a class="portfolio-brand" href="#top">Lucas <span>/</span> VDK</a>
        <div class="portfolio-nav__links">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <span class="portfolio-nav__resume" aria-disabled="true" title="Résumé link forthcoming">Résumé</span>
        </div>
        <a class="portfolio-nav__mobile" href="#work" aria-label="Skip to selected work">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </a>
      </nav>
    </header>

    <main>
      <section id="top" class="portfolio-hero" aria-labelledby="portfolio-hero-title">
        <img
          class="portfolio-hero__background"
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85"
          alt=""
          aria-hidden="true"
        >
        <div class="portfolio-hero__shade" />
        <div class="portfolio-hero__fade" />
        <div class="portfolio-hero__content portfolio-container">
          <div class="portfolio-hero__portrait">
            <img src="/images/lucas-portrait.png" alt="Portrait of Lucas van der Kleij">
          </div>
          <p class="portfolio-kicker">Software engineer · Backend & architecture</p>
          <h1 id="portfolio-hero-title">Lucas van<br>der Kleij</h1>
          <p class="portfolio-hero__intro">I’m a software engineer focused on backend systems and architecture, with frontend experience and a growing interest in AI.</p>
          <a class="portfolio-primary-action" href="#about">
            More about me
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M7 17h10V7" /></svg>
          </a>
        </div>
        <a class="portfolio-scroll-cue" href="#manifesto">
          Scroll to discover <span aria-hidden="true" />
        </a>
      </section>

      <section id="manifesto" class="portfolio-section portfolio-manifesto" aria-labelledby="manifesto-title">
        <div class="portfolio-container">
          <p class="portfolio-section-label">01 / Approach</p>
          <h2 id="manifesto-title">I build dependable software from the backend out—shaping <em>clear architectures</em>, robust services, and thoughtful interfaces, while exploring where <em>AI can add real value.</em></h2>
        </div>
      </section>

      <section id="work" class="portfolio-section portfolio-work" aria-labelledby="work-title">
        <div class="portfolio-container portfolio-section-rule">
          <div class="portfolio-section-heading">
            <div>
              <p class="portfolio-section-label">02 / Selected work</p>
              <h2 id="work-title">Coming soon.</h2>
            </div>
            <p>I’m putting this section together and will add projects when there’s something worth sharing.</p>
          </div>
          <div class="portfolio-work-coming-soon" aria-label="Selected work coming soon">
            <span class="portfolio-accent-line" aria-hidden="true" />
            <p>Selected work</p>
            <strong>Projects and case studies will appear here in time.</strong>
          </div>
        </div>
      </section>

      <section class="portfolio-section portfolio-capabilities" aria-labelledby="capabilities-title">
        <div class="portfolio-container">
          <p class="portfolio-section-label">03 / Capabilities</p>
          <h2 id="capabilities-title">From backend to architecture.</h2>
          <div class="portfolio-capability-list">
            <article><span>01</span><h3>Backend engineering</h3><p>Reliable services, APIs, domain models, and integrations built to last.</p><small>Build</small></article>
            <article><span>02</span><h3>Software architecture</h3><p>Clear boundaries, pragmatic decisions, and systems designed to evolve.</p><small>Shape</small></article>
            <article><span>03</span><h3>Full-stack development</h3><p>Backend-first development with frontend experience to deliver cohesive products.</p><small>Deliver</small></article>
            <article><span>04</span><h3>AI exploration</h3><p>Learning and experimenting with AI where it can add meaningful value.</p><small>Explore</small></article>
          </div>
        </div>
      </section>

      <section id="about" class="portfolio-section portfolio-about" aria-labelledby="about-title">
        <div class="portfolio-container portfolio-about__grid">
          <p class="portfolio-section-label">04 / About</p>
          <div>
            <h2 id="about-title">Backend foundations, architectural thinking, and a practical eye for product.</h2>
            <div class="portfolio-about__copy">
              <p>My experience is primarily in backend software engineering and architecture: designing services, shaping domain models, integrating systems, and making technical choices that hold up over time.</p>
              <p>I also have frontend experience and enjoy working across the product when needed. Right now, I’m expanding into AI and exploring how it can improve useful, well-engineered software.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" class="portfolio-section portfolio-contact" aria-labelledby="contact-title">
        <div class="portfolio-container">
          <p class="portfolio-section-label">05 / Contact</p>
          <div class="portfolio-contact__heading">
            <h2 id="contact-title">Let’s build something useful.</h2>
            <a class="portfolio-contact__cta" href="https://www.linkedin.com/in/lucas-van-der-kleij" target="_blank" rel="noopener noreferrer">Connect on LinkedIn <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg></a>
          </div>
          <div class="portfolio-contact__cards">
            <div><span class="portfolio-contact__icon">@</span><strong>Email</strong><small>Available on request</small></div>
            <a href="https://www.linkedin.com/in/lucas-van-der-kleij" target="_blank" rel="noopener noreferrer" aria-label="Lucas van der Kleij on LinkedIn"><span class="portfolio-contact__icon">in</span><strong>LinkedIn</strong><small>Connect on LinkedIn</small></a>
            <a href="https://github.com/lvdkleij" target="_blank" rel="noopener noreferrer" aria-label="Lucas van der Kleij on GitHub"><span class="portfolio-contact__icon">git</span><strong>GitHub</strong><small>View GitHub profile</small></a>
          </div>
        </div>
      </section>
    </main>

    <footer class="portfolio-footer">
      <div class="portfolio-container">
        <a href="#top">lucasvanderkleij.dev</a>
        <p>© Lucas van der Kleij. All rights reserved.</p>
      </div>
    </footer>

    <PortfolioAssistant />
  </div>
</template>
