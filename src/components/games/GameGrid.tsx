import { GameCard } from './GameCard'
import { Spinner } from '../ui/Spinner'
import { Gamepad2 } from 'lucide-react'
import type { GameWithOwnership, Player } from '../../types'

interface GameGridProps {
  games: GameWithOwnership[]
  players: Player[]
  selectedPlayerIds: string[]
  loading: boolean
  onGameClick: (game: GameWithOwnership) => void
}

export function GameGrid({ games, players, selectedPlayerIds, loading, onGameClick }: GameGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} />
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <Gamepad2 size={48} className="mb-3 opacity-30" />
        <p className="text-sm">No games match your filters</p>
        <p className="text-xs mt-1">Try adjusting your filters or selecting different players</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {games.map(game => (
        <GameCard
          key={game.id}
          game={game}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          onClick={() => onGameClick(game)}
        />
      ))}
    </div>
  )
}
