'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

const themes: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.dataset.theme = theme
  localStorage.setItem('opskit-theme', theme)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('opskit-theme') as Theme | null
    const initial = stored === 'dark' ? 'dark' : 'light'
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
  }

  const active = themes.find((item) => item.value === theme) ?? themes[0]
  const Icon = active.icon

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="ui-button-ghost h-9 w-9 rounded-full border border-[var(--border-subtle)] p-0"
      aria-label={`Theme: ${active.label}`}
      title={`Theme: ${active.label}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
