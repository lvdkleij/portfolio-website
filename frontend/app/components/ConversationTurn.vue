<template>
  <section class="conversation-turn">
    <div class="customer-message">
      <p><slot name="prompt" /></p>
    </div>
    <div class="assistant-message">
      <div class="assistant-avatar" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M16 3.5 19.2 12.8 28.5 16l-9.3 3.2L16 28.5l-3.2-9.3L3.5 16l9.3-3.2L16 3.5Z" stroke="currentColor" stroke-width="1.5" />
          <circle cx="16" cy="16" r="3" fill="currentColor" />
        </svg>
      </div>
      <div class="assistant-message-content">
        <div class="assistant-label">Alex</div>
        <div class="answer-body"><slot name="answer" /></div>
      </div>
    </div>
  </section>
</template>
