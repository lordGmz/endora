// Palette de commandes (⌘K) : ouvrir une requête, une collection, changer d'environnement ou lancer
// une action, au clavier.

import { useEffect, useMemo, useRef, useState } from 'react'
import { t } from '@shared/i18n'
import { flattenRequests, rank } from '@shared/search'
import { comboLabel, effectiveShortcuts, type ShortcutAction } from '@shared/shortcuts'
import { dispatch, useLayout } from '../shortcuts'
import { useEnvironments } from '../stores/environments'
import { isMac, useSettings } from '../stores/settings'
import { useTabs } from '../stores/tabs'
import { useWorkspace } from '../stores/workspace'

type Kind = 'command' | 'request' | 'collection' | 'environment'

interface Entry {
  id: string
  kind: Kind
  label: string
  detail?: string
  method?: string
  /** Mots trouvables en plus du libellé (URL, méthode, chemin). */
  keywords?: string[]
  hint?: string
  run: () => void
}

function useEntries(): Entry[] {
  const collections = useWorkspace((s) => s.collections)
  const { environments, activeId } = useEnvironments()
  const overrides = useSettings((s) => s.settings.shortcuts)
  return useMemo(() => {
    const shortcuts = effectiveShortcuts(overrides)
    const tabs = useTabs.getState()
    const command = (id: string, label: string, run: () => void, action?: ShortcutAction): Entry => ({
      id: `cmd:${id}`,
      kind: 'command',
      label,
      hint: action && shortcuts[action][0] ? comboLabel(shortcuts[action][0], isMac) : undefined,
      run
    })
    const commands: Entry[] = [
      command('new', t('palette.newRequest'), () => dispatch('newTab'), 'newTab'),
      command('import', t('palette.import'), () => dispatch('import'), 'import'),
      command('sidebar', t('palette.toggleSidebar'), () => dispatch('toggleSidebar'), 'toggleSidebar'),
      command('console', t('palette.toggleConsole'), () => dispatch('toggleConsole'), 'toggleConsole'),
      command('reopen', t('palette.reopenTab'), () => dispatch('reopenTab'), 'reopenTab'),
      command('mocks', t('palette.mocks'), () => tabs.openView({ kind: 'mocks' })),
      command('globals', t('palette.globals'), () => tabs.openView({ kind: 'globals' })),
      command('settings', t('palette.settings'), () => tabs.openSettings(), 'openSettings'),
      command('themes', t('palette.themes'), () => tabs.openSettings('themes')),
      command('shortcuts', t('palette.shortcuts'), () => tabs.openSettings('shortcuts'))
    ]
    const envs: Entry[] = [
      ...(activeId ? [{ id: 'env:none', kind: 'environment' as const, label: t('palette.noEnvironment'), run: () => useEnvironments.getState().setActive(null) }] : []),
      ...environments
        .filter((e) => e.id !== activeId)
        .map((e) => ({ id: `env:${e.id}`, kind: 'environment' as const, label: t('palette.useEnvironment', { name: e.name }), keywords: [e.name], run: () => useEnvironments.getState().setActive(e.id) }))
    ]
    const cols: Entry[] = collections.flatMap((c) => [
      { id: `col:${c.id}`, kind: 'collection' as const, label: c.name, run: () => tabs.openView({ kind: 'collection', collectionId: c.id }) },
      { id: `run:${c.id}`, kind: 'collection' as const, label: t('palette.runCollection', { name: c.name }), keywords: [c.name], run: () => tabs.openView({ kind: 'runner', collectionId: c.id }) }
    ])
    const requests: Entry[] = flattenRequests(collections).map((r) => ({
      id: `req:${r.collectionId}:${r.itemId}`,
      kind: 'request',
      label: r.name,
      detail: r.path.join(' › '),
      method: r.method,
      keywords: [r.method, r.url, ...r.path],
      run: () => tabs.openItem(r.collectionId, r.itemId, { preview: false })
    }))
    return [...requests, ...cols, ...envs, ...commands]
  }, [collections, environments, activeId, overrides])
}

export function CommandPalette() {
  const open = useLayout((s) => s.palette)
  return open ? <Palette onClose={() => useLayout.getState().setPalette(false)} /> : null
}

function Palette({ onClose }: { onClose: () => void }) {
  const entries = useEntries()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const list = useRef<HTMLUListElement>(null)
  // Chromium émet mousemove quand la liste défile sous un pointeur immobile : on ne suit que les vrais mouvements.
  const pointer = useRef<{ x: number; y: number } | null>(null)
  // Sans saisie : les commandes d'abord, puis le reste dans l'ordre.
  const results = useMemo(
    () => (query.trim() === '' ? [...entries.filter((e) => e.kind === 'command'), ...entries.filter((e) => e.kind !== 'command')].slice(0, 50) : rank(entries, query, (e) => [e.label, e.keywords])),
    [entries, query]
  )
  const current = Math.min(index, Math.max(0, results.length - 1))

  useEffect(() => {
    list.current?.querySelector('.active')?.scrollIntoView({ block: 'nearest' })
  }, [current, results])

  const choose = (e: Entry | undefined) => {
    if (!e) return
    onClose()
    e.run()
  }
  const kindLabel: Record<Kind, string> = {
    command: t('palette.kindCommand'),
    request: t('palette.kindRequest'),
    collection: t('palette.kindCollection'),
    environment: t('palette.kindEnvironment')
  }

  return (
    <div className="modal-backdrop palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-label={t('palette.title')}>
        <input
          autoFocus
          className="palette-input"
          value={query}
          placeholder={t('palette.placeholder')}
          aria-label={t('palette.title')}
          aria-controls="palette-results"
          aria-activedescendant={results[current] ? `palette-${current}` : undefined}
          onChange={(e) => {
            setQuery(e.target.value)
            setIndex(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setIndex((current + 1) % Math.max(1, results.length))
            else if (e.key === 'ArrowUp') setIndex((current - 1 + results.length) % Math.max(1, results.length))
            else if (e.key === 'Enter') choose(results[current])
            else if (e.key === 'Escape') onClose()
            else return
            e.preventDefault()
            e.stopPropagation()
          }}
        />
        <ul className="palette-results" id="palette-results" role="listbox" ref={list}>
          {results.length === 0 && <li className="palette-empty muted">{t('palette.noResults')}</li>}
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`palette-${i}`}
              role="option"
              aria-selected={i === current}
              className={i === current ? 'active' : ''}
              onMouseMove={(e) => {
                const moved = pointer.current && (pointer.current.x !== e.clientX || pointer.current.y !== e.clientY)
                pointer.current = { x: e.clientX, y: e.clientY }
                if (moved && i !== current) setIndex(i)
              }}
              onClick={() => choose(r)}
            >
              {r.method && <span className={`tab-method m-${r.method}`}>{r.method}</span>}
              <span className="palette-label">{r.label}</span>
              {r.detail && <span className="palette-detail">{r.detail}</span>}
              <span className="spacer" />
              {r.hint ? <span className="kbd">{r.hint}</span> : <span className="palette-kind">{kindLabel[r.kind]}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
