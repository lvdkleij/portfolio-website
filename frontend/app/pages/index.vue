<script setup lang="ts">
useSeoMeta({
  title: 'Lucas van der Kleij — AI Engineer',
  description: 'Lucas van der Kleij — AI engineer and product-minded developer building clear, trustworthy digital products.',
  ogTitle: 'Lucas van der Kleij — AI Engineer',
  ogDescription: 'AI engineer and product-minded developer building clear, trustworthy digital products.',
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
          <p class="portfolio-kicker">AI engineer · Product-minded developer</p>
          <h1 id="portfolio-hero-title">Lucas van<br>der Kleij</h1>
          <p class="portfolio-hero__intro">I design and engineer thoughtful AI products where technical depth meets human clarity.</p>
          <a class="portfolio-primary-action" href="#work">
            Explore selected work
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
          <h2 id="manifesto-title">I turn complex AI systems into <em>clear products</em> people can understand—and build the foundations that make them <em>worthy of trust.</em></h2>
        </div>
      </section>

      <section id="work" class="portfolio-section portfolio-work" aria-labelledby="work-title">
        <div class="portfolio-container portfolio-section-rule">
          <div class="portfolio-section-heading">
            <div>
              <p class="portfolio-section-label">02 / Selected work</p>
              <h2 id="work-title">Ideas made tangible.</h2>
            </div>
            <p>Selected case studies and capability-led explorations across AI, product, and infrastructure.</p>
          </div>

          <article class="portfolio-project">
            <div class="portfolio-project__visual portfolio-project__visual--asterra" aria-hidden="true">
              <div class="portfolio-asterra-mockup">
                <div class="portfolio-asterra-mockup__top"><strong>Asterra</strong><span>Illustrative assistant</span></div>
                <div class="portfolio-asterra-mockup__body">
                  <div class="portfolio-asterra-mockup__rail"><i /><b /><b /><span /><span /></div>
                  <div class="portfolio-asterra-mockup__chat">
                    <div><strong>Good morning. How can I help?</strong><p>I can compare options using the information you choose to share.</p><p>Help me understand my savings options.</p></div>
                    <footer>Ask Alex a question <span>→</span></footer>
                  </div>
                </div>
              </div>
            </div>
            <div class="portfolio-project__copy">
              <span class="portfolio-accent-line" />
              <p class="portfolio-project__eyebrow">Flagship / Fictional case study</p>
              <h3>Asterra — AI banking assistant</h3>
              <p>A fictional European banking-assistant case study exploring customer-aware guidance, permissioned data use, product comparison, and a clear path to human handoff.</p>
              <p class="portfolio-project__tags">Product design · AI interaction · Front-end systems</p>
              <NuxtLink class="portfolio-text-link" to="/asterra">
                View the case study
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
              </NuxtLink>
            </div>
          </article>

          <article class="portfolio-project portfolio-project--reverse">
            <div class="portfolio-project__copy">
              <span class="portfolio-accent-line" />
              <p class="portfolio-project__eyebrow">Selected exploration / Systems</p>
              <h3>Cloud-native AI infrastructure</h3>
              <p>Exploring dependable foundations for AI products: observable services, disciplined deployment paths, secure integrations, and infrastructure designed to evolve.</p>
              <p class="portfolio-project__tags">Microsoft Azure · Software architecture · Operations</p>
              <a class="portfolio-text-link" href="#contact">Start a conversation <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg></a>
            </div>
            <div class="portfolio-project__visual portfolio-project__visual--topology" aria-hidden="true">
              <div class="portfolio-topology">
                <header>Service topology <i /></header>
                <div class="portfolio-topology__flow"><span>Interface</span><b /><span>AI service</span><b /><span>Cloud</span></div>
                <footer><span>Observable</span><span>Permissioned</span><span>Resilient</span></footer>
              </div>
            </div>
          </article>

          <article class="portfolio-project">
            <div class="portfolio-project__visual portfolio-project__visual--flow" aria-hidden="true">
              <div class="portfolio-agent-flow">
                <span>Intent<i /></span><b>01<br>Understand</b><b>02<br>Clarify</b><strong>03 / Guide with context</strong><span>04 / Confirm control</span><span>05<br>Handoff</span>
              </div>
            </div>
            <div class="portfolio-project__copy">
              <span class="portfolio-accent-line" />
              <p class="portfolio-project__eyebrow">Selected exploration / Experience</p>
              <h3>Human-centred agent experiences</h3>
              <p>Designing agent interactions that explain their reasoning, respect permissions, preserve user control, and know when a human should take over.</p>
              <p class="portfolio-project__tags">Interaction design · Responsible AI · Prototyping</p>
              <a class="portfolio-text-link" href="#contact">Explore an idea together <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg></a>
            </div>
          </article>
        </div>
      </section>

      <section class="portfolio-section portfolio-capabilities" aria-labelledby="capabilities-title">
        <div class="portfolio-container">
          <p class="portfolio-section-label">03 / Capabilities</p>
          <h2 id="capabilities-title">Across product and system.</h2>
          <div class="portfolio-capability-list">
            <article><span>01</span><h3>AI product engineering</h3><p>From interaction models and prototypes to robust product implementation.</p><small>Build</small></article>
            <article><span>02</span><h3>Full-stack systems</h3><p>Coherent interfaces, services, integrations, and data flows built as one product.</p><small>Engineer</small></article>
            <article><span>03</span><h3>Azure infrastructure</h3><p>Cloud foundations shaped around security, observability, and maintainability.</p><small>Operate</small></article>
            <article><span>04</span><h3>Responsible AI</h3><p>Permission-aware experiences with transparency, control, and human escalation.</p><small>Trust</small></article>
          </div>
        </div>
      </section>

      <section id="about" class="portfolio-section portfolio-about" aria-labelledby="about-title">
        <div class="portfolio-container portfolio-about__grid">
          <p class="portfolio-section-label">04 / About</p>
          <div>
            <h2 id="about-title">Bridging product thinking and engineering craft.</h2>
            <div class="portfolio-about__copy">
              <p>I approach AI as a product discipline, not just a model choice. The experience, infrastructure, permissions, and handoffs all shape whether a system is genuinely useful.</p>
              <p>My work moves between product design and software engineering—turning ambiguity into clear interfaces and durable technical foundations.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" class="portfolio-section portfolio-contact" aria-labelledby="contact-title">
        <div class="portfolio-container">
          <p class="portfolio-section-label">05 / Contact</p>
          <div class="portfolio-contact__heading">
            <h2 id="contact-title">Let’s build something useful.</h2>
            <span class="portfolio-contact__cta" aria-disabled="true">Start a conversation <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg></span>
          </div>
          <div class="portfolio-contact__cards">
            <div><span class="portfolio-contact__icon">@</span><strong>Email</strong><small>Available on request</small></div>
            <div><span class="portfolio-contact__icon">in</span><strong>LinkedIn</strong><small>Profile link forthcoming</small></div>
            <div><span class="portfolio-contact__icon">git</span><strong>GitHub</strong><small>Profile link forthcoming</small></div>
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
