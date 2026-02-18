import { useState, useEffect } from 'react'
import { Header } from './components/layout/Header'
import { PlayerSelector } from './components/players/PlayerSelector'
import { GameGrid } from './components/games/GameGrid'
import { GameFilters } from './components/games/GameFilters'
import { GameDetailPanel } from './components/games/GameDetailPanel'
import { QuickPick } from './components/dashboard/QuickPick'
import { TrendingSection } from './components/dashboard/TrendingSection'
import { ComingSoon } from './components/dashboard/ComingSoon'
import { StatsOverview } from './components/dashboard/StatsOverview'
import { usePlayers } from './hooks/usePlayers'
import { useGames } from './hooks/useGames'
import { useFilters } from './hooks/useFilters'
import { fetchLatestSync, fetchPlayerGames } from './lib/api'
import { applyFilters, getAvailableTags } from './lib/filters'
import type { GameWithOwnership, SyncLog, PlayerGame } from './types'

function App() {
  const { players, selectedPlayerIds, togglePlayer, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading, refetch } = useGames(players, selectedPlayerIds)
  const {
    filters, setSearch, setSortBy,
    toggleOwnedByAll, toggleFreeOnly, toggleOnSaleOnly,
    toggleTag, resetFilters, updateSelectedPlayers,
  } = useFilters()

  const [selectedGame, setSelectedGame] = useState<GameWithOwnership | null>(null)
  const [lastSync, setLastSync] = useState<SyncLog | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [allPlayerGames, setAllPlayerGames] = useState<PlayerGame[]>([])

  // Keep filter state synced with selected players
  useEffect(() => {
    updateSelectedPlayers(selectedPlayerIds)
  }, [selectedPlayerIds, updateSelectedPlayers])

  // Load sync status and player games
  useEffect(() => {
    fetchLatestSync().then(setLastSync).catch(console.error)
    fetchPlayerGames().then(setAllPlayerGames).catch(console.error)
  }, [])

  const handleRefresh = async () => {
    setSyncing(true)
    try {
      await refetch()
      const sync = await fetchLatestSync()
      setLastSync(sync)
      const pg = await fetchPlayerGames()
      setAllPlayerGames(pg)
    } finally {
      setSyncing(false)
    }
  }

  // Apply filters
  const filtersWithPlayers = { ...filters, selectedPlayers: selectedPlayerIds }
  const filteredGames = applyFilters(games, filtersWithPlayers)
  const availableTags = getAvailableTags(games)

  const loading = playersLoading || gamesLoading

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header lastSync={lastSync} onRefresh={handleRefresh} syncing={syncing} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Player selector */}
        <PlayerSelector
          players={players}
          selectedIds={selectedPlayerIds}
          onToggle={togglePlayer}
        />

        {/* Quick picks */}
        {!loading && games.length > 0 && (
          <QuickPick
            games={filteredGames}
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            onGameClick={setSelectedGame}
          />
        )}

        {/* Trending */}
        {!loading && games.length > 0 && (
          <TrendingSection
            games={filteredGames}
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            onGameClick={setSelectedGame}
          />
        )}

        {/* Coming Soon */}
        {!loading && games.length > 0 && (
          <ComingSoon
            games={games}
            onGameClick={setSelectedGame}
          />
        )}

        {/* Stats overview */}
        {!loading && games.length > 0 && (
          <StatsOverview
            games={games}
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            allPlayerGames={allPlayerGames}
          />
        )}

        {/* Filters */}
        <GameFilters
          filters={filtersWithPlayers}
          totalCount={games.length}
          filteredCount={filteredGames.length}
          availableTags={availableTags}
          onSearch={setSearch}
          onSortBy={setSortBy}
          onToggleOwnedByAll={toggleOwnedByAll}
          onToggleFreeOnly={toggleFreeOnly}
          onToggleOnSaleOnly={toggleOnSaleOnly}
          onToggleTag={toggleTag}
          onReset={resetFilters}
        />

        {/* Game grid */}
        <GameGrid
          games={filteredGames}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          loading={loading}
          onGameClick={setSelectedGame}
        />
      </main>

      {/* Game detail panel */}
      {selectedGame && (
        <GameDetailPanel
          game={selectedGame}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  )
}

export default App
