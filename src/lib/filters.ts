import type { GameWithOwnership, FilterState } from '../types'
import { calculateRecommendationScore } from './api'

export function applyFilters(
  games: GameWithOwnership[],
  filters: FilterState
): GameWithOwnership[] {
  let filtered = games.filter(game => {
    // Hard rules already applied at DB level, but double-check
    if (!game.is_multiplayer) return false
    if (!game.supports_linux) return false
    if (game.servers_deprecated) return false

    // User filters
    if (filters.ownedByAll && !game.all_selected_own) return false
    if (filters.freeOnly && !game.is_free) return false
    if (filters.onSaleOnly && !game.is_on_sale && !game.is_free) return false

    // Genre tag filter
    if (filters.genreTags.length > 0) {
      const gameTags = [...game.steam_tags, ...game.categories].map(t => t.toLowerCase())
      if (!filters.genreTags.some(tag => gameTags.includes(tag.toLowerCase()))) return false
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      if (!game.name.toLowerCase().includes(query)) return false
    }

    return true
  })

  // Sort
  const selectedCount = filters.selectedPlayers.length
  filtered.sort((a, b) => {
    switch (filters.sortBy) {
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
      default:
        return 0
    }
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
