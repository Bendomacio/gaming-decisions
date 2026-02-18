import { Search, SlidersHorizontal, X, Filter } from 'lucide-react'
import { Button } from '../ui/Button'
import type { FilterState, SortOption } from '../../types'
import { cn } from '../../lib/utils'

interface GameFiltersProps {
  filters: FilterState
  totalCount: number
  filteredCount: number
  availableTags: string[]
  onSearch: (query: string) => void
  onSortBy: (sort: SortOption) => void
  onToggleOwnedByAll: () => void
  onToggleFreeOnly: () => void
  onToggleOnSaleOnly: () => void
  onToggleTag: (tag: string) => void
  onReset: () => void
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recommendation', label: 'Recommended' },
  { value: 'review_score', label: 'Rating' },
  { value: 'price_asc', label: 'Price: Low' },
  { value: 'price_desc', label: 'Price: High' },
  { value: 'playtime', label: 'Playtime' },
  { value: 'name', label: 'Name' },
  { value: 'recently_added', label: 'New' },
]

export function GameFilters({
  filters,
  totalCount,
  filteredCount,
  availableTags,
  onSearch,
  onSortBy,
  onToggleOwnedByAll,
  onToggleFreeOnly,
  onToggleOnSaleOnly,
  onToggleTag,
  onReset,
}: GameFiltersProps) {
  const hasActiveFilters = filters.ownedByAll || filters.freeOnly || filters.onSaleOnly || filters.genreTags.length > 0

  return (
    <div className="space-y-3">
      {/* Search + Sort row */}
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

        <div className="flex items-center gap-1.5 bg-bg-input border border-border rounded-lg p-1">
          <SlidersHorizontal size={12} className="text-text-muted ml-1.5" />
          {sortOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSortBy(opt.value)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer',
                filters.sortBy === opt.value
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter toggles */}
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

        {availableTags.slice(0, 8).map(tag => (
          <button
            key={tag}
            onClick={() => onToggleTag(tag)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs border transition-all cursor-pointer',
              filters.genreTags.includes(tag)
                ? 'bg-accent-dim text-accent-hover border-border-accent'
                : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
            )}
          >
            {tag}
          </button>
        ))}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X size={12} />
            Clear
          </Button>
        )}

        <span className="ml-auto text-xs text-text-muted">
          {filteredCount} of {totalCount} games
        </span>
      </div>
    </div>
  )
}
