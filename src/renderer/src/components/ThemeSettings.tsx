// Paramètres › Thèmes : choix du thème (intégré ou personnalisé), apparence (accent, onglets,
// densité, arrondis) et éditeur de thèmes personnalisés avec import/export. Tout s'applique en
// direct : chaque modification passe par useSettings.update.

import { useState } from 'react'
import { t, type MessageKey } from '@shared/i18n'
import type { Settings } from '@shared/settings'
import {
  ACCENT_PRESETS,
  COLOR_GROUPS,
  customThemeFrom,
  DEFAULT_APPEARANCE,
  DENSITIES,
  findTheme,
  normalizeCustomTheme,
  TAB_STYLES,
  THEME_IDS,
  THEMES,
  withAlpha,
  type Appearance,
  type CustomTheme,
  type Theme,
  type ThemeColors
} from '@shared/themes'
import { useSettings } from '../stores/settings'
import { confirmDialog, toast } from '../stores/ui'
import { Toggle } from './SettingsView'

type ThemeSetting = Settings['theme']

const newCustomId = (): string => `custom-${crypto.randomUUID().slice(0, 8)}`

/** Format d'échange d'un thème exporté (fichier .json). */
const EXPORT_FORMAT = 'endora-theme'

function ThemeCard({ theme, label, selected, custom, onSelect }: { theme: Theme; label: string; selected: boolean; custom?: boolean; onSelect: () => void }) {
  const c = theme.colors
  return (
    <button className={`theme-card ${selected ? 'selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
      <div className="theme-swatch" style={{ background: c.bg, borderColor: c.border }}>
        <div style={{ background: c.bg2, borderRight: `1px solid ${c.border}` }} className="sw-side" />
        <div className="sw-main">
          <span style={{ background: c.accent }} />
          <span style={{ background: c.ok }} />
          <span style={{ background: c.warn }} />
          <span style={{ background: c.fail }} />
          <code style={{ color: c.string }}>"ok"</code>
          <code style={{ color: c.keyword }}>pm</code>
        </div>
      </div>
      <span>
        {label} {custom && <span className="custom-badge">{t('themes.customBadge')}</span>}
      </span>
    </button>
  )
}

/** Pastilles de couleurs prédéfinies, couleur libre et, si `noneLabel`, « aucune » (valeur `null`). */
function ColorChoice({ value, onChange, noneLabel }: { value: string | null; onChange: (v: string | null) => void; noneLabel: string }) {
  return (
    <div className="swatches">
      <button className={`swatch none ${value === null ? 'selected' : ''}`} title={noneLabel} aria-label={noneLabel} aria-pressed={value === null} onClick={() => onChange(null)} />
      {ACCENT_PRESETS.map((c) => (
        <button key={c} className={`swatch ${value === c ? 'selected' : ''}`} style={{ background: c }} title={c} aria-label={c} aria-pressed={value === c} onClick={() => onChange(c)} />
      ))}
      <input
        type="color"
        className="swatch-input"
        value={value ?? '#1d9bf0'}
        title={t('themes.customColor')}
        aria-label={t('themes.customColor')}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
      />
    </div>
  )
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function AppearanceSettings({ appearance, set }: { appearance: Appearance; set: (patch: Partial<Appearance>) => void }) {
  return (
    <>
      <h4>{t('themes.appearance')}</h4>
      <div className="appearance-row">
        <div>
          <div>{t('themes.accent')}</div>
          <div className="muted small">{t('themes.accentHint')}</div>
        </div>
        <ColorChoice value={appearance.accent} onChange={(accent) => set({ accent })} noneLabel={t('themes.themeDefault')} />
      </div>
      <div className="appearance-row">
        <div>
          <div>{t('themes.tabAccent')}</div>
          <div className="muted small">{t('themes.tabAccentHint')}</div>
        </div>
        <ColorChoice value={appearance.tabAccent} onChange={(tabAccent) => set({ tabAccent })} noneLabel={t('themes.sameAsAccent')} />
      </div>
      <div className="appearance-row">
        <div>
          <div>{t('themes.tabStyle')}</div>
          <div className="muted small">{t('themes.tabStyleHint')}</div>
        </div>
        <Segmented
          label={t('themes.tabStyle')}
          value={appearance.tabStyle}
          options={TAB_STYLES.map((v) => ({ value: v, label: t(`themes.tab.${v}`) }))}
          onChange={(tabStyle) => set({ tabStyle })}
        />
      </div>
      <div className="appearance-row">
        <div>
          <div>{t('themes.density')}</div>
          <div className="muted small">{t('themes.densityHint')}</div>
        </div>
        <Segmented
          label={t('themes.density')}
          value={appearance.density}
          options={DENSITIES.map((v) => ({ value: v, label: t(`themes.density.${v}`) }))}
          onChange={(density) => set({ density })}
        />
      </div>
      <div className="appearance-row">
        <div>
          <div>{t('themes.radius')}</div>
          <div className="muted small">{t('themes.radiusHint')}</div>
        </div>
        <div className="radius-control">
          <input type="range" min={0} max={12} step={1} value={appearance.radius} aria-label={t('themes.radius')} onChange={(e) => set({ radius: Number(e.target.value) })} />
          <code>{appearance.radius}px</code>
        </div>
      </div>
      <p>
        <button className="link" onClick={() => set(DEFAULT_APPEARANCE)}>
          {t('themes.resetAppearance')}
        </button>
      </p>
    </>
  )
}

function ThemeEditor({
  theme,
  accentOverridden,
  onChange,
  onDelete,
  onExport
}: {
  theme: CustomTheme
  accentOverridden: boolean
  onChange: (t: CustomTheme) => void
  onDelete: () => void
  onExport: () => void
}) {
  const setColor = (key: keyof ThemeColors, value: string) => {
    const colors = { ...theme.colors, [key]: value }
    // La sélection de texte suit l'accent.
    if (key === 'accent') colors.selection = withAlpha(value, theme.dark ? 0.26 : 0.16)
    onChange({ ...theme, colors })
  }
  return (
    <div className="theme-editor">
      <div className="theme-editor-head">
        <input type="text" value={theme.name} maxLength={60} aria-label={t('themes.name')} onChange={(e) => onChange({ ...theme, name: e.target.value })} />
        <Segmented
          label={t('themes.kind')}
          value={theme.dark ? 'dark' : 'light'}
          options={[
            { value: 'light', label: t('themes.kind.light') },
            { value: 'dark', label: t('themes.kind.dark') }
          ]}
          onChange={(v) => onChange({ ...theme, dark: v === 'dark' })}
        />
      </div>
      {accentOverridden && <p className="muted small">{t('themes.accentOverridden')}</p>}
      <div className="color-groups">
        {COLOR_GROUPS.map((group) => (
          <div key={group.id}>
            <h5>{t(`themes.group.${group.id}`)}</h5>
            {group.keys.map((key) => (
              <label key={key} className="color-field">
                <input type="color" value={theme.colors[key]} onChange={(e) => setColor(key, e.target.value.toLowerCase())} />
                <span>{t(`themes.color.${key}` as MessageKey)}</span>
                <code>{theme.colors[key]}</code>
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="theme-actions">
        <button onClick={onExport}>{t('common.export')}</button>
        <button className="danger" onClick={onDelete}>
          {t('common.delete')}
        </button>
      </div>
    </div>
  )
}

export function ThemeSettings() {
  const theme = useSettings((s) => s.settings.theme)
  const active = useSettings((s) => s.theme)
  const systemDark = useSettings((s) => s.systemDark)
  const update = useSettings((s) => s.update)
  const [editing, setEditing] = useState<string | null>(null)
  const set = (patch: Partial<ThemeSetting>) => update((s) => ({ ...s, theme: { ...s.theme, ...patch } }))
  const setAppearance = (patch: Partial<Appearance>) => update((s) => ({ ...s, theme: { ...s.theme, appearance: { ...s.theme.appearance, ...patch } } }))

  const all: Array<{ theme: Theme; label: string; custom: boolean }> = [
    ...THEME_IDS.map((id) => ({ theme: THEMES[id], label: t(`theme.${id}`), custom: false })),
    ...theme.custom.map((c) => ({ theme: c, label: c.name, custom: true }))
  ]
  const grid = (items: typeof all, selected: string, onSelect: (id: string) => void) => (
    <div className="theme-grid">
      {items.map((i) => (
        <ThemeCard key={i.theme.id} theme={i.theme} label={i.label} custom={i.custom} selected={selected === i.theme.id} onSelect={() => onSelect(i.theme.id)} />
      ))}
    </div>
  )

  /** Sélectionne un thème là où il s'appliquera (thème fixe, ou thème clair/sombre du mode système). */
  const choose = (c: { id: string; dark: boolean }, s: ThemeSetting): Partial<ThemeSetting> =>
    s.mode === 'fixed' ? { fixed: c.id } : c.dark ? { dark: c.id } : { light: c.id }

  const addCustom = (custom: CustomTheme) => {
    update((s) => ({ ...s, theme: { ...s.theme, custom: [...s.theme.custom, custom], ...choose(custom, s.theme) } }))
    setEditing(custom.id)
  }

  const createFromCurrent = () => {
    // Copie du thème affiché, sans l'accent imposé par l'apparence (il reste réglable à part).
    const shownId = theme.mode === 'fixed' ? theme.fixed : systemDark ? theme.dark : theme.light
    const base = findTheme(shownId, theme.custom) ?? active
    const label = base.id in THEMES ? t(`theme.${base.id as (typeof THEME_IDS)[number]}`) : base.name
    addCustom(customThemeFrom(base, newCustomId(), t('themes.copyName', { name: label })))
  }

  const changeCustom = (next: CustomTheme) => update((s) => ({ ...s, theme: { ...s.theme, custom: s.theme.custom.map((c) => (c.id === next.id ? next : c)) } }))

  const deleteCustom = async (c: CustomTheme) => {
    const choice = await confirmDialog(t('themes.deleteTitle'), t('themes.deleteMessage', { name: c.name }), [
      { label: t('common.cancel'), value: 'cancel' },
      { label: t('common.delete'), value: 'delete', variant: 'danger' }
    ])
    if (choice !== 'delete') return
    // Un réglage qui pointait vers ce thème revient au thème par défaut (normalizeSettings).
    update((s) => ({ ...s, theme: { ...s.theme, custom: s.theme.custom.filter((x) => x.id !== c.id) } }))
    setEditing(null)
  }

  const exportCustom = async (c: CustomTheme) => {
    const data = { format: EXPORT_FORMAT, version: 1, name: c.name, dark: c.dark, colors: c.colors }
    const safe = c.name.replace(/[^\p{L}\p{N} _-]+/gu, '').trim() || 'theme'
    const r = await window.endora.saveTextFile(`${safe}.endora-theme.json`, JSON.stringify(data, null, 2))
    if (r.ok) toast(t('themes.exported'))
    else if (!r.canceled) toast(r.message, 'error')
  }

  const importThemes = async () => {
    const r = await window.endora.openTextFiles()
    if (!r.ok) {
      if (!r.canceled) toast(r.message, 'error')
      return
    }
    let added = 0
    for (const file of r.files) {
      let data: unknown
      try {
        data = JSON.parse(file.text)
      } catch {
        data = null
      }
      const imported = data && typeof data === 'object' && (data as { format?: unknown }).format === EXPORT_FORMAT ? normalizeCustomTheme(data, newCustomId()) : null
      if (!imported) {
        toast(t('themes.importFailed', { name: file.name }), 'error')
        continue
      }
      addCustom(imported)
      added++
    }
    if (added > 0) toast(t('themes.importDone', { count: added }))
  }

  const edited = theme.custom.find((c) => c.id === editing)

  return (
    <>
      <h3>{t('settings.theme')}</h3>
      <Toggle
        label={t('settings.syncSystem')}
        hint={t('settings.syncSystemHint', { dark: systemDark ? 'yes' : 'no' })}
        checked={theme.mode === 'system'}
        onChange={(v) => set({ mode: v ? 'system' : 'fixed' })}
      />
      {theme.mode === 'system' ? (
        <>
          <h4>{t('settings.lightTheme')}</h4>
          {grid(
            all.filter((i) => !i.theme.dark),
            theme.light,
            (light) => set({ light })
          )}
          <h4>{t('settings.darkTheme')}</h4>
          {grid(
            all.filter((i) => i.theme.dark),
            theme.dark,
            (dark) => set({ dark })
          )}
        </>
      ) : (
        grid(all, theme.fixed, (fixed) => set({ fixed }))
      )}
      <p className="muted small">{t('settings.themesNote')}</p>

      <AppearanceSettings appearance={theme.appearance} set={setAppearance} />

      <h4>{t('themes.custom')}</h4>
      <p className="muted small">{t('themes.customHint')}</p>
      <div className="theme-actions">
        <button className="primary" onClick={createFromCurrent}>
          {t('themes.create')}
        </button>
        <button onClick={() => void importThemes()}>{t('common.import')}</button>
        {theme.custom.length > 0 && (
          <select value={editing ?? ''} onChange={(e) => setEditing(e.target.value || null)} aria-label={t('themes.edit')}>
            <option value="">{t('themes.edit')}</option>
            {theme.custom.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {edited && <ThemeEditor theme={edited} accentOverridden={theme.appearance.accent !== null} onChange={changeCustom} onDelete={() => void deleteCustom(edited)} onExport={() => void exportCustom(edited)} />}
    </>
  )
}
