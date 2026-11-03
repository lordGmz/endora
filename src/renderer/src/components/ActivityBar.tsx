// Barre d'activité : accès direct aux vues de la barre latérale, aux services et aux paramètres.

import type { ReactNode } from 'react'
import { t } from '@shared/i18n'
import { useLayout, useSidebarShown, type SidebarView } from '../shortcuts'
import { useMocks } from '../stores/mocks'
import { useTabs } from '../stores/tabs'
import { CollectionsIcon, EnvironmentsIcon, GearIcon, HistoryIcon, ServicesIcon } from './icons'

function ActivityButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className={`activity-btn ${active ? 'active' : ''}`} onClick={onClick} title={label} aria-label={label} aria-pressed={active}>
      {children}
    </button>
  )
}

export function ActivityBar() {
  const sidebarVisible = useSidebarShown()
  const sidebarView = useLayout((s) => s.sidebarView)
  const activeView = useTabs((s) => s.tabs.find((x) => x.id === s.activeId)?.view?.kind)
  const runningMocks = useMocks((s) => s.mocks.filter((m) => m.running).length)
  const views: [SidebarView, string, ReactNode][] = [
    ['collections', t('sidebar.collections'), <CollectionsIcon key="c" size={20} />],
    ['environments', t('sidebar.environments'), <EnvironmentsIcon key="e" size={20} />],
    ['history', t('sidebar.history'), <HistoryIcon key="h" size={20} />]
  ]
  return (
    <nav className="activitybar" aria-label={t('app.activityBar')}>
      {views.map(([view, label, icon]) => (
        <ActivityButton key={view} label={label} active={sidebarVisible && sidebarView === view} onClick={() => useLayout.getState().showSidebarView(view)}>
          {icon}
        </ActivityButton>
      ))}
      <span className="activity-sep" />
      <ActivityButton
        label={runningMocks > 0 ? t('top.servicesRunning', { count: runningMocks }) : t('top.servicesTitle')}
        active={activeView === 'mocks'}
        onClick={() => useTabs.getState().openView({ kind: 'mocks' })}
      >
        <ServicesIcon size={20} />
        {runningMocks > 0 && <span className="activity-dot" />}
      </ActivityButton>
      <span className="spacer" />
      <ActivityButton label={t('common.settings')} active={activeView === 'settings'} onClick={() => useTabs.getState().openSettings()}>
        <GearIcon size={20} />
      </ActivityButton>
    </nav>
  )
}
