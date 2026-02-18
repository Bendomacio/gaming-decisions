import type { Player, PlayerGame } from '../../types'
import { cn } from '../../lib/utils'

interface OwnershipBadgesProps {
  players: Player[]
  owners: PlayerGame[]
  selectedIds: string[]
  compact?: boolean
}

export function OwnershipBadges({ players, owners, selectedIds, compact = false }: OwnershipBadgesProps) {
  const ownerPlayerIds = new Set(owners.map(o => o.player_id))

  return (
    <div className={cn('flex', compact ? 'gap-1' : 'gap-1.5')}>
      {players
        .filter(p => selectedIds.includes(p.id))
        .map(player => {
          const owns = ownerPlayerIds.has(player.id)
          return (
            <div
              key={player.id}
              title={`${player.name}: ${owns ? 'Owns it' : 'Doesn\'t own it'}`}
              className={cn(
                'rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                compact ? 'w-5 h-5' : 'w-6 h-6',
                owns
                  ? 'bg-success/20 text-success border border-success/30'
                  : 'bg-error/10 text-error/60 border border-error/20'
              )}
            >
              {player.name[0]}
            </div>
          )
        })}
    </div>
  )
}
