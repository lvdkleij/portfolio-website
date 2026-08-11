import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '~/types/chat'
import { limitChatHistory } from '~/utils/chatHistory'

function message(index: number, length = 10): ChatMessage {
  return { id: String(index), role: index % 2 ? 'assistant' : 'user', content: String(index).repeat(length) }
}

describe('chat history limits', () => {
  it('keeps only the newest 12 messages', () => {
    const result = limitChatHistory(Array.from({ length: 15 }, (_, index) => message(index)))
    expect(result).toHaveLength(12)
    expect(result[0]?.id).toBe('3')
    expect(result.at(-1)?.id).toBe('14')
  })

  it('keeps the newest messages within the character budget', () => {
    const result = limitChatHistory([message(1, 12), message(2, 12), message(3, 12)], 12, 24)
    expect(result.map(item => item.id)).toEqual(['2', '3'])
  })

  it('clips an oversized newest message rather than dropping the request', () => {
    const result = limitChatHistory([message(1, 30)], 12, 20)
    expect(result).toHaveLength(1)
    expect(result[0]?.content).toHaveLength(20)
  })

  it('includes pasted job content in the total character budget', () => {
    const first = message(1, 10)
    const second: ChatMessage = {
      ...message(2, 10),
      attachment: { type: 'pasted_job', label: 'Role', content: 'x'.repeat(10) }
    }

    const result = limitChatHistory([first, second], 12, 20)
    expect(result.map(item => item.id)).toEqual(['2'])
  })
})
