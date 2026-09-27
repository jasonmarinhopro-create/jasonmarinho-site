'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// 3 thèmes : light (par défaut), dark, amoled (true black pour OLED).
// toggleTheme : clair ↔ sombre (amoled conservé pour l'existant, hors cycle)
type Theme = 'dark' | 'light' | 'amoled'

interface ThemeCtx {
  theme: Theme
  /** Bascule clair ↔ sombre */
  toggleTheme: () => void
  /** Setter direct pour les UI qui exposent les 3 options */
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    // Read theme set by the inline script (already applied on <html>)
    const stored = document.documentElement.getAttribute('data-theme') as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'amoled') setThemeState(stored)
  }, [])

  function applyTheme(next: Theme) {
    setThemeState(next)
    const root = document.documentElement
    // Fondu des couleurs uniquement pendant la bascule (cf. globals.css,
    // html.theme-switching) : le reste du temps, clics et survols sont instantanés.
    root.classList.add('theme-switching')
    root.setAttribute('data-theme', next)
    window.setTimeout(() => root.classList.remove('theme-switching'), 300)
    try { localStorage.setItem('theme', next) } catch {}
  }

  function toggleTheme() {
    // Deux modes proposés : clair ↔ sombre. AMOLED (noir pur) reste pris en
    // charge pour les comptes qui l'avaient déjà, mais n'est plus dans le
    // cycle : quasi identique au sombre, il rendait le bouton confus.
    applyTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
