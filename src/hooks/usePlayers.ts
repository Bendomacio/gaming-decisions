import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchPlayers } from '../lib/api'
import type { Player } from '../types'

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPlayers()
        setPlayers(data)
        // Default: select all primary players
        setSelectedPlayerIds(data.filter(p => p.is_primary).map(p => p.id))
      } catch (err) {
        console.error('Failed to load players:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('players-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, async () => {
        const data = await fetchPlayers()
        setPlayers(data)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function togglePlayer(playerId: string) {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  return { players, selectedPlayerIds, togglePlayer, loading }
}
