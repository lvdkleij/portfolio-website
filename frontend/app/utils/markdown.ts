import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true
})

const defaultLinkOpen = markdown.renderer.rules.link_open
markdown.renderer.rules.link_open = (tokens, index, options, environment, self) => {
  tokens[index]?.attrSet('target', '_blank')
  tokens[index]?.attrSet('rel', 'noopener noreferrer nofollow')
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, index, options, environment, self)
    : self.renderToken(tokens, index, options)
}

export function renderSafeMarkdown(source: string) {
  return DOMPurify.sanitize(markdown.render(source), {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'del', 'blockquote', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'a', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel']
  })
}
