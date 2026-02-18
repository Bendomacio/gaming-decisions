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
          const size = compact ? 'w-6 h-6' : 'w-7 h-7'
          return (
            <div
              key={player.id}
              title={`${player.name}: ${owns ? 'Owns it' : 'Doesn\'t own it'}`}
              className={cn(
                'relative rounded-full flex items-center justify-center overflow-hidden',
                size,
                owns
                  ? 'ring-2 ring-success/60'
                  : 'ring-2 ring-error/40 opacity-50'
              )}
            >
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={cn(
                  'w-full h-full flex items-center justify-center text-[10px] font-bold',
                  owns ? 'bg-success/20 text-success' : 'bg-error/10 text-error/60'
                )}>
                  {player.name[0]}
                </div>
              )}
              {/* Letter overlay */}
              <span className={cn(
                'absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]',
                !owns && 'text-white/60'
              )}>
                {player.name[0]}
              </span>
            </div>
          )
        })}
    </div>
  )
}
