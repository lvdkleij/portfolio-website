// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderSafeMarkdown } from '~/utils/markdown'

describe('Markdown rendering', () => {
  it('preserves a heading at the beginning of a reply', () => {
    const rendered = renderSafeMarkdown('## Experience\n\n**Spring Boot** microservices.')

    expect(rendered).toMatch(/^<h2>Experience<\/h2>/)
    expect(rendered).toContain('<p><strong>Spring Boot</strong> microservices.</p>')
  })

  it('renders the response structures supported by the chat UI', () => {
    const rendered = renderSafeMarkdown([
      'Introductory paragraph.',
      '',
      '## Response',
      '',
      'A paragraph with **strong emphasis** and [a source](https://example.com).',
      '',
      '- First item',
      '- Second item',
      '',
      '```ts',
      'const streaming = true',
      '```'
    ].join('\n'))

    expect(rendered).toContain('<h2>Response</h2>')
    expect(rendered).toContain('<p>A paragraph with <strong>strong emphasis</strong>')
    expect(rendered).toContain('<ul>')
    expect(rendered).toContain('<li>First item</li>')
    expect(rendered).toContain('<a href="https://example.com"')
    expect(rendered).toContain('<pre><code')
    expect(rendered).toContain('const streaming = true\n</code></pre>')
  })

  it('renders Markdown while removing unsafe HTML and URL schemes', () => {
    const rendered = renderSafeMarkdown([
      '**Safe content**',
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '[bad](javascript:alert(1))',
      '[good](https://example.com)'
    ].join('\n\n'))

    expect(rendered).toContain('<strong>Safe content</strong>')
    expect(rendered).not.toContain('<script')
    expect(rendered).not.toContain('<img')
    expect(rendered).not.toContain('href="javascript:')
    expect(rendered).toContain('href="https://example.com"')
    expect(rendered).toContain('rel="noopener noreferrer nofollow"')
  })

  it('does not permit raw HTML', () => {
    expect(renderSafeMarkdown('<strong onclick="alert(1)">hello</strong>')).not.toContain('<strong')
  })

  it('keeps incomplete streamed Markdown safe at every stage', () => {
    const fragments = [
      '## Res',
      'ponse\n\n**still streaming',
      '\n\n<script>alert(1)</scr'
    ]
    let accumulated = ''

    for (const fragment of fragments) {
      accumulated += fragment
      const rendered = renderSafeMarkdown(accumulated)
      expect(rendered).not.toContain('<script')
      expect(rendered).not.toContain('onclick=')
    }
  })
})
