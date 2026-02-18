import { Gamepad2, RefreshCw, Clock } from 'lucide-react'
import { Button } from '../ui/Button'
import type { SyncLog } from '../../types'

interface HeaderProps {
  lastSync: SyncLog | null
  onRefresh: () => void
  syncing: boolean
}

export function Header({ lastSync, onRefresh, syncing }: HeaderProps) {
  const syncTime = lastSync?.finished_at
    ? new Date(lastSync.finished_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

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

      <div className="flex items-center gap-4">
        {syncTime && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Clock size={12} />
            <span>Last sync: {syncTime}</span>
          </div>
        )}
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
