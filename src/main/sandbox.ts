// Exécution des scripts utilisateur dans des fenêtres cachées isolées (même principe que la page
// sandbox du client de référence) :
// - renderer Chromium sandboxé, sans Node, isolation de contexte, session dédiée ;
// - aucun accès réseau : CSP `connect-src 'none'` et requêtes bloquées au niveau de la session
//   (le réseau de `pm.sendRequest` passe par le process principal) ;
// - une fenêtre neuve par exécution, détruite à la fin : un script ne peut rien laisser derrière
//   lui (globales modifiées, minuteries) pour observer les exécutions suivantes, d'une autre
//   collection par exemple. Le code des scripts atteint toujours le domaine JavaScript de la page
//   (les objets `pm` en viennent), d'où cette isolation par processus plutôt que par iframe ;
// - chaque canal (`done`, `http`…) n'est accepté que de la fenêtre qui exécute ce script ;
// - une fenêtre de réserve est préchargée pour masquer le coût de création, puis libérée après
//   une minute sans exécution ;
// - délai dépassé (boucle infinie…) : la fenêtre est détruite.

import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, session, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron'
import type { MockScriptInput, MockScriptOutput } from '@shared/scripting/mock-runtime'
import type { SandboxHttpRequest, SandboxHttpResult, ScriptExecution, ScriptOutcome } from '@shared/scripting/types'
import { getLocale, t } from '@shared/i18n'

export const SANDBOX_IPC = {
  run: 'sandbox:run',
  done: 'sandbox:done',
  http: 'sandbox:http',
  ready: 'sandbox:ready',
  mockRun: 'sandbox:mock-run',
  mockDone: 'sandbox:mock-done'
} as const

const PARTITION = 'endora-sandbox'
const LOAD_TIMEOUT_MS = 15_000
const SPARE_IDLE_MS = 60_000

/** Fenêtre d'exécution, à usage unique. */
interface Slot {
  win: BrowserWindow
  ready: Promise<void>
  markReady: () => void
}

/** Exécution en cours, rattachée à la fenêtre (webContents) qui seule peut y répondre. */
interface Pending<T> {
  owner: number
  finish: (result: T) => void
  fail: (message: string) => void
}

interface PendingScript extends Pending<ScriptOutcome> {
  sendRequest: (req: SandboxHttpRequest) => Promise<SandboxHttpResult>
}

const mockFailure = (input: MockScriptInput, error: string): MockScriptOutput => ({ ok: false, error, response: input.response, state: input.state, logs: [] })

function failure(exec: ScriptExecution, message: string): ScriptOutcome {
  return {
    ok: false,
    error: { message, source: exec.scripts[0]?.source ?? 'Script' },
    request: exec.request,
    mutations: [],
    tests: [],
    logs: [],
    skipRequest: false,
    sentRequests: []
  }
}

export class ScriptSandbox {
  private readonly slots = new Map<number, Slot>()
  private spare: Slot | null = null
  private spareTimer: ReturnType<typeof setTimeout> | null = null
  private sessionReady = false
  private readonly pending = new Map<string, PendingScript>()
  private readonly pendingMock = new Map<string, Pending<MockScriptOutput>>()

  constructor() {
    ipcMain.on(SANDBOX_IPC.ready, (event) => {
      this.slots.get(event.sender.id)?.markReady()
    })
    ipcMain.on(SANDBOX_IPC.done, (event: IpcMainEvent, id: string, outcome: ScriptOutcome) => {
      const p = this.pending.get(id)
      if (p && p.owner === event.sender.id) p.finish(outcome)
    })
    ipcMain.on(SANDBOX_IPC.mockDone, (event: IpcMainEvent, id: string, output: MockScriptOutput) => {
      const p = this.pendingMock.get(id)
      if (p && p.owner === event.sender.id) p.finish(output)
    })
    ipcMain.handle(SANDBOX_IPC.http, async (event: IpcMainInvokeEvent, id: string, req: SandboxHttpRequest): Promise<SandboxHttpResult> => {
      const p = this.pending.get(id)
      if (!p || p.owner !== event.sender.id) return { ok: false, error: t('sandbox.unknown') }
      return p.sendRequest(req)
    })
  }

  /** Session commune aux fenêtres d'exécution : seuls les fichiers de l'app (ou le serveur de dev) se chargent. */
  private sandboxSession(): Electron.Session {
    const ses = session.fromPartition(PARTITION)
    if (this.sessionReady) return ses
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    ses.webRequest.onBeforeRequest((details, callback) => {
      const allowed = details.url.startsWith('file://') || (devUrl !== undefined && details.url.startsWith(devUrl)) || details.url === 'about:blank'
      callback({ cancel: !allowed })
    })
    ses.setPermissionRequestHandler((_wc, _perm, callback) => callback(false))
    this.sessionReady = true
    return ses
  }

