import { useState, useCallback } from 'react'
import type { FilterState, SortOption } from '../types'

const defaultFilters: FilterState = {
  selectedPlayers: [],
  ownedByAll: false,
  freeOnly: false,
  onSaleOnly: false,
  genreTags: [],
  sortBy: 'recommendation',
  searchQuery: '',
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const setSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }))
  }, [])

  const setSortBy = useCallback((sortBy: SortOption) => {
    setFilters(prev => ({ ...prev, sortBy }))
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
    }))
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
    setSortBy,
    toggleOwnedByAll,
    toggleFreeOnly,
    toggleOnSaleOnly,
    toggleTag,
    resetFilters,
    updateSelectedPlayers,
  }
}
