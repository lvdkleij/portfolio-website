import { describe, expect, it } from 'vitest'
import { renderSafeMarkdown } from '~/utils/markdown'

describe('Markdown rendering', () => {
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
})
