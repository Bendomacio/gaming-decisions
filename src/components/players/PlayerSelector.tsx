import { Users, UserCheck, UserX } from 'lucide-react'
import type { Player } from '../../types'
import { cn } from '../../lib/utils'

interface PlayerSelectorProps {
  players: Player[]
  selectedIds: string[]
  onToggle: (playerId: string) => void
}

export function PlayerSelector({ players, selectedIds, onToggle }: PlayerSelectorProps) {
  const selectedCount = selectedIds.length

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-accent" />
        <h2 className="text-sm font-semibold text-text-primary">Who's Playing Tonight?</h2>
        <span className="ml-auto text-xs text-text-muted">
          {selectedCount} player{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex gap-3">
        {players.map(player => {
          const isSelected = selectedIds.includes(player.id)

          return (
            <button
              key={player.id}
              onClick={() => onToggle(player.id)}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer',
                isSelected
                  ? 'bg-accent-dim border-border-accent shadow-sm'
                  : 'bg-bg-card border-border hover:border-border-hover opacity-50 hover:opacity-75'
              )}
            >
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={player.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                  isSelected ? 'bg-accent text-white' : 'bg-bg-input text-text-muted'
                )}>
                  {player.name[0]}
                </div>
              )}

              <div className="text-left">
                <div className={cn(
                  'text-sm font-medium leading-tight',
                  isSelected ? 'text-text-primary' : 'text-text-muted'
                )}>
                  {player.name}
                </div>
                {!player.is_primary && (
                  <div className="text-[10px] text-text-muted">Occasional</div>
                )}
              </div>

              {isSelected ? (
                <UserCheck size={14} className="text-accent ml-1" />
              ) : (
                <UserX size={14} className="text-text-muted ml-1" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
