import { useState } from 'react'
import { Search, X, Filter, Users, Monitor, Calendar, Ban, ChevronDown } from 'lucide-react'
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
  onToggleSortBy: (sort: SortOption) => void
  onToggleOwnedByAll: () => void
  onToggleOwnedByNone: () => void
  onToggleFreeOnly: () => void
  onToggleOnSaleOnly: () => void
  onToggleLinuxOnly: () => void
  onToggleHideUnplayedFree: () => void
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
  { value: 'current_players', label: 'Playing Now' },
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
  activeTab: _activeTab,
  onSearch,
  onToggleSortBy,
  onToggleOwnedByAll,
  onToggleOwnedByNone,
  onToggleFreeOnly,
  onToggleOnSaleOnly,
  onToggleLinuxOnly,
  onToggleHideUnplayedFree,
  onToggleTag,
  onToggleExcludeTag,
  onToggleGameMode,
  onSetProtonFilter,
  onSetReleaseDateFilter,
  onReset,
}: GameFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const activeFilterCount = [
    filters.ownedByAll,
    filters.ownedByNone,
    filters.freeOnly,
    filters.onSaleOnly,
    filters.linuxOnly,
    filters.hideUnplayedFree,
    filters.genreTags.length > 0,
    filters.excludeGenreTags.length > 0,
    filters.protonFilter !== 'all',
    !filters.gameModes.multiplayer || !filters.gameModes.coop || filters.gameModes.singlePlayer || filters.gameModes.localMultiplayer,
    filters.releaseDateFilter !== 'all',
  ].filter(Boolean).length

  return (
    <div className="space-y-2.5 bg-bg-secondary border border-border rounded-xl p-2.5 sm:p-3">
      {/* Row 1: Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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

        {/* Mobile: filter toggle + count */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer flex-1',
              showFilters || activeFilterCount > 0
                ? 'bg-accent-dim text-accent-hover border-border-accent'
                : 'bg-bg-card text-text-muted border-border'
            )}
          >
            <Filter size={12} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
            <ChevronDown size={12} className={cn('ml-auto transition-transform', showFilters && 'rotate-180')} />
          </button>
          <span className="text-xs text-text-muted whitespace-nowrap">
            {filteredCount}/{totalCount}
          </span>
        </div>

        {/* Desktop sort buttons */}
        <div className="hidden sm:flex items-center gap-1 bg-bg-input border border-border rounded-lg p-1">
          {sortOptions.map(opt => {
            const idx = filters.sortBy.indexOf(opt.value)
            const isActive = idx !== -1
            return (
              <button
                key={opt.value}
                onClick={() => onToggleSortBy(opt.value)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1',
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
                )}
              >
                {opt.label}
                {isActive && filters.sortBy.length > 1 && (
                  <span className="text-[9px] bg-white/20 rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {idx + 1}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Collapsible filter panel (always shown on desktop, togglable on mobile) */}
      <div className={cn('space-y-2.5', !showFilters && 'hidden sm:block')}>
        {/* Mobile sort */}
        <div className="sm:hidden">
          <div className="flex items-center gap-1.5 flex-wrap">
            {sortOptions.map(opt => {
              const idx = filters.sortBy.indexOf(opt.value)
              const isActive = idx !== -1
              return (
                <button
                  key={opt.value}
                  onClick={() => onToggleSortBy(opt.value)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 border',
                    isActive
                      ? 'bg-accent text-white border-accent'
                      : 'text-text-muted border-border hover:border-border-hover'
                  )}
                >
                  {opt.label}
                  {isActive && filters.sortBy.length > 1 && (
                    <span className="text-[9px] bg-white/20 rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {idx + 1}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 2: Game Modes + Proton + Release Date */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users size={12} className="text-text-muted" />
            {gameModeOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => onToggleGameMode(opt.key)}
                className={cn(
                  'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs border transition-all cursor-pointer',
                  filters.gameModes[opt.key]
                    ? 'bg-accent-dim text-accent-hover border-border-accent'
                    : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-5 bg-border" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Monitor size={12} className="text-text-muted" />
            <button
              onClick={onToggleLinuxOnly}
              className={cn(
                'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs border transition-all cursor-pointer',
                filters.linuxOnly
                  ? 'bg-accent-dim text-accent-hover border-border-accent'
                  : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
              )}
            >
              Linux
            </button>
            {protonOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onSetProtonFilter(opt.value)}
                className={cn(
                  'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs border transition-all cursor-pointer',
                  filters.protonFilter === opt.value
                    ? 'bg-accent-dim text-accent-hover border-border-accent'
                    : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-5 bg-border" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Calendar size={12} className="text-text-muted" />
            {releaseDateOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onSetReleaseDateFilter(opt.value)}
                className={cn(
                  'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs border transition-all cursor-pointer',
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

        {/* Row 3: Quick Filters + Genre Tags */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Filter size={12} className="text-text-muted" />

          <button
            onClick={onToggleOwnedByAll}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] sm:text-xs border transition-all cursor-pointer',
              filters.ownedByAll
                ? 'bg-success/15 text-success border-success/30'
                : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
            )}
          >
            Everyone Owns
          </button>

          <button
            onClick={onToggleOwnedByNone}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] sm:text-xs border transition-all cursor-pointer',
              filters.ownedByNone
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
            )}
          >
            Try Something New
          </button>

          <button
            onClick={onToggleFreeOnly}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] sm:text-xs border transition-all cursor-pointer',
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
              'px-2.5 py-1 rounded-lg text-[11px] sm:text-xs border transition-all cursor-pointer',
              filters.onSaleOnly
                ? 'bg-warning/15 text-warning border-warning/30'
                : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
            )}
          >
            On Sale
          </button>

          <button
            onClick={onToggleHideUnplayedFree}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] sm:text-xs border transition-all cursor-pointer',
              filters.hideUnplayedFree
                ? 'bg-error/15 text-error border-error/30'
                : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
            )}
          >
            Hide Unplayed F2P
          </button>

          <div className="w-px h-4 bg-border hidden sm:block" />

          {/* Excluded tags not in available list */}
          {filters.excludeGenreTags
            .filter(tag => !availableTags.includes(tag))
            .map(tag => (
              <button
                key={tag}
                onClick={() => onToggleExcludeTag(tag)}
                className="px-2 py-1 rounded-lg text-[10px] sm:text-[11px] border transition-all cursor-pointer flex items-center gap-1 bg-error/15 text-error border-error/30 line-through"
              >
                <Ban size={9} />
                {tag}
              </button>
            ))}
          {availableTags.slice(0, 15).map(tag => {
            const isIncluded = filters.genreTags.includes(tag)
            const isExcluded = filters.excludeGenreTags.includes(tag)
            const handleClick = () => {
              if (isIncluded) {
                onToggleTag(tag)
                onToggleExcludeTag(tag)
              } else if (isExcluded) {
                onToggleExcludeTag(tag)
              } else {
                onToggleTag(tag)
              }
            }
            return (
              <button
                key={tag}
                onClick={handleClick}
                title="Click to cycle: include → exclude → off"
                className={cn(
                  'px-2 py-1 rounded-lg text-[10px] sm:text-[11px] border transition-all cursor-pointer flex items-center gap-1',
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

          <span className="ml-auto text-xs text-text-muted hidden sm:inline">
            {filteredCount} of {totalCount} games
          </span>
        </div>
      </div>
    </div>
  )
}
