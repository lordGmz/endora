import { describe, expect, it } from 'vitest'
import { DENY_ALL_FILES, FileAllowlist } from './files'

describe('FileAllowlist', () => {
  it('n’autorise que les fichiers choisis, chemins normalisés', () => {
    const saved: string[][] = []
    const list = new FileAllowlist(['/tmp/a.png', 42, ''], (p) => saved.push(p))
    expect(list.policy('/tmp/a.png')).toBe(true)
    expect(list.policy('/tmp/x/../a.png')).toBe(true)
    expect(list.policy('/tmp/b.png')).toBe(false)
    expect(list.policy('')).toBe(false)
    list.allow('/tmp/b.png')
    expect(list.policy('/tmp/b.png')).toBe(true)
    expect(saved).toEqual([['/tmp/a.png', '/tmp/b.png']])
  })

  it('refuse tout par défaut', () => {
    expect(DENY_ALL_FILES('/etc/passwd')).toBe(false)
  })
})
