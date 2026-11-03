// Barre d'état : barre latérale, environnement actif, mocks lancés et console (avec ses erreurs).

import { t } from '@shared/i18n'
import { comboLabel, effectiveShortcuts } from '@shared/shortcuts'
import { useLayout, useSidebarShown } from '../shortcuts'
import { useConsole } from '../stores/console'
import { useEnvironments } from '../stores/environments'
import { useMocks } from '../stores/mocks'
import { isMac, useSettings } from '../stores/settings'
import { useTabs } from '../stores/tabs'
import { SidebarIcon, TerminalIcon } from './icons'

export function StatusBar() {
  const sidebarVisible = useSidebarShown()
  // Masquée par une vue pleine largeur : le bouton la rouvre en revenant à un onglet de travail.
  const hiddenByView = useLayout((s) => s.sidebarVisible) && !sidebarVisible
  const consoleOpen = useConsole((s) => s.open)
  const errors = useConsole((s) => s.entries.filter((e) => (e.kind === 'log' ? e.level === 'error' : !!e.error)).length)
  const env = useEnvironments((s) => s.environments.find((e) => e.id === s.activeId))
  const runningMocks = useMocks((s) => s.mocks.filter((m) => m.running).length)
  const overrides = useSettings((s) => s.settings.shortcuts)
  const shortcuts = effectiveShortcuts(overrides)
  const withCombo = (label: string, combo: string | undefined) => (combo ? `${label} (${comboLabel(combo, isMac)})` : label)
  const sidebarLabel = withCombo(sidebarVisible ? t('app.hideSidebar') : t('app.showSidebar'), shortcuts.toggleSidebar[0])

  return (
    <footer className="statusbar">
      <button className={`ghost status-item ${sidebarVisible ? 'on' : ''}`} onClick={() => (hiddenByView ? useLayout.getState().showSidebarView(useLayout.getState().sidebarView) : useLayout.getState().toggleSidebar())} title={sidebarLabel} aria-label={sidebarLabel}>
        <SidebarIcon />
      </button>
      <button
        className="ghost status-item"
        onClick={() => (env ? useTabs.getState().openView({ kind: 'environment', environmentId: env.id }) : useLayout.getState().showSidebarView('environments'))}
        title={t('env.active')}
      >
        <span className={`status-dot ${env ? 'on' : ''}`} />
        {env ? env.name : t('env.none')}
      </button>
      {runningMocks > 0 && (
        <button className="ghost status-item" onClick={() => useTabs.getState().openView({ kind: 'mocks' })}>
          {t('app.mocksRunning', { count: runningMocks })}
        </button>
      )}
      <span className="spacer" />
      <button className={`ghost status-item ${consoleOpen ? 'on' : ''}`} onClick={() => useConsole.getState().toggle()} title={withCombo(t('app.console'), shortcuts.toggleConsole[0])}>
        <TerminalIcon />
        {t('app.console')}
        {errors > 0 && <span className="badge fail-badge">{errors}</span>}
      </button>
    </footer>
  )
}
