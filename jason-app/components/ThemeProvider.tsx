'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// 3 thèmes : dark (par défaut), light, amoled (true black pour OLED).
// Le cycle de toggleTheme : dark → light → amoled → dark
type Theme = 'dark' | 'light' | 'amoled'

interface ThemeCtx {
  theme: Theme
  /** Cycle entre les 3 thèmes : dark → light → amoled → dark */
  toggleTheme: () => void
  /** Setter direct pour les UI qui exposent les 3 options */
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

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
    // Cycle dark → light → amoled → dark
    const next: Theme =
      theme === 'dark'   ? 'light' :
      theme === 'light'  ? 'amoled' :
                           'dark'
    applyTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
