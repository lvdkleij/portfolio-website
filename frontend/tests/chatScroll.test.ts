import { describe, expect, it } from 'vitest';
import { createFrameCoalescer, resolveMessageAnchor } from '../app/utils/chatScroll';

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

  it('coalesces repeated work into one frame and supports cancellation', () => {
    let frameCallback: FrameRequestCallback | undefined;
    const cancelled: number[] = [];
    let requests = 0;
    const coalescer = createFrameCoalescer(
      (callback) => {
        requests += 1;
        frameCallback = callback;
        return requests;
      },
      (handle) => cancelled.push(handle),
    );
    const work: string[] = [];

    coalescer.schedule(() => work.push('stale'));
    coalescer.schedule(() => work.push('latest'));

    expect(requests).toBe(1);
    frameCallback?.(16);
    expect(work).toEqual(['latest']);

    coalescer.schedule(() => work.push('cancelled'));
    coalescer.cancel();

    expect(cancelled).toEqual([2]);
    expect(work).toEqual(['latest']);
  });
});
