import { ArrowUpDown, Gamepad2 } from 'lucide-react'
import { GameRow } from './GameRow'
import { Spinner } from '../ui/Spinner'
import { cn } from '../../lib/utils'
import type { GameWithOwnership, Player, SortOption } from '../../types'

interface GameTableProps {
  games: GameWithOwnership[]
  players: Player[]
  selectedPlayerIds: string[]
  loading: boolean
  sortBy: SortOption
  onSortBy: (sort: SortOption) => void
  onGameClick: (game: GameWithOwnership) => void
}

interface ColumnHeader {
  label: string
  sortKey?: SortOption
  width: string
  align?: 'left' | 'center'
}

const columns: ColumnHeader[] = [
  { label: '', width: 'w-[120px]' },             // thumbnail
  { label: 'Game', sortKey: 'name', width: 'flex-1', align: 'left' },
  { label: 'Owners', width: 'w-[90px]', align: 'center' },
  { label: 'Rating', sortKey: 'review_score', width: 'w-[60px]', align: 'center' },
  { label: 'Linux', width: 'w-[80px]', align: 'center' },
  { label: 'Played', sortKey: 'playtime', width: 'w-[55px]', align: 'center' },
  { label: 'Price', sortKey: 'price_asc', width: 'w-[80px]', align: 'center' },
  { label: 'Score', sortKey: 'recommendation', width: 'w-[40px]', align: 'center' },
  { label: '', width: 'w-6' },                    // steam link
]

export function GameTable({ games, players, selectedPlayerIds, loading, sortBy, onSortBy, onGameClick }: GameTableProps) {
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
    <div className="space-y-1">
      {/* Column headers */}
      <div className="flex items-center gap-4 px-3 py-1.5">
        {columns.map((col, i) => (
          <div
            key={i}
            className={cn(
              col.width,
              'flex-shrink-0',
              col.label === 'Game' && 'flex-1 min-w-0',
            )}
          >
            {col.sortKey ? (
              <button
                onClick={() => onSortBy(col.sortKey!)}
                className={cn(
                  'flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold transition-colors cursor-pointer',
                  col.align === 'center' && 'justify-center w-full',
                  sortBy === col.sortKey ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {col.label}
                <ArrowUpDown size={8} />
              </button>
            ) : col.label ? (
              <span className={cn(
                'text-[10px] uppercase tracking-wider font-semibold text-text-muted',
                col.align === 'center' && 'block text-center'
              )}>
                {col.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Game rows */}
      <div className="space-y-1">
        {games.map(game => (
          <GameRow
            key={game.id}
            game={game}
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            onClick={() => onGameClick(game)}
          />
        ))}
      </div>
    </div>
  )
}
