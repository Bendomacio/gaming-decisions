import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { fetchGames, fetchPlayerGames, buildGamesWithOwnership } from '../lib/api'
import type { Game, PlayerGame, GameWithOwnership, Player } from '../types'

export function useGames(players: Player[], selectedPlayerIds: string[]) {
  const [games, setGames] = useState<Game[]>([])
  const [playerGames, setPlayerGames] = useState<PlayerGame[]>([])
  const [gamesWithOwnership, setGamesWithOwnership] = useState<GameWithOwnership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [gamesData, pgData] = await Promise.all([
        fetchGames(),
        fetchPlayerGames(),
      ])
      setGames(gamesData)
      setPlayerGames(pgData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Build ownership whenever data or selection changes
  useEffect(() => {
    if (games.length > 0 && players.length > 0) {
      const withOwnership = buildGamesWithOwnership(games, playerGames, players, selectedPlayerIds)
      setGamesWithOwnership(withOwnership)
    }
  }, [games, playerGames, players, selectedPlayerIds])

  // Real-time subscription
  useEffect(() => {
    const gamesChannel = supabase
      .channel('games-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_games' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(gamesChannel)
    }
  }, [loadData])

  return { games: gamesWithOwnership, loading, error, refetch: loadData }
}
