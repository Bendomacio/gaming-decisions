import { useState, useCallback } from 'react'
import type { FilterState, SortOption, ProtonFilter, ReleaseDateFilter } from '../types'

const defaultFilters: FilterState = {
  selectedPlayers: [],
  ownedByAll: false,
  freeOnly: false,
  onSaleOnly: false,
  genreTags: [],
  excludeGenreTags: ['Massively Multiplayer'],
  sortBy: ['recommendation'],
  searchQuery: '',
  gameModes: {
    multiplayer: true,
    coop: true,
    singlePlayer: false,
    localMultiplayer: false,
  },
  protonFilter: 'all',
  releaseDateFilter: '5years',
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const setSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }))
  }, [])

  const toggleSortBy = useCallback((sort: SortOption) => {
    setFilters(prev => {
      const current = prev.sortBy
      if (current[0] === sort) {
        // Already primary - remove it, promote next or fall back
        const next = current.slice(1)
        return { ...prev, sortBy: next.length > 0 ? next : ['recommendation'] }
      }
      if (current.includes(sort)) {
        // Already in chain but not primary - promote to front
        return { ...prev, sortBy: [sort, ...current.filter(s => s !== sort)] }
      }
      // Not in chain - add to front as primary
      return { ...prev, sortBy: [sort, ...current] }
    })
  }, [])

  const toggleOwnedByAll = useCallback(() => {
    setFilters(prev => ({ ...prev, ownedByAll: !prev.ownedByAll }))
  }, [])

  const toggleFreeOnly = useCallback(() => {
    setFilters(prev => ({ ...prev, freeOnly: !prev.freeOnly }))
  }, [])

  const toggleOnSaleOnly = useCallback(() => {
    setFilters(prev => ({ ...prev, onSaleOnly: !prev.onSaleOnly }))
  }, [])

  const toggleTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      genreTags: prev.genreTags.includes(tag)
        ? prev.genreTags.filter(t => t !== tag)
        : [...prev.genreTags, tag],
      // Remove from exclude if adding to include
      excludeGenreTags: prev.excludeGenreTags.filter(t => t !== tag),
    }))
  }, [])

  const toggleExcludeTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      excludeGenreTags: prev.excludeGenreTags.includes(tag)
        ? prev.excludeGenreTags.filter(t => t !== tag)
        : [...prev.excludeGenreTags, tag],
      // Remove from include if adding to exclude
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
    setFilters(prev => ({ ...defaultFilters, selectedPlayers: prev.selectedPlayers }))
  }, [])

  const updateSelectedPlayers = useCallback((ids: string[]) => {
    setFilters(prev => ({ ...prev, selectedPlayers: ids }))
  }, [])

  return {
    filters,
    setSearch,
    toggleSortBy,
    toggleOwnedByAll,
    toggleFreeOnly,
    toggleOnSaleOnly,
    toggleTag,
    toggleExcludeTag,
    toggleGameMode,
    setProtonFilter,
    setReleaseDateFilter,
    resetFilters,
    updateSelectedPlayers,
  }
}
