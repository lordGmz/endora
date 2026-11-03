// Recherche de la palette de commandes : requêtes des collections, et filtrage tolérant (sans accents,
// tous les mots requis, dans n'importe quel ordre).

import type { Collection, TreeItem } from './model'

export interface RequestEntry {
  collectionId: string
  itemId: string
  name: string
  method: string
  url: string
  /** Collection puis dossiers, du plus haut au plus proche. */
  path: string[]
}

/** Toutes les requêtes des collections, dans l'ordre de l'arbre. */
export function flattenRequests(collections: Collection[]): RequestEntry[] {
  const out: RequestEntry[] = []
  const walk = (collectionId: string, items: TreeItem[], path: string[]) => {
    for (const it of items) {
      if (it.type === 'folder') walk(collectionId, it.items, [...path, it.name])
      else out.push({ collectionId, itemId: it.id, name: it.name, method: it.request.method, url: it.request.url, path })
    }
  }
  for (const c of collections) walk(c.id, c.items, [c.name])
  return out
}

/** Minuscules sans accents : « Créer » trouve « creer ». */
export const fold = (s: string): string => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/**
 * Pertinence d'un élément pour la requête, ou `null` s'il ne correspond pas. Chaque mot doit figurer
 * dans le libellé ou dans les champs annexes ; un libellé qui commence par la requête passe devant.
 */
export function matchScore(query: string, label: string, extra: string[] = []): number | null {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0
  const main = fold(label)
  const rest = extra.map(fold).join(' ')
  let score = 0
  for (const w of words) {
    const at = main.indexOf(w)
    if (at === 0) score += 3
    else if (at > 0) score += main[at - 1] === ' ' ? 2 : 1
    else if (!rest.includes(w)) return null
  }
  return score
}

/** Éléments correspondants, les plus pertinents d'abord (ordre d'origine à égalité). */
export function rank<T>(items: T[], query: string, fields: (item: T) => [string, string[]?], limit = 50): T[] {
  return items
    .map((item, i) => {
      const [label, extra] = fields(item)
      return { item, i, score: matchScore(query, label, extra) }
    })
    .filter((x): x is { item: T; i: number; score: number } => x.score !== null)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.item)
}
