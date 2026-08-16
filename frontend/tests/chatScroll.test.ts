import { describe, expect, it } from 'vitest';
import { resolveMessageAnchor } from '../app/utils/chatScroll';

describe('resolveMessageAnchor', () => {
  it('finds the assistant response inside the matching conversation turn', () => {
    document.body.innerHTML = `
      <main id="scroller">
        <section data-message-id="turn-1">
          <div class="question"><p>Prompt</p></div>
          <div class="answer-body">
            <div class="guest-answer">Response</div>
          </div>
        </section>
      </main>
    `;

    const scroller = document.getElementById('scroller');

    expect(scroller).not.toBeNull();
    expect(resolveMessageAnchor(scroller!, 'turn-1', 'response')?.textContent).toBe('Response');
    expect(resolveMessageAnchor(scroller!, 'turn-1', 'prompt')?.classList.contains('question')).toBe(true);
  });
});
