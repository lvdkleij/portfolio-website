import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const globalStyles = readFileSync(resolve(process.cwd(), 'app/assets/css/main.css'), 'utf8')

describe('route scroll styles', () => {
  it('limits the desktop scroll lock to the Asterra route', () => {
    expect(globalStyles).toContain('body:has(.asterra-app)')
    expect(globalStyles).not.toMatch(/@media \(min-width: 1024px\)[\s\S]*?\n\s{2}body \{\n\s{4}overflow: hidden;/)
  })
})
