import type { GameWithOwnership, FilterState, AppTab, SortOption } from '../types'
import { calculateRecommendationScore } from './api'

const MULTIPLAYER_CATS = ['Multi-player', 'Online Multi-Player']
const COOP_CATS = ['Co-op', 'Online Co-op']
const SINGLE_PLAYER_CATS = ['Single-player']
const LOCAL_MP_CATS = ['Shared/Split Screen', 'Shared/Split Screen Co-op', 'LAN Co-op', 'Shared/Split Screen PvP']

function matchesGameModes(categories: string[], filters: FilterState['gameModes']): boolean {
  const hasMP = categories.some(c => MULTIPLAYER_CATS.includes(c))
  const hasCoop = categories.some(c => COOP_CATS.includes(c))
  const hasSP = categories.some(c => SINGLE_PLAYER_CATS.includes(c))
  const hasLocal = categories.some(c => LOCAL_MP_CATS.includes(c))

  const enabledModes: boolean[] = []
  if (filters.multiplayer) enabledModes.push(hasMP)
  if (filters.coop) enabledModes.push(hasCoop)
  if (filters.singlePlayer) enabledModes.push(hasSP)
  if (filters.localMultiplayer) enabledModes.push(hasLocal)

  if (enabledModes.length === 0) return true
  return enabledModes.some(Boolean)
}

function matchesProtonFilter(rating: string | null, filter: FilterState['protonFilter']): boolean {
  if (filter === 'all') return true
  if (filter === 'native') return rating === 'native'
  if (filter === 'platinum') return rating === 'native' || rating === 'platinum'
  if (filter === 'gold') return rating === 'native' || rating === 'platinum' || rating === 'gold'
  return true
}

function matchesReleaseDate(releaseDate: string | null, filter: FilterState['releaseDateFilter']): boolean {
  if (filter === 'all') return true
  if (!releaseDate) return false

  const date = new Date(releaseDate)
  if (isNaN(date.getTime())) return false

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  switch (filter) {
    case 'week': return diffDays <= 7
    case 'month': return diffDays <= 30
    case '3months': return diffDays <= 90
    case '6months': return diffDays <= 180
    case 'year': return diffDays <= 365
    case '2years': return diffDays <= 730
    case '3years': return diffDays <= 1095
    case '5years': return diffDays <= 1825
    case '10years': return diffDays <= 3650
    default: return true
  }
}

export function applyFilters(
  games: GameWithOwnership[],
  filters: FilterState,
  tab: AppTab = 'all',
  shortlistedIds?: Set<string>,
  excludedIds?: Set<string>
): GameWithOwnership[] {
  let filtered = games.filter(game => {
    if (game.servers_deprecated) return false

    // Linux filter (togglable, default on)
    if (filters.linuxOnly && !game.supports_linux) return false

    // Excluded games: hide from all tabs except 'excluded', only show on 'excluded'
    if (tab === 'excluded') {
      if (!excludedIds?.has(game.id)) return false
    } else {
      if (excludedIds?.has(game.id)) return false
    }

    // Max player count filter: hide games that can't fit the selected group
    const groupSize = filters.selectedPlayers.length
    if (groupSize > 0 && game.max_players !== null && game.max_players < groupSize) return false

    // Game mode filters
    if (!matchesGameModes(game.categories, filters.gameModes)) return false

    // Proton filter
    if (!matchesProtonFilter(game.protondb_rating, filters.protonFilter)) return false

    // Release date filter (applies on all tabs)
    if (!matchesReleaseDate(game.release_date, filters.releaseDateFilter)) return false

    // Tab-specific filters
    if (tab === 'trending') {
      if (!game.trending_score || game.trending_score <= 0) return false
    }

    // Treat free games as owned by all for filtering purposes
    const effectiveAllOwn = game.is_free || game.all_selected_own

    // Shortlist filter (from filter button or tab)
    if ((filters.shortlistedOnly || tab === 'shortlisted') && shortlistedIds && !shortlistedIds.has(game.id)) return false

    // User filters
    if (filters.ownedByAll && !effectiveAllOwn) return false
    if (filters.freeOnly && !game.is_free) return false
    if (filters.onSaleOnly && !game.is_on_sale && !game.is_free) return false

    // Include genre tag filter
    if (filters.genreTags.length > 0) {
      const gameTags = [...game.steam_tags, ...game.categories].map(t => t.toLowerCase())
      if (!filters.genreTags.some(tag => gameTags.includes(tag.toLowerCase()))) return false
    }

    // Exclude genre tag filter
    if (filters.excludeGenreTags.length > 0) {
      const gameTags = [...game.steam_tags, ...game.categories].map(t => t.toLowerCase())
      if (filters.excludeGenreTags.some(tag => gameTags.includes(tag.toLowerCase()))) return false
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      if (!game.name.toLowerCase().includes(query)) return false
    }

    return true
  })

  // Sort - user's sort keys apply on ALL tabs, with tab-specific default appended
  const selectedCount = filters.selectedPlayers.length
  const userSort = filters.sortBy
  const tabDefault: SortOption | null = tab === 'trending' ? 'trending' :
                                        tab === 'new' ? 'release_date' : null
  const sortKeys = tabDefault && !userSort.includes(tabDefault)
    ? [...userSort, tabDefault]
    : userSort

  function compareBySortKey(a: GameWithOwnership, b: GameWithOwnership, sortBy: SortOption): number {
    switch (sortBy) {
      case 'recommendation':
        return calculateRecommendationScore(b, selectedCount) - calculateRecommendationScore(a, selectedCount)
      case 'price_asc': {
        const priceA = a.is_free ? 0 : (a.best_price_cents ?? a.steam_price_cents ?? 99999)
        const priceB = b.is_free ? 0 : (b.best_price_cents ?? b.steam_price_cents ?? 99999)
        return priceA - priceB
      }
      case 'price_desc': {
        const priceA = a.is_free ? 0 : (a.best_price_cents ?? a.steam_price_cents ?? 0)
        const priceB = b.is_free ? 0 : (b.best_price_cents ?? b.steam_price_cents ?? 0)
        return priceB - priceA
      }
      case 'review_score':
        return (b.steam_review_score ?? 0) - (a.steam_review_score ?? 0)
      case 'playtime': {
        const ptA = a.owners.reduce((sum, o) => sum + o.playtime_hours, 0)
        const ptB = b.owners.reduce((sum, o) => sum + o.playtime_hours, 0)
        return ptB - ptA
      }
      case 'name':
        return a.name.localeCompare(b.name)
      case 'recently_added':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'trending':
        return (b.trending_score ?? 0) - (a.trending_score ?? 0)
      case 'release_date': {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0
        return dateB - dateA
      }
      case 'current_players':
        return (b.current_players ?? 0) - (a.current_players ?? 0)
      default:
        return 0
    }
  }

  filtered.sort((a, b) => {
    for (const key of sortKeys) {
      const result = compareBySortKey(a, b, key)
      if (result !== 0) return result
    }
    return 0
  })

  return filtered
}

export function getAvailableTags(games: GameWithOwnership[]): string[] {
  const tagCounts = new Map<string, number>()

  for (const game of games) {
    for (const tag of game.steam_tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag]) => tag)
}
