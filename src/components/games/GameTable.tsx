import { ArrowUpDown, Gamepad2 } from 'lucide-react'
import { GameRow } from './GameRow'
import { Spinner } from '../ui/Spinner'
import { cn } from '../../lib/utils'
import type { GameWithOwnership, Player, SortOption } from '../../types'
import type { ShortlistEntry } from '../../hooks/useShortlist'

interface GameTableProps {
  games: GameWithOwnership[]
  players: Player[]
  selectedPlayerIds: string[]
  loading: boolean
  sortBy: SortOption[]
  shortlistedIds: Set<string>
  getShortlistEntry: (gameId: string) => ShortlistEntry | null
  onToggleSortBy: (sort: SortOption) => void
  onGameClick: (game: GameWithOwnership) => void
  onShortlistToggle: (gameId: string) => void
  onShortlistTogglePlayer: (gameId: string, playerName: string) => void
  onShortlistSetReason: (gameId: string, reason: string) => void
}

interface ColumnHeader {
  label: string
  sortKey?: SortOption
  width: string
  align?: 'left' | 'center'
}

const columns: ColumnHeader[] = [
  { label: '', width: 'w-7' },                                // shortlist star
  { label: '', width: 'w-[120px]' },                          // thumbnail
  { label: 'Game', sortKey: 'name', width: 'flex-1', align: 'left' },
  { label: 'Owners', width: 'w-[100px]', align: 'center' },
  { label: 'Modes', width: 'w-[70px]', align: 'center' },
  { label: 'Steam Reviews', sortKey: 'review_score', width: 'w-[130px]', align: 'left' },
  { label: 'OpenCritic', width: 'w-[60px]', align: 'center' },
  { label: 'Linux', width: 'w-[70px]', align: 'center' },
  { label: 'Played', sortKey: 'playtime', width: 'w-[50px]', align: 'center' },
  { label: 'Steam £', sortKey: 'price_asc', width: 'w-[60px]', align: 'center' },
  { label: 'Key £', width: 'w-[60px]', align: 'center' },
  { label: 'Released', sortKey: 'release_date', width: 'w-[65px]', align: 'center' },
  { label: '', width: 'w-6' },                                // steam link
]

export function GameTable({ games, players, selectedPlayerIds, loading, sortBy, shortlistedIds, getShortlistEntry, onToggleSortBy, onGameClick, onShortlistToggle, onShortlistTogglePlayer, onShortlistSetReason }: GameTableProps) {
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
      <div className="flex items-center gap-3 px-3 py-1.5">
        {columns.map((col, i) => {
          const sortIdx = col.sortKey ? sortBy.indexOf(col.sortKey) : -1
          const isActive = sortIdx !== -1
          return (
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
                  onClick={() => onToggleSortBy(col.sortKey!)}
                  className={cn(
                    'flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold transition-colors cursor-pointer',
                    col.align === 'center' && 'justify-center w-full',
                    isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  {col.label}
                  <ArrowUpDown size={8} />
                  {isActive && sortBy.length > 1 && (
                    <span className="text-[8px] bg-accent/30 rounded-full w-3 h-3 flex items-center justify-center">
                      {sortIdx + 1}
                    </span>
                  )}
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
          )
        })}
      </div>

      {/* Game rows */}
      <div className="space-y-1">
        {games.map(game => (
          <GameRow
            key={game.id}
            game={game}
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            isShortlisted={shortlistedIds.has(game.id)}
            shortlistEntry={getShortlistEntry(game.id)}
            onShortlistToggle={onShortlistToggle}
            onShortlistTogglePlayer={onShortlistTogglePlayer}
            onShortlistSetReason={onShortlistSetReason}
            onClick={() => onGameClick(game)}
          />
        ))}
      </div>
    </div>
  )
}
