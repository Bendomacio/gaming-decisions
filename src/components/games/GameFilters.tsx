import { Search, X, Filter, Users, Monitor, Calendar, Ban } from 'lucide-react'
import { Button } from '../ui/Button'
import type { FilterState, SortOption, GameModeFilters, ProtonFilter, ReleaseDateFilter, AppTab } from '../../types'
import { cn } from '../../lib/utils'

interface GameFiltersProps {
  filters: FilterState
  totalCount: number
  filteredCount: number
  availableTags: string[]
  activeTab: AppTab
  onSearch: (query: string) => void
  onSortBy: (sort: SortOption) => void
  onToggleOwnedByAll: () => void
  onToggleFreeOnly: () => void
  onToggleOnSaleOnly: () => void
  onToggleTag: (tag: string) => void
  onToggleExcludeTag: (tag: string) => void
  onToggleGameMode: (mode: keyof GameModeFilters) => void
  onSetProtonFilter: (filter: ProtonFilter) => void
  onSetReleaseDateFilter: (filter: ReleaseDateFilter) => void
  onReset: () => void
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recommendation', label: 'Recommended' },
  { value: 'review_score', label: 'Rating' },
  { value: 'price_asc', label: 'Price: Low' },
  { value: 'price_desc', label: 'Price: High' },
  { value: 'playtime', label: 'Playtime' },
  { value: 'name', label: 'Name' },
  { value: 'recently_added', label: 'Recently Added' },
]

const gameModeOptions: { key: keyof GameModeFilters; label: string }[] = [
  { key: 'multiplayer', label: 'Multiplayer' },
  { key: 'coop', label: 'Co-op' },
  { key: 'singlePlayer', label: 'Single Player' },
  { key: 'localMultiplayer', label: 'Local MP' },
]

const protonOptions: { value: ProtonFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'native', label: 'Native' },
  { value: 'platinum', label: 'Platinum+' },
  { value: 'gold', label: 'Gold+' },
]

const releaseDateOptions: { value: ReleaseDateFilter; label: string }[] = [
  { value: 'all', label: 'Any' },
  { value: 'year', label: '1yr' },
  { value: '2years', label: '2yr' },
  { value: '3years', label: '3yr' },
  { value: '5years', label: '5yr' },
  { value: '10years', label: '10yr' },
]

export function GameFilters({
  filters,
  totalCount,
  filteredCount,
  availableTags,
  activeTab,
  onSearch,
  onSortBy,
  onToggleOwnedByAll,
  onToggleFreeOnly,
  onToggleOnSaleOnly,
  onToggleTag,
  onToggleExcludeTag,
  onToggleGameMode,
  onSetProtonFilter,
  onSetReleaseDateFilter,
  onReset,
}: GameFiltersProps) {
  const activeFilterCount = [
    filters.ownedByAll,
    filters.freeOnly,
    filters.onSaleOnly,
    filters.genreTags.length > 0,
    filters.excludeGenreTags.length > 0,
    filters.protonFilter !== 'all',
    !filters.gameModes.multiplayer || !filters.gameModes.coop || filters.gameModes.singlePlayer || filters.gameModes.localMultiplayer,
    filters.releaseDateFilter !== '5years',
  ].filter(Boolean).length

  return (
    <div className="space-y-2.5 bg-bg-secondary border border-border rounded-xl p-3">
      {/* Row 1: Search + Sort */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search games..."
            value={filters.searchQuery}
            onChange={e => onSearch(e.target.value)}
            className="w-full bg-bg-input border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-accent transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded cursor-pointer"
            >
              <X size={12} className="text-text-muted" />
            </button>
          )}
        </div>

        {activeTab === 'all' && (
          <div className="flex items-center gap-1 bg-bg-input border border-border rounded-lg p-1">
            {sortOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onSortBy(opt.value)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer whitespace-nowrap',
                  filters.sortBy === opt.value
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Row 2: Game Modes + Proton + Release Date */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Users size={12} className="text-text-muted" />
          {gameModeOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => onToggleGameMode(opt.key)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs border transition-all cursor-pointer',
                filters.gameModes[opt.key]
                  ? 'bg-accent-dim text-accent-hover border-border-accent'
                  : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border" />

        <div className="flex items-center gap-2">
          <Monitor size={12} className="text-text-muted" />
          {protonOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSetProtonFilter(opt.value)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs border transition-all cursor-pointer',
                filters.protonFilter === opt.value
                  ? 'bg-accent-dim text-accent-hover border-border-accent'
                  : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border" />

        <div className="flex items-center gap-2">
          <Calendar size={12} className="text-text-muted" />
          {releaseDateOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSetReleaseDateFilter(opt.value)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs border transition-all cursor-pointer',
                filters.releaseDateFilter === opt.value
                  ? 'bg-accent-dim text-accent-hover border-border-accent'
                  : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Quick Filters + Genre Tags (include/exclude) */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={12} className="text-text-muted" />

        <button
          onClick={onToggleOwnedByAll}
          className={cn(
            'px-3 py-1 rounded-lg text-xs border transition-all cursor-pointer',
            filters.ownedByAll
              ? 'bg-success/15 text-success border-success/30'
              : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
          )}
        >
          Everyone Owns
        </button>

        <button
          onClick={onToggleFreeOnly}
          className={cn(
            'px-3 py-1 rounded-lg text-xs border transition-all cursor-pointer',
            filters.freeOnly
              ? 'bg-success/15 text-success border-success/30'
              : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
          )}
        >
          Free
        </button>

        <button
          onClick={onToggleOnSaleOnly}
          className={cn(
            'px-3 py-1 rounded-lg text-xs border transition-all cursor-pointer',
            filters.onSaleOnly
              ? 'bg-warning/15 text-warning border-warning/30'
              : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
          )}
        >
          On Sale
        </button>

        <div className="w-px h-4 bg-border" />

        {availableTags.slice(0, 10).map(tag => {
          const isIncluded = filters.genreTags.includes(tag)
          const isExcluded = filters.excludeGenreTags.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              onContextMenu={e => { e.preventDefault(); onToggleExcludeTag(tag) }}
              title="Click to include, right-click to exclude"
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer flex items-center gap-1',
                isIncluded
                  ? 'bg-accent-dim text-accent-hover border-border-accent'
                  : isExcluded
                  ? 'bg-error/15 text-error border-error/30 line-through'
                  : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
              )}
            >
              {isExcluded && <Ban size={9} />}
              {tag}
            </button>
          )
        })}

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X size={12} />
            Clear ({activeFilterCount})
          </Button>
        )}

        <span className="ml-auto text-xs text-text-muted">
          {filteredCount} of {totalCount} games
        </span>
      </div>
    </div>
  )
}
