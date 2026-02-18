import { Gamepad2, RefreshCw, Clock, Palette } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { themes } from '../../hooks/useTheme'
import type { ThemeId } from '../../hooks/useTheme'
import type { SyncLog } from '../../types'

interface HeaderProps {
  lastSync: SyncLog | null
  onRefresh: () => void
  syncing: boolean
  theme: ThemeId
  onThemeChange: (id: ThemeId) => void
}

export function Header({ lastSync, onRefresh, syncing, theme, onThemeChange }: HeaderProps) {
  const syncTime = lastSync?.finished_at
    ? new Date(lastSync.finished_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  const [showThemes, setShowThemes] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showThemes) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThemes(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showThemes])

  return (
    <header className="glass sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-dim flex items-center justify-center">
          <Gamepad2 size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary leading-tight">Gaming Decisions</h1>
          <p className="text-xs text-text-muted">What are we playing tonight?</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {syncTime && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Clock size={12} />
            <span>Last sync: {syncTime}</span>
          </div>
        )}

        {/* Theme switcher */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowThemes(!showThemes)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer border',
              showThemes
                ? 'bg-accent-dim text-accent-hover border-border-accent'
                : 'text-text-muted border-border hover:text-text-secondary hover:border-border-hover'
            )}
          >
            <Palette size={13} />
            <div
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ backgroundColor: themes.find(t => t.id === theme)?.swatch }}
            />
          </button>

          {showThemes && (
            <div className="absolute right-0 top-full mt-2 bg-bg-secondary border border-border rounded-xl shadow-xl p-2 min-w-[140px] z-50">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onThemeChange(t.id); setShowThemes(false) }}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs transition-all cursor-pointer',
                    theme === t.id
                      ? 'bg-accent-dim text-accent-hover'
                      : 'text-text-secondary hover:bg-white/5'
                  )}
                >
                  <div
                    className={cn(
                      'w-3.5 h-3.5 rounded-full border-2 transition-all',
                      theme === t.id ? 'border-white/50 scale-110' : 'border-white/15'
                    )}
                    style={{ backgroundColor: t.swatch }}
                  />
                  {t.label}
                  {theme === t.id && (
                    <span className="ml-auto text-[9px] text-text-muted">active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={syncing}
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>
    </header>
  )
}
