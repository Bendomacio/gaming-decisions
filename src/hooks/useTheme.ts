import { useState, useEffect, useCallback } from 'react'

export type ThemeId = 'indigo' | 'cyberpunk' | 'midnight' | 'ember' | 'emerald'

export interface ThemeOption {
  id: ThemeId
  label: string
  swatch: string  // CSS color for the preview dot
}

export const themes: ThemeOption[] = [
  { id: 'indigo', label: 'Indigo', swatch: '#6366f1' },
  { id: 'cyberpunk', label: 'Cyberpunk', swatch: '#ff0080' },
  { id: 'midnight', label: 'Midnight', swatch: '#3884ff' },
  { id: 'ember', label: 'Ember', swatch: '#f5821e' },
  { id: 'emerald', label: 'Emerald', swatch: '#10b981' },
]

const STORAGE_KEY = 'gaming-decisions-theme'

function applyTheme(id: ThemeId) {
  if (id === 'indigo') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', id)
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return (saved as ThemeId) || 'indigo'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  return { theme, setTheme }
}
