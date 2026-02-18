import { useState, useCallback, useEffect } from 'react'

export interface ShortlistEntry {
  players: string[] // player names who shortlisted
  reason: string
}

type ShortlistMap = Record<string, ShortlistEntry>

const STORAGE_KEY = 'gaming-decisions-shortlist'

function load(): ShortlistMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(map: ShortlistMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function useShortlist() {
  const [shortlist, setShortlist] = useState<ShortlistMap>(load)

  // Persist on change
  useEffect(() => {
    save(shortlist)
  }, [shortlist])

  const isShortlisted = useCallback((gameId: string) => {
    return gameId in shortlist
  }, [shortlist])

  const getEntry = useCallback((gameId: string): ShortlistEntry | null => {
    return shortlist[gameId] ?? null
  }, [shortlist])

  const toggleShortlist = useCallback((gameId: string) => {
    setShortlist(prev => {
      if (gameId in prev) {
        const next = { ...prev }
        delete next[gameId]
        return next
      }
      return { ...prev, [gameId]: { players: [], reason: '' } }
    })
  }, [])

  const updateEntry = useCallback((gameId: string, entry: Partial<ShortlistEntry>) => {
    setShortlist(prev => {
      if (!(gameId in prev)) return prev
      return { ...prev, [gameId]: { ...prev[gameId], ...entry } }
    })
  }, [])

  const togglePlayer = useCallback((gameId: string, playerName: string) => {
    setShortlist(prev => {
      if (!(gameId in prev)) return prev
      const current = prev[gameId]
      const players = current.players.includes(playerName)
        ? current.players.filter(p => p !== playerName)
        : [...current.players, playerName]
      return { ...prev, [gameId]: { ...current, players } }
    })
  }, [])

  const setReason = useCallback((gameId: string, reason: string) => {
    setShortlist(prev => {
      if (!(gameId in prev)) return prev
      return { ...prev, [gameId]: { ...prev[gameId], reason } }
    })
  }, [])

  const shortlistedIds = new Set(Object.keys(shortlist))

  return {
    shortlist,
    shortlistedIds,
    isShortlisted,
    getEntry,
    toggleShortlist,
    updateEntry,
    togglePlayer,
    setReason,
  }
}
