// Réglages côté interface : édition, persistance et application du thème.

import { create } from 'zustand'
import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from '@shared/settings'
import { activeTheme, isThemeId, normalizeAppearance, THEMES, themeCssVariables, type Appearance, type Theme } from '@shared/themes'
import { t } from '@shared/i18n'
import { toast } from './ui'

export const isMac = navigator.platform.toLowerCase().includes('mac')

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

/**
 * Thème résolu et apparence, transmis par le process principal dans l'URL de la fenêtre (voir
 * createWindow) : JSON `{ theme, appearance }`, ou simple identifiant d'un thème intégré.
 */
function bootTheme(): { theme: Theme; appearance: Appearance } {
  const raw = new URLSearchParams(location.search).get('theme') ?? ''
  if (isThemeId(raw)) return { theme: THEMES[raw], appearance: normalizeAppearance(null) }
  try {
    const data = JSON.parse(raw) as { theme?: Theme; appearance?: unknown }
    const t = data.theme
    if (t && typeof t.id === 'string' && typeof t.dark === 'boolean' && t.colors && Object.values(t.colors).every((c) => typeof c === 'string')) {
      return { theme: t, appearance: normalizeAppearance(data.appearance) }
    }
  } catch {
    // Paramètre absent ou illisible : thème par défaut.
  }
  return { theme: activeTheme(DEFAULT_SETTINGS.theme, darkQuery.matches), appearance: normalizeAppearance(null) }
}
const boot = bootTheme()

interface SettingsState {
  settings: Settings
  systemDark: boolean
  theme: Theme
  init: (s: Settings) => void
  update: (fn: (s: Settings) => Settings) => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function applyTheme(theme: Theme, appearance: Appearance): void {
  const root = document.documentElement
  for (const [k, v] of Object.entries(themeCssVariables(theme, appearance))) root.style.setProperty(k, v)
  root.dataset['theme'] = theme.id
  root.dataset['mode'] = theme.dark ? 'dark' : 'light'
  root.dataset['tabs'] = appearance.tabStyle
  root.dataset['density'] = appearance.density
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  systemDark: darkQuery.matches,
  theme: boot.theme,

  init: (s) => {
    const settings = normalizeSettings(s)
    const theme = activeTheme(settings.theme, get().systemDark)
    applyTheme(theme, settings.theme.appearance)
    set({ settings, theme })
  },

  update: (fn) => {
    const settings = normalizeSettings(fn(get().settings))
    const theme = activeTheme(settings.theme, get().systemDark)
    applyTheme(theme, settings.theme.appearance)
    set({ settings, theme })
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void window.endora.saveSettings(useSettings.getState().settings).then((r) => {
        if (!r.ok) toast(t('store.settingsFailed', { message: r.message }), 'error')
      })
    }, 250)
  }
}))

// Mode « système » : le thème suit le passage clair/sombre de l'OS en direct.
darkQuery.addEventListener('change', (e) => {
  const { settings } = useSettings.getState()
  const theme = activeTheme(settings.theme, e.matches)
  applyTheme(theme, settings.theme.appearance)
  useSettings.setState({ systemDark: e.matches, theme })
})

applyTheme(boot.theme, boot.appearance)
