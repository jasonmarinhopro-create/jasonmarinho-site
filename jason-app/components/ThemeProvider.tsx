'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// 3 thèmes : light (par défaut), dark, amoled (true black pour OLED).
// Le cycle de toggleTheme : light → dark → amoled → light
type Theme = 'dark' | 'light' | 'amoled'

interface ThemeCtx {
  theme: Theme
  /** Cycle entre les 3 thèmes : light → dark → amoled → light */
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
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('theme', next) } catch {}
  }

  function toggleTheme() {
    // Cycle light → dark → amoled → light
    const next: Theme =
      theme === 'light'  ? 'dark' :
      theme === 'dark'   ? 'amoled' :
                           'light'
    applyTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
