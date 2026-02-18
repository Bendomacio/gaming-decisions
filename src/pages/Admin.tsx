import { useState, useRef, useCallback, useEffect } from 'react'
import { Zap, Database, RefreshCw, Loader2, CheckCircle2, SkipForward, TrendingUp, Users } from 'lucide-react'

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

  // Keep ref in sync with state
  useEffect(() => {
    pendingRef.current = discover.pendingAppIds
  }, [discover.pendingAppIds])

  const scrollToBottom = useCallback(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [])

  // Auto-process next batch when there are pending IDs
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

  const totalToProcess = discover.totalDiscovered - discover.alreadyInDB
  const processed = discover.results.length
  const progressPct = totalToProcess > 0 ? Math.round((processed / totalToProcess) * 100) : 0

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Database size={24} className="text-accent" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

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
            {/* Status bar */}
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

            {/* Results log */}
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

        <div className="text-xs text-text-muted">
          Game discovery runs automatically every Monday. Use buttons to trigger manually.
        </div>
      </div>
    </div>
  )
}
