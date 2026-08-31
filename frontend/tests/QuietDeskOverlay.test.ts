// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import QuietDeskOverlay from '~/components/QuietDeskOverlay.vue';

enableAutoUnmount(afterEach);

const encoder = new TextEncoder();
let streamController: ReadableStreamDefaultController<Uint8Array>;
let requestSignal: AbortSignal | undefined;

async function streamingResponse(_input: RequestInfo | URL, init?: RequestInit) {
  requestSignal = init?.signal ?? undefined;
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller;
        requestSignal?.addEventListener(
          'abort',
          () => controller.error(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      },
    }),
    { headers: { 'content-type': 'text/event-stream' } },
  );
}

const fetchSpy = vi.fn(streamingResponse);
const examplePrompts = [
  'What do you work with?',
  "What's your background?",
  'How can I reach you?',
];

async function settle() {
  await vi.advanceTimersByTimeAsync(0);
  await nextTick();
}

async function emitDelta(text: string) {
  streamController.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ type: 'delta', text })}\n\n`));
  await settle();
}

async function finishReply(text = 'A streamed answer about Lucas.') {
  if (text) await emitDelta(text);
  streamController.enqueue(encoder.encode('event: done\ndata: {"type":"done"}\n\n'));
  streamController.close();
  await settle();
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchSpy.mockReset();
  fetchSpy.mockImplementation(streamingResponse);
  requestSignal = undefined;
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('quiet desk conversation', () => {
  it('starts with the identity, one composer and example questions without a menu or dialog', () => {
    const wrapper = mount(QuietDeskOverlay);

    expect(wrapper.get('h1').text()).toBe('Lucas van der Kleij');
    expect(wrapper.get('.quiet-identity p').text()).toBe('Software engineer');
    expect(wrapper.find('nav, [role="dialog"], .portfolio-assistant').exists()).toBe(false);
    expect(wrapper.findAll('input')).toHaveLength(1);
    expect(wrapper.get('#chat-input').attributes()).toMatchObject({
      placeholder: 'Ask me anything…',
      maxlength: '2000',
    });
    expect(wrapper.get('#chat-form').attributes('aria-label')).toBe('Ask me anything');
    expect(wrapper.get('#chat-send').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#conversation').attributes('hidden')).toBeDefined();
    expect(wrapper.get('#history-toggle').attributes('hidden')).toBeDefined();
    expect(wrapper.get('#transcript').attributes()).toMatchObject({
      role: 'log',
      'aria-label': 'Conversation history',
      'aria-live': 'off',
    });
    expect(wrapper.findAll('.prompt-chip').map(button => button.text())).toEqual(examplePrompts);
    expect(wrapper.findAll('.chat-message')).toHaveLength(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps the regular send button first in the native form submission order', () => {
    const wrapper = mount(QuietDeskOverlay, { attachTo: document.body });
    const form = wrapper.get<HTMLFormElement>('#chat-form').element;
    const submitters = Array.from(form.elements).filter(
      (element): element is HTMLButtonElement => element instanceof HTMLButtonElement && element.type === 'submit',
    );

    // An earlier form-associated example button would make Enter send its
    // suggestion instead of the visitor's typed message.
    expect(submitters[0]?.id).toBe('chat-send');
    expect(submitters.slice(1).map(button => button.dataset.prompt)).toEqual(examplePrompts);
  });

  it('posts to Lucas AI and updates the same reply while chunks are still arriving', async () => {
    const wrapper = mount(QuietDeskOverlay, { attachTo: document.body });
    await wrapper.get('#chat-input').setValue('  Tell me about Lucas  ');
    await wrapper.get('#chat-form').trigger('submit');

    expect(wrapper.get('#conversation').attributes('hidden')).toBeUndefined();
    expect(wrapper.get('.chat-message--user').text()).toBe('Tell me about Lucas');
    expect(wrapper.get('.chat-message--assistant').text()).toContain('Thinking…');
    expect(document.activeElement).toBe(wrapper.get('#chat-input').element);
    const replyElement = wrapper.get('.chat-message--assistant').element;
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [endpoint, init] = fetchSpy.mock.calls[0]!;
    expect(endpoint).toBe('/api/v1/lucasai/stream');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { Accept: 'text/event-stream', 'Content-Type': 'application/json' },
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      clientRequestId: expect.any(String),
      messages: [{ id: expect.any(String), role: 'user', content: 'Tell me about Lucas' }],
    });

    await emitDelta('Hello 👋');
    expect(wrapper.get('.chat-message--assistant').element).toBe(replyElement);
    expect(wrapper.get('.chat-message--assistant .chat-message-body').text()).toContain('Hello 👋');
    expect(wrapper.get('.chat-message--assistant').text()).not.toContain('Thinking…');
    await wrapper.get('#chat-input').setValue('A follow-up draft');
    expect(wrapper.get('#chat-send').attributes('disabled')).toBeDefined();
    await emitDelta(' — I work with café systems.');
    expect(wrapper.get('.chat-message--assistant .chat-message-body').text()).toBe('Hello 👋 — I work with café systems.');
    await finishReply('');

    expect(wrapper.get('#chat-send').attributes('disabled')).toBeUndefined();
    expect(wrapper.get<HTMLInputElement>('#chat-input').element.value).toBe('A follow-up draft');
    expect(wrapper.get('#chat-announcement').attributes('role')).toBe('status');
    expect(wrapper.get('#chat-announcement').text()).toContain('Hello 👋 — I work with café systems.');
  });

  it('sends an example through the real stream without replacing the typed draft or focusing the input', async () => {
    const wrapper = mount(QuietDeskOverlay, { attachTo: document.body });
    await wrapper.get('#chat-input').setValue('My unfinished question');
    const suggestion = wrapper.get<HTMLButtonElement>('[data-prompt="What do you work with?"]');
    await wrapper.get('#chat-form').trigger('submit', { submitter: suggestion.element });

    expect(wrapper.get('.chat-message--user').text()).toBe('What do you work with?');
    expect(wrapper.get<HTMLInputElement>('#chat-input').element.value).toBe('My unfinished question');
    expect(wrapper.get('#prompt-suggestions').attributes('hidden')).toBeDefined();
    expect(document.activeElement).toBe(wrapper.get('#minimize-chat').element);
    expect(wrapper.findAll('.prompt-chip').every(button => button.attributes('disabled') !== undefined)).toBe(true);
    expect(JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body)).messages[0].content).toBe('What do you work with?');

    await finishReply('I work with Java, Kotlin and Spring Boot.');
    expect(wrapper.get('.chat-message--assistant').text()).toContain('I work with Java, Kotlin and Spring Boot.');
    expect(wrapper.get<HTMLInputElement>('#chat-input').element.value).toBe('My unfinished question');
    expect(document.activeElement).toBe(wrapper.get('#minimize-chat').element);
  });

  it('restores suggestions when minimized and prevents duplicate requests while a reply is pending', async () => {
    const wrapper = mount(QuietDeskOverlay, { attachTo: document.body });
    await wrapper.get('#chat-input').setValue('Hello');
    await wrapper.get('#chat-form').trigger('submit');
    await wrapper.get('#chat-input').setValue('Keep this draft');
    await wrapper.get('#minimize-chat').trigger('click');

    expect(wrapper.get('#conversation').attributes('hidden')).toBeDefined();
    expect(wrapper.get('#prompt-suggestions').attributes('hidden')).toBeUndefined();
    expect(wrapper.get('#history-toggle').attributes('hidden')).toBeUndefined();
    expect(document.activeElement).toBe(wrapper.get('#history-toggle').element);
    expect(wrapper.findAll('.prompt-chip').every(button => button.attributes('disabled') !== undefined)).toBe(true);
    await wrapper.get('#chat-form').trigger('submit', { submitter: wrapper.get('.prompt-chip').element });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.findAll('.chat-message--user')).toHaveLength(1);
    expect(wrapper.get<HTMLInputElement>('#chat-input').element.value).toBe('Keep this draft');

    await finishReply();
    expect(wrapper.get('#conversation').attributes('hidden')).toBeDefined();
    expect(document.activeElement).toBe(wrapper.get('#history-toggle').element);
    expect(wrapper.findAll('.prompt-chip').every(button => button.attributes('disabled') === undefined)).toBe(true);
    await wrapper.get('#history-toggle').trigger('click');
    expect(wrapper.get('#conversation').attributes('hidden')).toBeUndefined();
    expect(wrapper.get('#prompt-suggestions').attributes('hidden')).toBeDefined();
    expect(wrapper.get('.chat-message--assistant').text()).toContain('A streamed answer about Lucas.');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps all turns when minimized, sends only the latest user question, and does not persist the conversation', async () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    const wrapper = mount(QuietDeskOverlay);
    for (const question of ['Hello', 'What are your skills?']) {
      await wrapper.get('#chat-input').setValue(question);
      await wrapper.get('#chat-form').trigger('submit');
      await finishReply();
    }
    await wrapper.get('#minimize-chat').trigger('click');
    await wrapper.get('#history-toggle').trigger('click');

    expect(wrapper.findAll('.chat-message--user')).toHaveLength(2);
    expect(wrapper.findAll('.chat-message--assistant')).toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchSpy.mock.calls[1]?.[1]?.body)).messages).toEqual([
      { id: expect.any(String), role: 'user', content: 'What are your skills?' },
    ]);
    expect(storageSpy).not.toHaveBeenCalled();
    const fresh = mount(QuietDeskOverlay);
    expect(fresh.findAll('.chat-message')).toHaveLength(0);
    expect(fresh.get('#conversation').attributes('hidden')).toBeDefined();
    expect(fresh.get('#history-toggle').attributes('hidden')).toBeDefined();
  });

  it('ignores blank and duplicate pending submissions without losing the draft', async () => {
    const wrapper = mount(QuietDeskOverlay);
    await wrapper.get('#chat-input').setValue('   ');
    await wrapper.get('#chat-form').trigger('submit');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(wrapper.get('#conversation').attributes('hidden')).toBeDefined();
    await wrapper.get('#chat-input').setValue('Hello');
    await wrapper.get('#chat-form').trigger('submit');
    await wrapper.get('#chat-input').setValue('Repeated while thinking');
    await wrapper.get('#chat-form').trigger('submit');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.findAll('.chat-message--user')).toHaveLength(1);
    expect(wrapper.get<HTMLInputElement>('#chat-input').element.value).toBe('Repeated while thinking');
    await finishReply();
  });

  it('renders user text literally and renders only sanitized Markdown in replies', async () => {
    const wrapper = mount(QuietDeskOverlay);
    await wrapper.get('#chat-input').setValue('<img src=x onerror=alert(1)>');
    await wrapper.get('#chat-form').trigger('submit');
    expect(wrapper.get('.chat-message--user').text()).toBe('<img src=x onerror=alert(1)>');
    expect(wrapper.find('.chat-message--user img').exists()).toBe(false);

    await emitDelta('## Experience\n\n**Spring');
    expect(wrapper.find('.chat-message--assistant script, .chat-message--assistant img').exists()).toBe(false);
    await finishReply(' Boot** and [LinkedIn](https://www.linkedin.com/in/lucas-van-der-kleij).\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))');
    const reply = wrapper.get('.chat-message--assistant .chat-message-body');
    expect(reply.get('h2').text()).toBe('Experience');
    expect(reply.get('strong').text()).toBe('Spring Boot');
    expect(reply.find('script, img, [onclick], [onerror]').exists()).toBe(false);
    expect(reply.find('a[href^="javascript:"]').exists()).toBe(false);
    expect(reply.get('a[href="https://www.linkedin.com/in/lucas-van-der-kleij"]').attributes()).toMatchObject({
      target: '_blank',
      rel: 'noopener noreferrer nofollow',
    });
  });

  it('shows backend failures and allows a new request', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('', { status: 503 }));
    const wrapper = mount(QuietDeskOverlay);
    await wrapper.get('#chat-input').setValue('Hello');
    await wrapper.get('#chat-form').trigger('submit');
    await settle();

    expect(wrapper.get('[role="alert"]').text()).toContain('temporarily unavailable');
    expect(wrapper.get('.chat-message--assistant').text()).not.toContain('Thinking…');
    await wrapper.get('#chat-input').setValue('Try again');
    expect(wrapper.get('#chat-send').attributes('disabled')).toBeUndefined();
    await wrapper.get('#chat-form').trigger('submit');
    await finishReply('The backend is available again.');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(wrapper.get('#transcript').text()).toContain('The backend is available again.');
  });

  it('keeps partial output and reports an interrupted stream', async () => {
    const wrapper = mount(QuietDeskOverlay);
    await wrapper.get('#chat-input').setValue('Hello');
    await wrapper.get('#chat-form').trigger('submit');
    await emitDelta('Partial answer');
    streamController.error(new Error('Connection lost'));
    await settle();

    expect(wrapper.get('.chat-message--assistant').text()).toContain('Partial answer');
    expect(wrapper.get('[role="alert"]').text()).toContain('connection to the assistant was interrupted');
    await wrapper.get('#chat-input').setValue('Try again');
    expect(wrapper.get('#chat-send').attributes('disabled')).toBeUndefined();
  });

  it('aborts pending work and cancels scheduled work when unmounted', async () => {
    const wrapper = mount(QuietDeskOverlay);
    await wrapper.get('#chat-input').setValue('Hello');
    await wrapper.get('#chat-form').trigger('submit');
    expect(requestSignal?.aborted).toBe(false);
    wrapper.unmount();
    expect(requestSignal?.aborted).toBe(true);
    await settle();
    expect(vi.getTimerCount()).toBe(0);
  });
});
