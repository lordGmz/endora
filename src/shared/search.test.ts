import { describe, expect, it } from 'vitest'
import type { Collection, RequestDraft } from './model'
import { flattenRequests, fold, matchScore, rank } from './search'

const req = (id: string, name: string, method: string, url: string) => ({ type: 'request' as const, id, name, request: { method, url } as RequestDraft })
const collection = {
  id: 'shop',
  name: 'Shop API',
  auth: null,
  variables: [],
  scripts: { prerequest: '', test: '' },
  items: [
    { type: 'folder', id: 'f', name: 'Users', auth: null, scripts: { prerequest: '', test: '' }, items: [req('a', 'List users', 'GET', '/users'), req('b', 'Créer un utilisateur', 'POST', '/users')] },
    req('c', 'Health', 'GET', '/health')
  ]
} as Collection

describe('flattenRequests', () => {
  it('liste les requêtes avec leur chemin', () => {
    expect(flattenRequests([collection]).map((r) => [r.name, r.path.join(' › ')])).toEqual([
      ['List users', 'Shop API › Users'],
      ['Créer un utilisateur', 'Shop API › Users'],
      ['Health', 'Shop API']
    ])
  })
})

describe('matchScore', () => {
  it('ignore la casse et les accents', () => {
    expect(fold('Créer')).toBe('creer')
    expect(matchScore('creer', 'Créer un utilisateur')).not.toBeNull()
  })
  it('exige chaque mot, dans le libellé ou les champs annexes', () => {
    expect(matchScore('users post', 'Créer un utilisateur', ['POST', '/users'])).not.toBeNull()
    expect(matchScore('users delete', 'List users', ['GET', '/users'])).toBeNull()
  })
  it('une requête vide correspond à tout', () => {
    expect(matchScore('  ', 'Health')).toBe(0)
  })
})

describe('rank', () => {
  it('place en tête les libellés qui commencent par la requête', () => {
    const items = ['Get user', 'User settings', 'List users']
    expect(rank(items, 'user', (x) => [x])).toEqual(['User settings', 'Get user', 'List users'])
  })
  it('respecte la limite', () => {
    expect(rank(['a1', 'a2', 'a3'], 'a', (x) => [x], 2)).toHaveLength(2)
  })
})
