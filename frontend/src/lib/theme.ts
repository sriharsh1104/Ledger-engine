export type Theme = 'light' | 'dark'

const THEME_KEY = 'ledger_theme'

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
}

applyTheme(getStoredTheme())
