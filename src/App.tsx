import { useState, useEffect, useCallback } from 'react'
import { Header } from './components/layout/Header'
import { TabNav } from './components/layout/TabNav'
import { PlayerSelector } from './components/players/PlayerSelector'
import { GameTable } from './components/games/GameTable'
import { GameFilters } from './components/games/GameFilters'
import { GameDetailPanel } from './components/games/GameDetailPanel'
import { usePlayers } from './hooks/usePlayers'
import { useGames } from './hooks/useGames'
import { useFilters } from './hooks/useFilters'
import { useShortlist } from './hooks/useShortlist'
import { useExcludedGames } from './hooks/useExcludedGames'
import { useTheme } from './hooks/useTheme'
import { fetchLatestSync } from './lib/api'
import { applyFilters, getAvailableTags } from './lib/filters'
import type { GameWithOwnership, SyncLog, AppTab } from './types'

function App() {
  const { players, selectedPlayerIds, togglePlayer, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading, refetch } = useGames(players, selectedPlayerIds)
  const {
    filters, setSearch, toggleSortBy,
    toggleOwnedByAll, toggleOwnedByNone, toggleFreeOnly, toggleOnSaleOnly, toggleLinuxOnly, toggleHideUnplayedFree,
    toggleTag, toggleExcludeTag, toggleGameMode, setProtonFilter,
    setReleaseDateFilter, resetFilters, updateSelectedPlayers, applyTabDefaults,
  } = useFilters()
  const {
    shortlistedIds, getEntry, toggleShortlist,
    togglePlayer: toggleShortlistPlayer, setReason,
  } = useShortlist()
  const {
    excludedIds, getEntry: getExcludedEntry, excludeGame, restoreGame,
  } = useExcludedGames()
  const { theme, setTheme } = useTheme()

  const [activeTab, setActiveTabState] = useState<AppTab>('all')

  const setActiveTab = useCallback((tab: AppTab) => {
    setActiveTabState(tab)
    applyTabDefaults(tab)
  }, [applyTabDefaults])
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
  const macRequired = players.some(p => selectedPlayerIds.includes(p.id) && p.requires_mac)
  const filteredGames = applyFilters(games, filtersWithPlayers, activeTab, shortlistedIds, excludedIds, macRequired)
  const availableTags = getAvailableTags(games)

  // Tab counts
  const allCount = applyFilters(games, filtersWithPlayers, 'all', shortlistedIds, excludedIds, macRequired).length
  const trendingCount = applyFilters(games, filtersWithPlayers, 'trending', shortlistedIds, excludedIds, macRequired).length
  const newCount = applyFilters(games, filtersWithPlayers, 'new', shortlistedIds, excludedIds, macRequired).length
  const comingSoonCount = applyFilters(games, filtersWithPlayers, 'coming_soon', shortlistedIds, excludedIds, macRequired).length
  const shortlistedCount = applyFilters(games, filtersWithPlayers, 'shortlisted', shortlistedIds, excludedIds, macRequired).length
  const excludedCount = applyFilters(games, filtersWithPlayers, 'excluded', shortlistedIds, excludedIds, macRequired).length

  const loading = playersLoading || gamesLoading

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header lastSync={lastSync} onRefresh={handleRefresh} syncing={syncing} theme={theme} onThemeChange={setTheme} />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-5 space-y-3 sm:space-y-4">
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
          counts={{ all: allCount, trending: trendingCount, new: newCount, coming_soon: comingSoonCount, shortlisted: shortlistedCount, excluded: excludedCount }}
        />

        {/* Filters */}
        <GameFilters
          filters={filtersWithPlayers}
          totalCount={games.length}
          filteredCount={filteredGames.length}
          availableTags={availableTags}
          activeTab={activeTab}
          onSearch={setSearch}
          onToggleSortBy={toggleSortBy}
          onToggleOwnedByAll={toggleOwnedByAll}
          onToggleOwnedByNone={toggleOwnedByNone}
          onToggleFreeOnly={toggleFreeOnly}
          onToggleOnSaleOnly={toggleOnSaleOnly}
          onToggleLinuxOnly={toggleLinuxOnly}
          onToggleHideUnplayedFree={toggleHideUnplayedFree}
          onToggleTag={toggleTag}
          onToggleExcludeTag={toggleExcludeTag}
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
          shortlistedIds={shortlistedIds}
          excludedIds={excludedIds}
          getShortlistEntry={getEntry}
          getExcludedEntry={getExcludedEntry}
          onToggleSortBy={toggleSortBy}
          onGameClick={setSelectedGame}
          onShortlistToggle={toggleShortlist}
          onShortlistTogglePlayer={toggleShortlistPlayer}
          onShortlistSetReason={setReason}
          onExclude={excludeGame}
          onRestore={restoreGame}
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