  private create(): Slot {
    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        preload: join(import.meta.dirname, '../preload/sandbox.cjs'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        session: this.sandboxSession(),
        backgroundThrottling: false,
        devTools: !app.isPackaged,
        spellcheck: false
      }
    })
    const id = win.webContents.id
    let markReady: () => void = () => undefined
    const ready = new Promise<void>((resolve) => {
      markReady = resolve
    })
    const slot: Slot = { win, ready, markReady }
    this.slots.set(id, slot)
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    win.webContents.on('will-navigate', (e) => e.preventDefault())
    win.webContents.on('render-process-gone', () => {
      this.failOwnedBy(id, t('sandbox.crashed'))
      this.release(slot)
    })
    win.on('closed', () => {
      this.slots.delete(id)
      if (this.spare === slot) this.spare = null
    })
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) void win.loadURL(`${devUrl}/sandbox.html`)
    else void win.loadFile(join(import.meta.dirname, '../renderer/sandbox.html'))
    return slot
  }

  /** Détruit une fenêtre d'exécution (fin, délai dépassé, plantage). */
  private release(slot: Slot): void {
    this.slots.delete(slot.win.webContents.id)
    if (this.spare === slot) this.spare = null
    if (!slot.win.isDestroyed()) slot.win.destroy()
  }

  /** Fenêtre prête à exécuter un script ; une nouvelle réserve est préparée pour la suivante. */
  private async acquire(): Promise<Slot | null> {
    const slot = this.spare && !this.spare.win.isDestroyed() ? this.spare : this.create()
    this.spare = null
    const loaded = await Promise.race([slot.ready.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), LOAD_TIMEOUT_MS))])
    if (!loaded || slot.win.isDestroyed()) {
      this.release(slot)
      return null
    }
    this.prepareSpare()
    return slot
  }

  private prepareSpare(): void {
    if (!this.spare || this.spare.win.isDestroyed()) this.spare = this.create()
    if (this.spareTimer) clearTimeout(this.spareTimer)
    this.spareTimer = setTimeout(() => {
      this.spareTimer = null
      if (this.spare) this.release(this.spare)
    }, SPARE_IDLE_MS)
  }

  private failOwnedBy(owner: number, message: string): void {
    for (const p of [...this.pending.values(), ...this.pendingMock.values()]) if (p.owner === owner) p.fail(message)
  }

  /** Exécute un travail dans une fenêtre neuve, détruite dès qu'il se termine (ou échoue). */
  private async execute<T, P extends Pending<T>>(
    id: string,
    map: Map<string, P>,
    entry: (base: Pending<T>) => P,
    onFailure: (message: string) => T,
    timeoutMs: number,
    start: (win: BrowserWindow) => void
  ): Promise<T> {
    const slot = await this.acquire()
    if (!slot) return onFailure(t('sandbox.unavailable'))
    return new Promise<T>((resolve) => {
      let settled = false
      const finish = (result: T) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (map.get(id)?.owner === slot.win.webContents.id) map.delete(id)
        this.release(slot)
        resolve(result)
      }
      // Une boucle infinie bloque la fenêtre : seule sa destruction l'arrête.
      const timer = setTimeout(() => finish(onFailure(t('sandbox.timeout', { seconds: Math.round(timeoutMs / 1000) }))), timeoutMs)
      map.set(id, entry({ owner: slot.win.webContents.id, finish, fail: (message) => finish(onFailure(message)) }))
      start(slot.win)
    })
  }

  /** Script d'un mock server : même isolation que les scripts de requêtes, sans réseau. */
  runMock(input: MockScriptInput, timeoutMs: number): Promise<MockScriptOutput> {
    return this.execute(
      input.id,
      this.pendingMock,
      (base) => base,
      (message) => mockFailure(input, message),
      timeoutMs,
      (win) => win.webContents.send(SANDBOX_IPC.mockRun, { ...input, locale: getLocale() })
    )
  }

  run(exec: ScriptExecution, sendRequest: PendingScript['sendRequest'], timeoutMs: number): Promise<ScriptOutcome> {
    return this.execute(
      exec.id,
      this.pending,
      (base) => ({ ...base, sendRequest }),
      (message) => failure(exec, message),
      timeoutMs,
      (win) => win.webContents.send(SANDBOX_IPC.run, { ...exec, locale: getLocale() })
    )
  }

  /** Ferme toutes les fenêtres ; les exécutions en cours échouent. */
  dispose(): void {
    for (const p of [...this.pending.values(), ...this.pendingMock.values()]) p.fail(t('sandbox.closed'))
    if (this.spareTimer) clearTimeout(this.spareTimer)
    this.spareTimer = null
    for (const slot of [...this.slots.values()]) this.release(slot)
    this.spare = null
  }
}
