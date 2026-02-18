import { useState, useEffect } from 'react'
import { Header } from './components/layout/Header'
import { TabNav } from './components/layout/TabNav'
import { PlayerSelector } from './components/players/PlayerSelector'
import { GameTable } from './components/games/GameTable'
import { GameFilters } from './components/games/GameFilters'
import { GameDetailPanel } from './components/games/GameDetailPanel'
import { usePlayers } from './hooks/usePlayers'
import { useGames } from './hooks/useGames'
import { useFilters } from './hooks/useFilters'
import { fetchLatestSync } from './lib/api'
import { applyFilters, getAvailableTags } from './lib/filters'
import type { GameWithOwnership, SyncLog, AppTab } from './types'

function App() {
  const { players, selectedPlayerIds, togglePlayer, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading, refetch } = useGames(players, selectedPlayerIds)
  const {
    filters, setSearch, setSortBy,
    toggleOwnedByAll, toggleFreeOnly, toggleOnSaleOnly,
    toggleTag, toggleGameMode, setProtonFilter,
    setReleaseDateFilter, resetFilters, updateSelectedPlayers,
  } = useFilters()

  const [activeTab, setActiveTab] = useState<AppTab>('all')
  const [selectedGame, setSelectedGame] = useState<GameWithOwnership | null>(null)
  const [lastSync, setLastSync] = useState<SyncLog | null>(null)
  const [syncing, setSyncing] = useState(false)

  // Keep filter state synced with selected players
  useEffect(() => {
    updateSelectedPlayers(selectedPlayerIds)
  }, [selectedPlayerIds, updateSelectedPlayers])

  // Load sync status
  useEffect(() => {
    fetchLatestSync().then(setLastSync).catch(console.error)
  }, [])

  const handleRefresh = async () => {
    setSyncing(true)
    try {
      await refetch()
      const sync = await fetchLatestSync()
      setLastSync(sync)
    } finally {
      setSyncing(false)
    }
  }

  // Apply filters per tab
  const filtersWithPlayers = { ...filters, selectedPlayers: selectedPlayerIds }
  const filteredGames = applyFilters(games, filtersWithPlayers, activeTab)
  const availableTags = getAvailableTags(games)

  // Tab counts
  const allCount = applyFilters(games, filtersWithPlayers, 'all').length
  const trendingCount = applyFilters(games, filtersWithPlayers, 'trending').length
  const newCount = applyFilters(games, filtersWithPlayers, 'new').length

  const loading = playersLoading || gamesLoading

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header lastSync={lastSync} onRefresh={handleRefresh} syncing={syncing} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Player selector */}
        <PlayerSelector
          players={players}
          selectedIds={selectedPlayerIds}
          onToggle={togglePlayer}
        />

        {/* Tab navigation */}
        <TabNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{ all: allCount, trending: trendingCount, new: newCount }}
        />

        {/* Filters */}
        <GameFilters
          filters={filtersWithPlayers}
          totalCount={games.length}
          filteredCount={filteredGames.length}
          availableTags={availableTags}
          activeTab={activeTab}
          onSearch={setSearch}
          onSortBy={setSortBy}
          onToggleOwnedByAll={toggleOwnedByAll}
          onToggleFreeOnly={toggleFreeOnly}
          onToggleOnSaleOnly={toggleOnSaleOnly}
          onToggleTag={toggleTag}
          onToggleGameMode={toggleGameMode}
          onSetProtonFilter={setProtonFilter}
          onSetReleaseDateFilter={setReleaseDateFilter}
          onReset={resetFilters}
        />

        {/* Game table */}
        <GameTable
          games={filteredGames}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          loading={loading}
          sortBy={filters.sortBy}
          onSortBy={setSortBy}
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
