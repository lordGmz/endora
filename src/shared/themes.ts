// Thèmes de l'interface : six palettes propres à Endora. Night Owl (S. Drasner) et Solarized
// (E. Schoonover) reprennent des palettes publiques sous licence MIT, pas des assets du client
// de référence.

export const THEME_IDS = ['endora-dark', 'vantablack', 'endora-light', 'night-owl', 'solarized-dark', 'solarized-light'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const DEFAULT_THEME_DARK: ThemeId = 'endora-dark'
export const DEFAULT_THEME_LIGHT: ThemeId = 'endora-light'

export const isThemeId = (v: unknown): v is ThemeId => typeof v === 'string' && (THEME_IDS as readonly string[]).includes(v)

export interface ThemeColors {
  bg: string
  bg2: string
  bg3: string
  border: string
  text: string
  muted: string
  accent: string
  accentText: string
  ok: string
  warn: string
  fail: string
  info: string
  purple: string
  selection: string
  /** Coloration syntaxique et variables. */
  string: string
  number: string
  keyword: string
  property: string
  comment: string
  variable: string
  variableUnresolved: string
}

export interface Theme {
  /** Identifiant d'un thème intégré (`ThemeId`) ou d'un thème personnalisé (`custom-…`). */
  id: string
  name: string
  dark: boolean
  colors: ThemeColors
}

export const THEMES: Record<ThemeId, Theme> = {
  'endora-dark': {
    id: 'endora-dark',
    name: 'Endora bleu nuit',
    dark: true,
    // Bleu nuit inspiré du mode « Dim » de l'ex-Twitter, accent bleu vif.
    colors: {
      bg: '#15202b', bg2: '#192734', bg3: '#22303c', border: '#38444d', text: '#f7f9f9', muted: '#8b98a5',
      accent: '#1d9bf0', accentText: '#ffffff', ok: '#00ba7c', warn: '#ffd400', fail: '#f4212e', info: '#7ecbff', purple: '#a78bfa',
      selection: 'rgba(29, 155, 240, 0.24)',
      string: '#7ee2a8', number: '#ffb86b', keyword: '#c4a5ff', property: '#7ecbff', comment: '#6e7f8d',
      variable: '#1d9bf0', variableUnresolved: '#f4212e'
    }
  },
  vantablack: {
    id: 'vantablack',
    name: 'Vantablack',
    dark: true,
    // Noir absolu pour les écrans OLED : fond et panneaux à #000, séparés par des bordures fines ;
    // seuls le survol et les états actifs se détachent. Texte légèrement adouci pour éviter le
    // halo du blanc pur sur fond noir.
    colors: {
      bg: '#000000', bg2: '#000000', bg3: '#141414', border: '#262626', text: '#e8e8e8', muted: '#8c8c8c',
      accent: '#1d9bf0', accentText: '#ffffff', ok: '#00ba7c', warn: '#ffd400', fail: '#f4212e', info: '#7ecbff', purple: '#a78bfa',
      selection: 'rgba(29, 155, 240, 0.3)',
      string: '#7ee2a8', number: '#ffb86b', keyword: '#c4a5ff', property: '#7ecbff', comment: '#6b6b6b',
      variable: '#1d9bf0', variableUnresolved: '#f4212e'
    }
  },
  'endora-light': {
    id: 'endora-light',
    name: 'Endora clair',
    dark: false,
    colors: {
      bg: '#ffffff', bg2: '#f7f9f9', bg3: '#eff3f4', border: '#cfd9de', text: '#0f1419', muted: '#536471',
      accent: '#1d9bf0', accentText: '#ffffff', ok: '#00875a', warn: '#b07d00', fail: '#e0245e', info: '#0a6ea8', purple: '#7856ff',
      selection: 'rgba(29, 155, 240, 0.16)',
      string: '#0a7d3e', number: '#b35900', keyword: '#7856ff', property: '#0a6ea8', comment: '#6e7781',
      variable: '#1d9bf0', variableUnresolved: '#e0245e'
    }
  },
  'night-owl': {
    id: 'night-owl',
    name: 'Night Owl (sombre)',
    dark: true,
    colors: {
      bg: '#011627', bg2: '#0b2236', bg3: '#122d42', border: '#1d3b53', text: '#d6deeb', muted: '#7e93a8',
      accent: '#82aaff', accentText: '#011627', ok: '#addb67', warn: '#ecc48d', fail: '#ef5350', info: '#7fdbca', purple: '#c792ea',
      selection: 'rgba(130, 170, 255, 0.22)',
      string: '#ecc48d', number: '#f78c6c', keyword: '#c792ea', property: '#7fdbca', comment: '#637777',
      variable: '#82aaff', variableUnresolved: '#ef5350'
    }
  },
  'solarized-dark': {
    id: 'solarized-dark',
    name: 'Solarized sombre',
    dark: true,
    colors: {
      bg: '#002b36', bg2: '#073642', bg3: '#0d4251', border: '#1c4b57', text: '#93a1a1', muted: '#657b83',
      accent: '#268bd2', accentText: '#fdf6e3', ok: '#859900', warn: '#b58900', fail: '#dc322f', info: '#2aa198', purple: '#6c71c4',
      selection: 'rgba(38, 139, 210, 0.25)',
      string: '#2aa198', number: '#d33682', keyword: '#859900', property: '#268bd2', comment: '#586e75',
      variable: '#268bd2', variableUnresolved: '#dc322f'
    }
  },
  'solarized-light': {
    id: 'solarized-light',
    name: 'Solarized clair',
    dark: false,
    colors: {
      bg: '#fdf6e3', bg2: '#eee8d5', bg3: '#e4ddc8', border: '#d3cbb4', text: '#586e75', muted: '#839496',
      accent: '#268bd2', accentText: '#fdf6e3', ok: '#859900', warn: '#b58900', fail: '#dc322f', info: '#2aa198', purple: '#6c71c4',
      selection: 'rgba(38, 139, 210, 0.18)',
      string: '#2aa198', number: '#d33682', keyword: '#859900', property: '#268bd2', comment: '#93a1a1',
      variable: '#268bd2', variableUnresolved: '#dc322f'
    }
  }
}

// --- Personnalisation --------------------------------------------------------------------------

/** Style des onglets (barre d'onglets et sous-onglets Params, Body…). */
export const TAB_STYLES = ['line', 'filled', 'pill'] as const
export type TabStyle = (typeof TAB_STYLES)[number]

/** Espacement des contrôles : hauteur des onglets, marges des champs. */
export const DENSITIES = ['compact', 'normal', 'comfortable'] as const
export type Density = (typeof DENSITIES)[number]

/** Réglages d'apparence appliqués par-dessus n'importe quel thème. */
export interface Appearance {
  /** Couleur d'accent imposée (`#rrggbb`), `null` : celle du thème. */
  accent: string | null
  /** Couleur de l'onglet actif (`#rrggbb`), `null` : l'accent. */
  tabAccent: string | null
  tabStyle: TabStyle
  density: Density
  /** Arrondi des contrôles, en pixels (0 à 12). */
  radius: number
}

export const DEFAULT_APPEARANCE: Appearance = { accent: null, tabAccent: null, tabStyle: 'line', density: 'normal', radius: 6 }

/** Thème créé par l'utilisateur : copie modifiable d'une palette, enregistrée dans les réglages. */
export interface CustomTheme {
  id: string
  name: string
  dark: boolean
  colors: ThemeColors
}

/** Réglage de thème complet (voir Settings['theme']). */
export interface ThemeSetting {
  mode: 'system' | 'fixed'
  fixed: string
  light: string
  dark: string
  custom: CustomTheme[]
  appearance: Appearance
}

/** Couleurs modifiables dans l'éditeur, par groupe ; `selection` est dérivée de l'accent. */
export const COLOR_GROUPS: Array<{ id: 'interface' | 'status' | 'syntax'; keys: Array<keyof ThemeColors> }> = [
  { id: 'interface', keys: ['bg', 'bg2', 'bg3', 'border', 'text', 'muted', 'accent', 'accentText'] },
  { id: 'status', keys: ['ok', 'warn', 'fail', 'info', 'purple'] },
  { id: 'syntax', keys: ['string', 'number', 'keyword', 'property', 'comment', 'variable', 'variableUnresolved'] }
]

/** Couleurs proposées pour l'accent et les onglets. */
export const ACCENT_PRESETS = ['#1d9bf0', '#7856ff', '#f91880', '#ff7a00', '#ffd400', '#00ba7c', '#14b8a6', '#f4212e']

const HEX = /^#[0-9a-f]{6}$/i
export const isHexColor = (v: unknown): v is string => typeof v === 'string' && HEX.test(v)

export const isCustomThemeId = (v: unknown): v is string => typeof v === 'string' && /^custom-[A-Za-z0-9_-]{1,64}$/.test(v)

/** `#rrggbb` + opacité → `rgba(…)`. */
export function withAlpha(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** Texte lisible sur un fond de cette couleur (luminance relative WCAG). */
export function contrastText(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#0f1419' : '#ffffff'
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Thèmes personnalisés lus sur disque, importés ou reçus du renderer : couleurs invalides remplacées. */
export function normalizeCustomThemes(input: unknown): CustomTheme[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const out: CustomTheme[] = []
  for (const raw of input.slice(0, 50)) {
    const theme = normalizeCustomTheme(raw)
    if (theme && !seen.has(theme.id)) {
      seen.add(theme.id)
      out.push(theme)
    }
  }
  return out
}

/** Un thème personnalisé (ou importé) ; `null` si inutilisable. */
export function normalizeCustomTheme(raw: unknown, id?: string): CustomTheme | null {
  if (!isObject(raw)) return null
  const themeId = id ?? raw['id']
  if (!isCustomThemeId(themeId)) return null
  const dark = raw['dark'] !== false
  const base = THEMES[dark ? DEFAULT_THEME_DARK : DEFAULT_THEME_LIGHT].colors
  const given = isObject(raw['colors']) ? raw['colors'] : {}
  const colors = { ...base }
  for (const key of Object.keys(base) as Array<keyof ThemeColors>) {
    const v = given[key]
    if (key === 'selection') continue
    if (isHexColor(v)) colors[key] = v.toLowerCase()
  }
  colors.selection = withAlpha(colors.accent, dark ? 0.26 : 0.16)
  const name = typeof raw['name'] === 'string' && raw['name'].trim() ? raw['name'].trim().slice(0, 60) : 'Custom'
  return { id: themeId, name, dark, colors }
}

export function normalizeAppearance(input: unknown): Appearance {
  const a = isObject(input) ? input : {}
  const d = DEFAULT_APPEARANCE
  const radius = Number(a['radius'])
  return {
    accent: isHexColor(a['accent']) ? a['accent'].toLowerCase() : null,
    tabAccent: isHexColor(a['tabAccent']) ? a['tabAccent'].toLowerCase() : null,
    tabStyle: (TAB_STYLES as readonly unknown[]).includes(a['tabStyle']) ? (a['tabStyle'] as TabStyle) : d.tabStyle,
    density: (DENSITIES as readonly unknown[]).includes(a['density']) ? (a['density'] as Density) : d.density,
    radius: Number.isFinite(radius) ? Math.min(12, Math.max(0, Math.round(radius))) : d.radius
  }
}

/** Copie modifiable d'un thème, pour l'éditeur. */
export function customThemeFrom(theme: Theme, id: string, name: string): CustomTheme {
  return { id, name: name.slice(0, 60), dark: theme.dark, colors: { ...theme.colors } }
}

/** Thème intégré ou personnalisé par identifiant ; `undefined` s'il n'existe plus. */
export function findTheme(id: string, custom: CustomTheme[]): Theme | undefined {
  return isThemeId(id) ? THEMES[id] : custom.find((c) => c.id === id)
}

/** Thème à appliquer selon le réglage et le mode clair/sombre du système, accent personnalisé compris. */
export function activeTheme(setting: Pick<ThemeSetting, 'mode' | 'fixed' | 'light' | 'dark'> & Partial<ThemeSetting>, systemDark: boolean): Theme {
  const custom = setting.custom ?? []
  const id = setting.mode === 'fixed' ? setting.fixed : systemDark ? setting.dark : setting.light
  const fallback = THEMES[setting.mode === 'fixed' || systemDark ? DEFAULT_THEME_DARK : DEFAULT_THEME_LIGHT]
  return withAccent(findTheme(id, custom) ?? fallback, setting.appearance?.accent ?? null)
}

/** Applique une couleur d'accent imposée : texte sur accent, sélection et variables suivent. */
export function withAccent(theme: Theme, accent: string | null): Theme {
  if (!accent || accent === theme.colors.accent) return theme
  const old = theme.colors.accent
  return {
    ...theme,
    colors: {
      ...theme.colors,
      accent,
      accentText: contrastText(accent),
      selection: withAlpha(accent, theme.dark ? 0.26 : 0.16),
      variable: theme.colors.variable === old ? accent : theme.colors.variable
    }
  }
}

/** Variables CSS correspondant à un thème (et aux réglages d'apparence). */
export function themeCssVariables(theme: Theme, appearance: Appearance = DEFAULT_APPEARANCE): Record<string, string> {
  const c = theme.colors
  const tabAccent = appearance.tabAccent ?? c.accent
  return {
    '--bg': c.bg, '--bg-2': c.bg2, '--bg-3': c.bg3, '--border': c.border, '--text': c.text, '--muted': c.muted,
    '--accent': c.accent, '--accent-text': c.accentText, '--ok': c.ok, '--warn': c.warn, '--fail': c.fail, '--info': c.info,
    '--purple': c.purple, '--selection': c.selection, '--syn-string': c.string, '--syn-number': c.number,
    '--syn-keyword': c.keyword, '--syn-property': c.property, '--syn-comment': c.comment, '--var': c.variable,
    '--var-unresolved': c.variableUnresolved, 'color-scheme': theme.dark ? 'dark' : 'light',
    '--tab-accent': tabAccent, '--tab-accent-text': contrastText(tabAccent), '--tab-accent-soft': withAlpha(tabAccent, theme.dark ? 0.2 : 0.12),
    '--radius': `${appearance.radius}px`
  }
}
