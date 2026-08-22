import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import StudioComposer from '~/components/StudioComposer.vue'
import { MAX_CHAT_PROMPT_LENGTH } from '~/utils/chatLimits'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('StudioComposer', () => {
  it('exposes the 500-character limit on the prompt input', () => {
    wrapper = mount(StudioComposer)

    const textarea = wrapper.get('textarea')
    expect(textarea.attributes('maxlength')).toBe(String(MAX_CHAT_PROMPT_LENGTH))
    expect(textarea.attributes('aria-describedby')).toBe('prompt-character-count')
  })

  it('shows the current count and highlights the final 50 characters', async () => {
    wrapper = mount(StudioComposer)
    const counter = wrapper.get('#prompt-character-count')

    expect(counter.text()).toBe(`0 / ${MAX_CHAT_PROMPT_LENGTH}`)

    await wrapper.get('textarea').setValue('x'.repeat(MAX_CHAT_PROMPT_LENGTH - 51))
    expect(counter.classes()).not.toContain('is-near-limit')

    await wrapper.get('textarea').setValue('x'.repeat(MAX_CHAT_PROMPT_LENGTH - 50))
    expect(counter.text()).toBe(`${MAX_CHAT_PROMPT_LENGTH - 50} / ${MAX_CHAT_PROMPT_LENGTH}`)
    expect(counter.classes()).toContain('is-near-limit')
  })

  it('emits normal messages unchanged', async () => {
    wrapper = mount(StudioComposer)
    await wrapper.get('textarea').setValue('Tell me about your work')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('send')).toEqual([[
      { prompt: 'Tell me about your work', attachment: undefined }
    ]])
  })

  it('clamps oversized input before submission', async () => {
    wrapper = mount(StudioComposer)
    const oversizedPrompt = 'x'.repeat(MAX_CHAT_PROMPT_LENGTH + 100)

    await wrapper.get('textarea').setValue(oversizedPrompt)
    expect(wrapper.get<HTMLTextAreaElement>('textarea').element.value).toHaveLength(MAX_CHAT_PROMPT_LENGTH)

    await wrapper.get('form').trigger('submit')
    const submission = wrapper.emitted('send')?.[0]?.[0] as { prompt: string }
    expect(submission.prompt).toHaveLength(MAX_CHAT_PROMPT_LENGTH)
  })
})
