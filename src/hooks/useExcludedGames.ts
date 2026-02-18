import { useState, useCallback, useEffect } from 'react'

export interface ExcludedEntry {
  reason: string
  excludedBy: string
}

type ExcludedMap = Record<string, ExcludedEntry>

const STORAGE_KEY = 'gaming-decisions-excluded'

function load(): ExcludedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(map: ExcludedMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function useExcludedGames() {
  const [excluded, setExcluded] = useState<ExcludedMap>(load)

  useEffect(() => {
    save(excluded)
  }, [excluded])

  const isExcluded = useCallback((gameId: string) => {
    return gameId in excluded
  }, [excluded])

  const getEntry = useCallback((gameId: string): ExcludedEntry | null => {
    return excluded[gameId] ?? null
  }, [excluded])

  const excludeGame = useCallback((gameId: string, reason: string, excludedBy: string) => {
    setExcluded(prev => ({ ...prev, [gameId]: { reason, excludedBy } }))
  }, [])

  const restoreGame = useCallback((gameId: string) => {
    setExcluded(prev => {
      const next = { ...prev }
      delete next[gameId]
      return next
    })
  }, [])

  const excludedIds = new Set(Object.keys(excluded))

  return {
    excluded,
    excludedIds,
    isExcluded,
    getEntry,
    excludeGame,
    restoreGame,
  }
}
