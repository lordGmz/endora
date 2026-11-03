import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { emptyDraft, HISTORY_LIMIT, type HistoryEntry } from '@shared/model'
import type { MockConfig } from '@shared/mock'
import { DEFAULT_SETTINGS } from '@shared/settings'
import { newVariable } from '@shared/variables'
import { WorkspaceStorage, type SecretCipher } from './storage'

/** Chiffreur de test réversible (le vrai utilise le trousseau du système). */
const cipher: SecretCipher = {
  encrypt: (t) => Buffer.from(`sealed:${t}`).toString('base64'),
  decrypt: (d) => {
    const t = Buffer.from(d, 'base64').toString()
    if (!t.startsWith('sealed:')) throw new Error('bad')
    return t.slice(7)
  }
}

let root: string
let storage: WorkspaceStorage

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'endora-storage-'))
  storage = new WorkspaceStorage(root)
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

const entry = (i: number): HistoryEntry => ({ id: `h${i}`, createdAt: new Date(i).toISOString(), request: emptyDraft() })

describe('WorkspaceStorage', () => {
  it('démarre vide sans erreur', async () => {
    expect(await storage.load()).toEqual({
      collections: [],
      history: [],
      session: null,
      environments: [],
      globals: [],
      settings: DEFAULT_SETTINGS,
      warnings: []
    })
  })

  it('persiste collections, historique et session', async () => {
    expect(await storage.saveCollection('abc-1', { info: { name: 'A' }, item: [] })).toEqual({ ok: true })
    await storage.saveHistory([entry(1)])
    await storage.saveSession({ tabs: [], activeTabId: null })
    const loaded = await storage.load()
    expect(loaded.collections).toEqual([{ info: { name: 'A' }, item: [] }])
    expect(loaded.history).toHaveLength(1)
    expect(loaded.session).toEqual({ tabs: [], activeTabId: null })

    await storage.deleteCollection('abc-1')
    expect((await storage.load()).collections).toEqual([])
  })

  it('refuse les identifiants qui sortiraient du dossier', async () => {
    for (const id of ['../x', 'a/b', '', '..', 'a.json', 42]) {
      expect(await storage.saveCollection(id, { item: [] })).toMatchObject({ ok: false })
      expect(await storage.deleteCollection(id)).toMatchObject({ ok: false })
    }
    await expect(readdir(root)).resolves.toEqual([])
  })

  it('sérialise les écritures concurrentes : la dernière gagne et aucun fichier temporaire ne reste', async () => {
    await Promise.all(Array.from({ length: 20 }, (_, i) => storage.saveCollection('c', { info: { name: `v${i}` }, item: [] })))
    await storage.flush()
    const text = await readFile(join(root, 'collections', 'c.json'), 'utf8')
    expect(JSON.parse(text)).toEqual({ info: { name: 'v19' }, item: [] })
    expect(await readdir(join(root, 'collections'))).toEqual(['c.json'])
  })

  it('borne la taille de l’historique', async () => {
    await storage.saveHistory(Array.from({ length: HISTORY_LIMIT + 5 }, (_, i) => entry(i)))
    expect((await storage.load()).history).toHaveLength(HISTORY_LIMIT)
  })

  it('signale un fichier corrompu sans bloquer le reste', async () => {
    await mkdir(join(root, 'collections'), { recursive: true })
    await writeFile(join(root, 'collections', 'bad.json'), '{ pas du json')
    await storage.saveCollection('good', { info: { name: 'G' }, item: [] })
    const loaded = await storage.load()
    expect(loaded.collections).toHaveLength(1)
    expect(loaded.warnings[0]).toMatch(/^bad\.json/)
  })

  it('persiste environnements, globales et réglages, avec secrets chiffrés sur disque', async () => {
    const sealed = new WorkspaceStorage(root, cipher)
    const secret = { ...newVariable('token', 'initial-secret', 'secret'), current: 'courant-secret' }
    await sealed.saveEnvironment({ id: 'env-1', name: 'Prod', values: [newVariable('host', 'h'), secret] })
    await sealed.saveGlobals([{ ...newVariable('g', 'gs', 'secret') }])
    await sealed.saveSettings({ ...DEFAULT_SETTINGS, general: { ...DEFAULT_SETTINGS.general, httpVersion: 'http2' } })
    await sealed.saveCollection('c1', { info: { name: 'C' }, item: [], variable: [{ key: 'k', value: 'cs', type: 'secret' }] })

    const raw = await readFile(join(root, 'environments', 'env-1.json'), 'utf8')
    expect(raw).not.toContain('initial-secret')
    expect(raw).not.toContain('courant-secret')
    expect(raw).toContain('"host"')
    expect(await readFile(join(root, 'globals.json'), 'utf8')).not.toContain('gs')
    expect(await readFile(join(root, 'collections', 'c1.json'), 'utf8')).not.toContain('"cs"')

    const loaded = await sealed.load()
    expect(loaded.warnings).toEqual([])
    expect(loaded.environments[0]!.values[1]).toMatchObject({ key: 'token', value: 'initial-secret', current: 'courant-secret', type: 'secret' })
    expect(loaded.globals[0]).toMatchObject({ key: 'g', value: 'gs' })
    expect(loaded.settings.general.httpVersion).toBe('http2')
    expect((loaded.collections[0] as { variable: unknown[] }).variable[0]).toMatchObject({ value: 'cs' })

    // Sans trousseau, une valeur chiffrée devient vide et un avertissement est émis.
    const plain = await new WorkspaceStorage(root, null).load()
    expect(plain.environments[0]!.values[1]!.value).toBe('')
    expect(plain.warnings.some((w) => w.includes('token'))).toBe(true)
  })

  it('chiffre les secrets de la version déployée des mocks et migre un ancien mocks.json', async () => {
    const sealed = new WorkspaceStorage(root, cipher)
    const snapshot = { info: { name: 'C' }, item: [], variable: [{ key: 'k', value: 'mock-secret', type: 'secret' }, { key: 'p', value: 'public' }] }
    const mock: MockConfig = {
      id: 'm1', name: 'M', collectionId: 'c1', port: 4010, publicAccess: false, apiKey: 'cle', autoDeploy: false,
      enableSession: true, script: '', enabled: true, createdAt: 'a', deployedAt: 'a', snapshot
    }
    await sealed.saveMocks([mock])
    const raw = await readFile(join(root, 'mocks.json'), 'utf8')
    expect(raw).not.toContain('mock-secret')
    expect(raw).toContain('public')
    expect((await sealed.loadMocks())[0]!.snapshot).toEqual(snapshot)

    // Fichier d'une version antérieure : secret en clair, réécrit chiffré au chargement.
    await writeFile(join(root, 'mocks.json'), JSON.stringify({ mocks: [mock] }))
    expect((await sealed.loadMocks())[0]!.snapshot).toEqual(snapshot)
    await sealed.flush()
    expect(await readFile(join(root, 'mocks.json'), 'utf8')).not.toContain('mock-secret')
  })

  it('chiffre les secrets d’auth (collections, historique, session) et migre les anciens fichiers', async () => {
    const sealed = new WorkspaceStorage(root, cipher)
    const v21 = (type: string, entries: Record<string, string>) => ({ type, [type]: Object.entries(entries).map(([key, value]) => ({ key, value, type: 'string' })) })
    const collection = {
      info: { name: 'C' },
      auth: v21('basic', { username: 'alice', password: 'mdp-collection' }),
      item: [{ name: 'R', request: { method: 'GET', url: 'http://x', auth: v21('bearer', { token: 'jeton-requete' }) }, response: [{ originalRequest: { auth: v21('apikey', { key: 'X-Key', value: 'cle-exemple' }) } }] }]
    }
    const draft = { ...emptyDraft(), auth: { type: 'oauth2' as const, params: { clientId: 'app', clientSecret: 'secret-client', accessToken: 'jeton-oauth' } } }
    await sealed.saveCollection('c1', collection)
    await sealed.saveHistory([{ ...entry(1), request: draft }])
    await sealed.saveSession({ tabs: [{ id: 't', draft }], activeTabId: 't' })

    const disk = (await Promise.all([join(root, 'collections', 'c1.json'), join(root, 'history.json'), join(root, 'session.json')].map((f) => readFile(f, 'utf8')))).join('\n')
    for (const secret of ['mdp-collection', 'jeton-requete', 'cle-exemple', 'secret-client', 'jeton-oauth']) expect(disk).not.toContain(secret)
    for (const visible of ['alice', 'X-Key', '"app"']) expect(disk).toContain(visible)

    const loaded = await sealed.load()
    expect(loaded.warnings).toEqual([])
    expect(loaded.collections[0]).toEqual(collection)
    expect(loaded.history[0]!.request.auth).toEqual(draft.auth)
    expect((loaded.session as unknown as { tabs: Array<{ draft: typeof draft }> }).tabs[0]!.draft.auth).toEqual(draft.auth)
    expect(await sealed.readCollection('c1')).toEqual(collection)

    // Fichiers d'une version antérieure (en clair) : lus tels quels puis réécrits chiffrés.
    await writeFile(join(root, 'collections', 'c1.json'), JSON.stringify(collection))
    await writeFile(join(root, 'history.json'), JSON.stringify([{ ...entry(1), request: draft }]))
    expect((await sealed.load()).collections[0]).toEqual(collection)
    await sealed.flush()
    expect(await readFile(join(root, 'collections', 'c1.json'), 'utf8')).not.toContain('mdp-collection')
    expect(await readFile(join(root, 'history.json'), 'utf8')).not.toContain('jeton-oauth')

    // Sans trousseau : valeur vide et avertissement, comme pour les variables secrètes.
    const plain = await new WorkspaceStorage(root, null).load()
    expect((plain.collections[0] as { auth: { basic: Array<{ value: string }> } }).auth.basic[1]!.value).toBe('')
    expect(plain.warnings.some((w) => w.includes('password'))).toBe(true)
  })

  it('refuse un environnement invalide et normalise des réglages corrompus', async () => {
    expect(await storage.saveEnvironment({ id: '../x', name: 'a', values: [] })).toMatchObject({ ok: false })
    await writeFile(join(root, 'settings.json'), JSON.stringify({ general: { httpVersion: 'http9', requestTimeoutMs: -5 }, theme: { mode: 'fixed', fixed: 'inconnu' } }))
    const s = (await storage.load()).settings
    expect(s.general.httpVersion).toBe('auto')
    expect(s.general.requestTimeoutMs).toBe(0)
    expect(s.theme).toMatchObject({ mode: 'fixed', fixed: 'endora-dark' })
  })
})
