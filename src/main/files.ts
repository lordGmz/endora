// Fichiers locaux lisibles par les requêtes (champs form-data de type fichier) : uniquement ceux
// que l'utilisateur a choisis dans le dialogue natif. Un chemin venu d'une collection importée,
// d'une variable ou d'un script n'est jamais lu tant qu'il n'a pas été choisi ici ; la liste est
// conservée d'une session à l'autre par le process principal (le renderer ne peut pas l'écrire).

import { resolve } from 'node:path'

/** Indique si un chemin peut être lu pour être envoyé. */
export type FilePolicy = (path: string) => boolean

/** Politique par défaut : aucun fichier local n'est lu. */
export const DENY_ALL_FILES: FilePolicy = () => false

const MAX_FILES = 1000

export const normalizePath = (path: string): string => resolve(path)

export class FileAllowlist {
  private readonly paths: Set<string>

  constructor(
    initial: unknown,
    private readonly save: (paths: string[]) => void = () => undefined
  ) {
    const list = Array.isArray(initial) ? initial.filter((p): p is string => typeof p === 'string' && p !== '') : []
    this.paths = new Set(list.slice(-MAX_FILES).map(normalizePath))
  }

  /** Autorise un fichier choisi par l'utilisateur ; les plus anciens sortent au-delà de la limite. */
  allow(path: string): void {
    const p = normalizePath(path)
    this.paths.delete(p)
    this.paths.add(p)
    while (this.paths.size > MAX_FILES) this.paths.delete(this.paths.values().next().value!)
    this.save([...this.paths])
  }

  readonly policy: FilePolicy = (path) => path !== '' && this.paths.has(normalizePath(path))
}
