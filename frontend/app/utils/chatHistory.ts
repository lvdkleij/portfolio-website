import type { ChatMessage } from '~/types/chat'

export const MAX_CHAT_MESSAGES = 12
export const MAX_CHAT_CHARACTERS = 24_000

function messageSize(message: ChatMessage) {
  return message.content.length + (message.attachment?.content.length ?? 0)
}

export function limitChatHistory(
  messages: ChatMessage[],
  maxMessages = MAX_CHAT_MESSAGES,
  maxCharacters = MAX_CHAT_CHARACTERS
) {
  const selected: ChatMessage[] = []
  let characters = 0

  for (let index = messages.length - 1; index >= 0 && selected.length < maxMessages; index--) {
    const message = messages[index]
    if (!message) continue
    const size = messageSize(message)

    if (selected.length > 0 && characters + size > maxCharacters) break

    if (selected.length === 0 && size > maxCharacters) {
      selected.unshift({
        ...message,
        content: message.content.slice(0, maxCharacters),
        attachment: undefined
      })
      break
    }

    selected.unshift(message)
    characters += size
  }

  return selected
}
