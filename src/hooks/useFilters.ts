import { useState, useCallback } from 'react'
import { loadConfig } from '../lib/config'
import type { FilterState, SortOption, ProtonFilter, ReleaseDateFilter } from '../types'

function buildDefaults(): FilterState {
  const config = loadConfig()
  return {
    selectedPlayers: [],
    ownedByAll: false,
    ownedByNone: false,
    freeOnly: false,
    onSaleOnly: false,
    shortlistedOnly: false,
    linuxOnly: config.defaultLinuxOnly,
    genreTags: [],
    excludeGenreTags: [...config.defaultExcludeTags],
    sortBy: [config.defaultSortBy],
    searchQuery: '',
    gameModes: { ...config.defaultGameModes },
    protonFilter: config.defaultProtonFilter,
    releaseDateFilter: config.defaultReleaseDateFilter,
    minReviewCount: config.minReviewCount,
  }
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(buildDefaults)

  const setSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }))
  }, [])

  const toggleSortBy = useCallback((sort: SortOption) => {
    setFilters(prev => {
      const current = prev.sortBy
      if (current[0] === sort) {
        const next = current.slice(1)
        return { ...prev, sortBy: next.length > 0 ? next : ['recommendation'] }
      }
      if (current.includes(sort)) {
        return { ...prev, sortBy: [sort, ...current.filter(s => s !== sort)] }
      }
      return { ...prev, sortBy: [sort, ...current] }
    })
  }, [])

  const toggleOwnedByAll = useCallback(() => {
    setFilters(prev => ({ ...prev, ownedByAll: !prev.ownedByAll, ownedByNone: false }))
  }, [])

  const toggleOwnedByNone = useCallback(() => {
    setFilters(prev => ({ ...prev, ownedByNone: !prev.ownedByNone, ownedByAll: false }))
  }, [])

  const toggleFreeOnly = useCallback(() => {
    setFilters(prev => ({ ...prev, freeOnly: !prev.freeOnly }))
  }, [])

  const toggleOnSaleOnly = useCallback(() => {
    setFilters(prev => ({ ...prev, onSaleOnly: !prev.onSaleOnly }))
  }, [])

  const toggleShortlistedOnly = useCallback(() => {
    setFilters(prev => ({ ...prev, shortlistedOnly: !prev.shortlistedOnly }))
  }, [])

  const toggleLinuxOnly = useCallback(() => {
    setFilters(prev => ({ ...prev, linuxOnly: !prev.linuxOnly }))
  }, [])

  const toggleTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      genreTags: prev.genreTags.includes(tag)
        ? prev.genreTags.filter(t => t !== tag)
        : [...prev.genreTags, tag],
      excludeGenreTags: prev.excludeGenreTags.filter(t => t !== tag),
    }))
  }, [])

  const toggleExcludeTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      excludeGenreTags: prev.excludeGenreTags.includes(tag)
        ? prev.excludeGenreTags.filter(t => t !== tag)
        : [...prev.excludeGenreTags, tag],
      genreTags: prev.genreTags.filter(t => t !== tag),
    }))
  }, [])

  const toggleGameMode = useCallback((mode: keyof FilterState['gameModes']) => {
    setFilters(prev => ({
      ...prev,
      gameModes: { ...prev.gameModes, [mode]: !prev.gameModes[mode] },
    }))
  }, [])

  const setProtonFilter = useCallback((filter: ProtonFilter) => {
    setFilters(prev => ({ ...prev, protonFilter: filter }))
  }, [])

  const setReleaseDateFilter = useCallback((filter: ReleaseDateFilter) => {
    setFilters(prev => ({ ...prev, releaseDateFilter: filter }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(prev => ({ ...buildDefaults(), selectedPlayers: prev.selectedPlayers }))
  }, [])

  const updateSelectedPlayers = useCallback((ids: string[]) => {
    setFilters(prev => ({ ...prev, selectedPlayers: ids }))
  }, [])

  return {
    filters,
    setSearch,
    toggleSortBy,
    toggleOwnedByAll,
    toggleOwnedByNone,
    toggleFreeOnly,
    toggleOnSaleOnly,
    toggleShortlistedOnly,
    toggleLinuxOnly,
    toggleTag,
    toggleExcludeTag,
    toggleGameMode,
    setProtonFilter,
    setReleaseDateFilter,
    resetFilters,
    updateSelectedPlayers,
  }
}
