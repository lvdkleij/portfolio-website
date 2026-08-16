export function resolveMessageAnchor(
  scroller: HTMLElement,
  messageId: string,
  target: 'prompt' | 'response'
): HTMLElement | null {
  const message = scroller.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(messageId)}"]`)
  if (!message) return null

  const prompt = message.querySelector<HTMLElement>('.question')
  const response = message.querySelector<HTMLElement>('.guest-answer') ?? message.querySelector<HTMLElement>('.answer-body')

  if (target === 'prompt') return prompt ?? message
  return response ?? prompt ?? message
}
