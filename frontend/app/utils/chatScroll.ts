export function resolveMessageAnchor(
  scroller: HTMLElement,
  messageId: string,
  target: 'prompt' | 'response',
): HTMLElement | null {
  const message = scroller.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(messageId)}"]`);
  if (!message) return null;

  const prompt = message.querySelector<HTMLElement>('.question');
  const response =
    message.querySelector<HTMLElement>('.guest-answer') ?? message.querySelector<HTMLElement>('.answer-body');

  if (target === 'prompt') return prompt ?? message;
  return response ?? prompt ?? message;
}

type FrameRequest = (callback: FrameRequestCallback) => number;
type FrameCancel = (handle: number) => void;

export function createFrameCoalescer(
  requestFrame: FrameRequest = (callback) => requestAnimationFrame(callback),
  cancelFrame: FrameCancel = (handle) => cancelAnimationFrame(handle),
) {
  let handle: number | undefined;
  let pendingTask: (() => void) | undefined;

  return {
    schedule(task: () => void) {
      pendingTask = task;
      if (handle !== undefined) return;

      handle = requestFrame(() => {
        handle = undefined;
        const run = pendingTask;
        pendingTask = undefined;
        run?.();
      });
    },
    cancel() {
      if (handle !== undefined) cancelFrame(handle);
      handle = undefined;
      pendingTask = undefined;
    },
  };
}
