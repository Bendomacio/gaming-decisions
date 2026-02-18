import { useState, useRef, useCallback, useEffect } from 'react'
import { Zap, Database, RefreshCw, Loader2, CheckCircle2, SkipForward, TrendingUp, Users, Settings, Save } from 'lucide-react'
import { loadConfig, saveConfig, DEFAULT_CONFIG } from '../lib/config'
import type { AppConfig } from '../lib/config'
import type { ProtonFilter, ReleaseDateFilter, SortOption } from '../types'

interface GameResult {
  appId: number
  name: string
  status: 'added' | 'skipped'
  reason?: string
}

interface DiscoverState {
  phase: 'idle' | 'discovering' | 'processing' | 'done'
  totalDiscovered: number
  alreadyInDB: number
  pendingAppIds: number[]
  totalAdded: number
  totalSkipped: number
  results: GameResult[]
}

type SettingsTab = 'all' | 'trending' | 'new' | 'coming_soon'

export function Admin() {
  const [running, setRunning] = useState(false)
  const [discover, setDiscover] = useState<DiscoverState>({
    phase: 'idle', totalDiscovered: 0, alreadyInDB: 0,
    pendingAppIds: [], totalAdded: 0, totalSkipped: 0, results: [],
  })
  const [syncLog, setSyncLog] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef(false)
  const pendingRef = useRef<number[]>([])

  // Config state
  const [config, setConfig] = useState<AppConfig>(loadConfig)
  const [configSaved, setConfigSaved] = useState(false)
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('all')

  useEffect(() => {
    pendingRef.current = discover.pendingAppIds
  }, [discover.pendingAppIds])

  const scrollToBottom = useCallback(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    if (discover.phase === 'processing' && discover.pendingAppIds.length > 0 && !processingRef.current) {
      processingRef.current = true
      processNextBatch()
    }
  }, [discover.phase, discover.pendingAppIds])

  const processNextBatch = async () => {
    try {
      const response = await fetch('/api/admin/discover-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingAppIds: pendingRef.current }),
      })
      const data = await response.json()

      if (data.error) {
        setDiscover(prev => ({ ...prev, phase: 'done' }))
        setRunning(false)
        processingRef.current = false
        return
      }

      setDiscover(prev => ({
        ...prev,
        results: [...prev.results, ...data.results],
        pendingAppIds: data.pendingAppIds,
        totalAdded: prev.totalAdded + data.added,
        totalSkipped: prev.totalSkipped + data.skipped,
        phase: data.remaining === 0 ? 'done' : 'processing',
      }))

      if (data.remaining === 0) {
        setRunning(false)
      }

      processingRef.current = false
      setTimeout(scrollToBottom, 10)
    } catch {
      setDiscover(prev => ({ ...prev, phase: 'done' }))
      setRunning(false)
      processingRef.current = false
    }
  }

  const runDiscovery = async () => {
    setRunning(true)
    setDiscover({
      phase: 'discovering', totalDiscovered: 0, alreadyInDB: 0,
      pendingAppIds: [], totalAdded: 0, totalSkipped: 0, results: [],
    })
    setSyncLog(null)

    try {
      const response = await fetch('/api/admin/discover-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()

      if (data.error) {
        setDiscover(prev => ({ ...prev, phase: 'done' }))
        setRunning(false)
        return
      }

      if (data.pendingAppIds.length === 0) {
        setDiscover(prev => ({
          ...prev,
          phase: 'done',
          totalDiscovered: data.totalDiscovered,
          alreadyInDB: data.alreadyInDB,
        }))
        setRunning(false)
        return
      }

      setDiscover(prev => ({
        ...prev,
        phase: 'processing',
        totalDiscovered: data.totalDiscovered,
        alreadyInDB: data.alreadyInDB,
        pendingAppIds: data.pendingAppIds,
      }))
    } catch {
      setDiscover(prev => ({ ...prev, phase: 'done' }))
      setRunning(false)
    }
  }

  const triggerSync = async (endpoint: string, label: string) => {
    setRunning(true)
    setSyncLog(`Running ${label}...`)

    try {
      const res = await fetch(`/api/cron/${endpoint}`)
      const data = await res.json()
      setSyncLog(`${label} complete: ${JSON.stringify(data)}`)
    } catch (err) {
      setSyncLog(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }

    setRunning(false)
  }

  const handleSaveConfig = () => {
    saveConfig(config)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }

  const handleResetConfig = () => {
    setConfig(DEFAULT_CONFIG)
    saveConfig(DEFAULT_CONFIG)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }

  const totalToProcess = discover.totalDiscovered - discover.alreadyInDB
  const processed = discover.results.length
  const progressPct = totalToProcess > 0 ? Math.round((processed / totalToProcess) * 100) : 0

  const toggleBtn = 'px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer'
  const toggleOn = 'bg-accent/15 text-accent border-accent/30'
  const toggleOff = 'bg-bg-card text-text-muted border-border hover:border-border-hover'

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Database size={24} className="text-accent" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        {/* Sync buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={runDiscovery}
            disabled={running}
            className="flex items-center gap-3 p-4 bg-bg-card border border-border rounded-xl hover:border-border-accent transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="p-2.5 bg-accent/15 rounded-lg">
              <Zap size={20} className="text-accent" />
            </div>
            <div>
              <div className="font-medium">Discover Popular Games</div>
              <div className="text-xs text-text-muted mt-0.5">
                Steam top sellers, trending, coming soon, SteamSpy 3000+ players
              </div>
            </div>
          </button>

          <button
            onClick={() => triggerSync('sync-libraries', 'Library Sync')}
            disabled={running}
            className="flex items-center gap-3 p-4 bg-bg-card border border-border rounded-xl hover:border-border-accent transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="p-2.5 bg-success/15 rounded-lg">
              <RefreshCw size={20} className="text-success" />
            </div>
            <div>
              <div className="font-medium">Sync Player Libraries</div>
              <div className="text-xs text-text-muted mt-0.5">
                Update owned games from Steam
              </div>
            </div>
          </button>

          <button
            onClick={() => triggerSync('sync-prices', 'Price Sync')}
            disabled={running}
            className="flex items-center gap-3 p-4 bg-bg-card border border-border rounded-xl hover:border-border-accent transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="p-2.5 bg-warning/15 rounded-lg">
              <Database size={20} className="text-warning" />
            </div>
            <div>
              <div className="font-medium">Sync Prices</div>
              <div className="text-xs text-text-muted mt-0.5">
                Update best prices from IsThereAnyDeal
              </div>
            </div>
          </button>

          <button
            onClick={() => triggerSync('sync-trending', 'Trending Sync')}
            disabled={running}
            className="flex items-center gap-3 p-4 bg-bg-card border border-border rounded-xl hover:border-border-accent transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="p-2.5 bg-accent/15 rounded-lg">
              <TrendingUp size={20} className="text-accent" />
            </div>
            <div>
              <div className="font-medium">Sync Trending</div>
              <div className="text-xs text-text-muted mt-0.5">
                Update trending scores from SteamSpy
              </div>
            </div>
          </button>

          <button
            onClick={() => triggerSync('sync-player-counts', 'Player Count Sync')}
            disabled={running}
            className="flex items-center gap-3 p-4 bg-bg-card border border-border rounded-xl hover:border-border-accent transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="p-2.5 bg-success/15 rounded-lg">
              <Users size={20} className="text-success" />
            </div>
            <div>
              <div className="font-medium">Sync Player Counts</div>
              <div className="text-xs text-text-muted mt-0.5">
                Current players from Steam (50 games/batch)
              </div>
            </div>
          </button>
        </div>

        {/* Sync log */}
        {syncLog && (
          <div className="p-3 bg-bg-secondary border border-border rounded-xl text-sm font-mono text-text-secondary">
            {syncLog}
          </div>
        )}

        {/* Discovery progress */}
        {discover.phase !== 'idle' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-bg-card border border-border rounded-xl">
              {discover.phase === 'done' ? (
                <CheckCircle2 size={20} className="text-success shrink-0" />
              ) : (
                <Loader2 size={20} className="text-accent animate-spin shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {discover.phase === 'discovering' && 'Discovering games from Steam...'}
                    {discover.phase === 'processing' && `Processing games... (${processed}/${totalToProcess})`}
                    {discover.phase === 'done' && `Done! ${discover.totalAdded} games added`}
                  </span>
                  {discover.totalDiscovered > 0 && (
                    <span className="text-xs text-text-muted">
                      {discover.totalDiscovered} discovered, {discover.alreadyInDB} already in DB
                    </span>
                  )}
                </div>
                {discover.phase === 'processing' && (
                  <div className="mt-2 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {discover.results.length > 0 && (
              <div
                ref={logRef}
                className="bg-bg-secondary border border-border rounded-xl p-4 max-h-[400px] overflow-y-auto font-mono text-xs space-y-0.5"
              >
                {discover.results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {r.status === 'added' ? (
                      <>
                        <CheckCircle2 size={11} className="text-success shrink-0" />
                        <span className="text-success">{r.name}</span>
                      </>
                    ) : (
                      <>
                        <SkipForward size={11} className="text-text-muted shrink-0" />
                        <span className="text-text-muted">{r.name} ({r.reason})</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Default Settings */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-accent" />
              <h2 className="text-lg font-semibold">Default Settings</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetConfig}
                className="px-3 py-1.5 rounded-lg text-xs text-text-muted border border-border hover:border-border-hover transition-all cursor-pointer"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSaveConfig}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  configSaved
                    ? 'bg-success/15 text-success border border-success/30'
                    : 'bg-accent text-white hover:bg-accent-hover'
                }`}
              >
                {configSaved ? <CheckCircle2 size={12} /> : <Save size={12} />}
                {configSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>

          <p className="text-xs text-text-muted -mt-3">
            Changes apply on next page load of the main app.
          </p>

          {/* Per-Tab Settings */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-secondary">Per-Tab Defaults</label>
            <div className="flex gap-1.5">
              {([
                ['all', 'All Games'],
                ['trending', 'Trending'],
                ['new', 'New Games'],
                ['coming_soon', 'Coming Soon'],
              ] as [SettingsTab, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setSettingsTab(tab)}
                  className={`${toggleBtn} ${settingsTab === tab ? toggleOn : toggleOff}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="bg-bg-card border border-border rounded-lg p-4 space-y-4">
              {/* Min Review Count (per tab) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Minimum Steam Reviews</label>
                <p className="text-xs text-text-muted">Hide games with fewer reviews than this (0 = show all)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={config.tabs[settingsTab].minReviewCount}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      tabs: { ...prev.tabs, [settingsTab]: { ...prev.tabs[settingsTab], minReviewCount: Math.max(0, parseInt(e.target.value) || 0) } },
                    }))}
                    className="w-28 bg-bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-accent transition-colors"
                  />
                  <div className="flex gap-1.5">
                    {[0, 50, 150, 500, 1000].map(n => (
                      <button
                        key={n}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          tabs: { ...prev.tabs, [settingsTab]: { ...prev.tabs[settingsTab], minReviewCount: n } },
                        }))}
                        className={`${toggleBtn} ${config.tabs[settingsTab].minReviewCount === n ? toggleOn : toggleOff}`}
                      >
                        {n === 0 ? 'Off' : n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Default Sort Stack (per tab) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Default Sort Stack</label>
                <p className="text-xs text-text-muted">Click to toggle. Order shown by number badges — first is primary sort.</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ['recommendation', 'Recommended'],
                    ['review_score', 'Rating'],
                    ['price_asc', 'Price: Low'],
                    ['current_players', 'Playing Now'],
                    ['trending', 'Trending'],
                    ['release_date', 'Release Date'],
                    ['name', 'Name'],
                    ['recently_added', 'Recently Added'],
                  ] as [SortOption, string][]).map(([value, label]) => {
                    const currentSort = config.tabs[settingsTab].sortBy
                    const idx = currentSort.indexOf(value)
                    const isActive = idx !== -1
                    return (
                      <button
                        key={value}
                        onClick={() => setConfig(prev => {
                          const cur = prev.tabs[settingsTab].sortBy
                          const i = cur.indexOf(value)
                          let next: SortOption[]
                          if (i !== -1) {
                            next = cur.filter(s => s !== value)
                            if (next.length === 0) next = ['recommendation']
                          } else {
                            next = [...cur, value]
                          }
                          return { ...prev, tabs: { ...prev.tabs, [settingsTab]: { ...prev.tabs[settingsTab], sortBy: next } } }
                        })}
                        className={`${toggleBtn} ${isActive ? toggleOn : toggleOff} relative`}
                      >
                        {isActive && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold mr-1">
                            {idx + 1}
                          </span>
                        )}
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Default Game Modes (per tab) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Default Game Modes</label>
                <p className="text-xs text-text-muted">Which modes are enabled by default</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ['multiplayer', 'Multiplayer'],
                    ['coop', 'Co-op'],
                    ['singlePlayer', 'Single Player'],
                    ['localMultiplayer', 'Local MP'],
                  ] as [keyof AppConfig['tabs']['all']['gameModes'], string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        tabs: {
                          ...prev.tabs,
                          [settingsTab]: {
                            ...prev.tabs[settingsTab],
                            gameModes: { ...prev.tabs[settingsTab].gameModes, [key]: !prev.tabs[settingsTab].gameModes[key] },
                          },
                        },
                      }))}
                      className={`${toggleBtn} ${config.tabs[settingsTab].gameModes[key] ? toggleOn : toggleOff}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Linux Filter Default */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Linux Filter</label>
            <div className="flex gap-1.5">
              <button
                onClick={() => setConfig(prev => ({ ...prev, defaultLinuxOnly: false }))}
                className={`${toggleBtn} ${!config.defaultLinuxOnly ? toggleOn : toggleOff}`}
              >
                Off (show all)
              </button>
              <button
                onClick={() => setConfig(prev => ({ ...prev, defaultLinuxOnly: true }))}
                className={`${toggleBtn} ${config.defaultLinuxOnly ? toggleOn : toggleOff}`}
              >
                On (Linux only)
              </button>
            </div>
          </div>

          {/* Proton Filter Default */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Default Proton Filter</label>
            <div className="flex gap-1.5">
              {([
                ['all', 'All'],
                ['native', 'Native'],
                ['platinum', 'Platinum+'],
                ['gold', 'Gold+'],
              ] as [ProtonFilter, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setConfig(prev => ({ ...prev, defaultProtonFilter: value }))}
                  className={`${toggleBtn} ${config.defaultProtonFilter === value ? toggleOn : toggleOff}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Release Date Filter Default */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Default Release Date</label>
            <div className="flex flex-wrap gap-1.5">
              {([
                ['all', 'Any'],
                ['year', '1yr'],
                ['2years', '2yr'],
                ['3years', '3yr'],
                ['5years', '5yr'],
                ['10years', '10yr'],
              ] as [ReleaseDateFilter, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setConfig(prev => ({ ...prev, defaultReleaseDateFilter: value }))}
                  className={`${toggleBtn} ${config.defaultReleaseDateFilter === value ? toggleOn : toggleOff}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Default Excluded Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Default Excluded Tags</label>
            <p className="text-xs text-text-muted">Tags excluded by default (click to remove)</p>
            <div className="flex flex-wrap gap-1.5">
              {config.defaultExcludeTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    defaultExcludeTags: prev.defaultExcludeTags.filter(t => t !== tag),
                  }))}
                  className="px-3 py-1.5 rounded-lg text-xs border bg-error/15 text-error border-error/30 cursor-pointer line-through"
                >
                  {tag}
                </button>
              ))}
              {config.defaultExcludeTags.length === 0 && (
                <span className="text-xs text-text-muted italic">None</span>
              )}
              {!config.defaultExcludeTags.includes('Massively Multiplayer') && (
                <button
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    defaultExcludeTags: [...prev.defaultExcludeTags, 'Massively Multiplayer'],
                  }))}
                  className={`${toggleBtn} ${toggleOff}`}
                >
                  + MMO
                </button>
              )}
              {!config.defaultExcludeTags.includes('Sexual Content') && (
                <button
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    defaultExcludeTags: [...prev.defaultExcludeTags, 'Sexual Content'],
                  }))}
                  className={`${toggleBtn} ${toggleOff}`}
                >
                  + Sexual Content
                </button>
              )}
              {!config.defaultExcludeTags.includes('Early Access') && (
                <button
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    defaultExcludeTags: [...prev.defaultExcludeTags, 'Early Access'],
                  }))}
                  className={`${toggleBtn} ${toggleOff}`}
                >
                  + Early Access
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-text-muted">
          Game discovery runs automatically every Monday. Use buttons to trigger manually.
        </div>
      </div>
    </div>
  )
}
