import { describe, expect, it } from 'vitest'
import { normalizeSettings } from './settings'
import { activeTheme, contrastText, customThemeFrom, normalizeAppearance, normalizeCustomTheme, themeCssVariables, THEMES } from './themes'

describe('thèmes personnalisés et apparence', () => {
  const custom = customThemeFrom(THEMES['endora-dark'], 'custom-abc', 'Mon thème')

  it('applique un thème personnalisé et revient au défaut s’il disparaît', () => {
    const s = normalizeSettings({ theme: { mode: 'fixed', fixed: 'custom-abc', custom: [{ ...custom, colors: { ...custom.colors, bg: '#101010' } }] } })
    expect(s.theme.fixed).toBe('custom-abc')
    expect(activeTheme(s.theme, true).colors.bg).toBe('#101010')
    const gone = normalizeSettings({ theme: { mode: 'fixed', fixed: 'custom-abc', custom: [] } })
    expect(gone.theme.fixed).toBe('endora-dark')
  })

  it('remplace les couleurs invalides et refuse un identifiant douteux', () => {
    const t = normalizeCustomTheme({ id: 'custom-x', name: '  X ', dark: false, colors: { bg: 'url(javascript:1)', text: '#ABCDEF' } })!
    expect(t.name).toBe('X')
    expect(t.colors.bg).toBe(THEMES['endora-light'].colors.bg)
    expect(t.colors.text).toBe('#abcdef')
    expect(normalizeCustomTheme({ id: '../x', colors: {} })).toBeNull()
    expect(normalizeCustomTheme({ colors: {} }, 'custom-new')!.id).toBe('custom-new')
  })

  it('impose l’accent à tout thème, avec un texte lisible et la sélection assortie', () => {
    const s = normalizeSettings({ theme: { mode: 'fixed', fixed: 'night-owl', appearance: { accent: '#FFD400' } } })
    const theme = activeTheme(s.theme, true)
    expect(theme.colors.accent).toBe('#ffd400')
    expect(theme.colors.accentText).toBe('#0f1419')
    expect(theme.colors.selection).toBe('rgba(255, 212, 0, 0.26)')
    expect(contrastText('#1d9bf0')).toBe('#ffffff')
    expect(contrastText('#15202b')).toBe('#ffffff')
  })

  it('normalise l’apparence et produit les variables CSS', () => {
    expect(normalizeAppearance({ tabStyle: 'neon', density: 'compact', radius: 40, tabAccent: 'red' })).toEqual({
      accent: null,
      tabAccent: null,
      tabStyle: 'line',
      density: 'compact',
      radius: 12
    })
    const vars = themeCssVariables(THEMES['endora-dark'], { ...normalizeAppearance(null), tabAccent: '#00ba7c', radius: 0 })
    expect(vars).toMatchObject({ '--tab-accent': '#00ba7c', '--radius': '0px', '--accent': '#1d9bf0' })
  })
})
