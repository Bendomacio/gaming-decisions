import { useState, useRef, useEffect } from 'react'
import { ExternalLink, Clock, Undo2 } from 'lucide-react'
import { OwnershipBadges } from '../players/OwnershipBadges'
import { ShortlistStar } from './ShortlistStar'
import {
  formatPlaytime,
  formatPriceGBP,
  getSteamHeaderImage,
  getSteamStoreUrl,
  getReviewColor,
  getProtonDBColor,
  cn,
} from '../../lib/utils'
import type { GameWithOwnership, Player } from '../../types'
import type { ShortlistEntry } from '../../hooks/useShortlist'
import type { ExcludedEntry } from '../../hooks/useExcludedGames'

interface GameRowProps {
  game: GameWithOwnership
  players: Player[]
  selectedPlayerIds: string[]
  isShortlisted: boolean
  shortlistEntry: ShortlistEntry | null
  isExcluded: boolean
  excludedEntry: ExcludedEntry | null
  onShortlistToggle: (gameId: string) => void
  onShortlistTogglePlayer: (gameId: string, playerName: string) => void
  onShortlistSetReason: (gameId: string, reason: string) => void
  onExclude: (gameId: string, reason: string, excludedBy: string) => void
  onRestore: (gameId: string) => void
  onClick: () => void
}

function getMultiplayerModes(categories: string[]): string[] {
  const modes: string[] = []
  if (categories.some(c => ['Multi-player', 'Online Multi-Player'].includes(c))) modes.push('Online')
  if (categories.some(c => ['Co-op', 'Online Co-op'].includes(c))) modes.push('Co-op')
  if (categories.some(c => ['Shared/Split Screen', 'Shared/Split Screen Co-op', 'Shared/Split Screen PvP'].includes(c))) modes.push('Local')
  if (categories.some(c => c === 'LAN Co-op')) modes.push('LAN')
  if (categories.some(c => c === 'Single-player')) modes.push('SP')
  return modes
}

function formatReviewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
  return String(count)
}

export function GameRow({ game, players, selectedPlayerIds, isShortlisted, shortlistEntry, isExcluded, excludedEntry, onShortlistToggle, onShortlistTogglePlayer, onShortlistSetReason, onExclude, onRestore, onClick }: GameRowProps) {
  const totalPlaytime = game.owners.reduce((sum, o) => sum + o.playtime_hours, 0)
  const modes = getMultiplayerModes(game.categories)
  const [showExcludeMenu, setShowExcludeMenu] = useState(false)
  const [excludeReason, setExcludeReason] = useState('')
  const [excludeBy, setExcludeBy] = useState('')
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showExcludeMenu) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExcludeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showExcludeMenu])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isExcluded) return
    setMenuPos({ x: e.clientX, y: e.clientY })
    setExcludeReason('')
    setExcludeBy('')
    setShowExcludeMenu(true)
  }

  const handleExcludeSubmit = () => {
    onExclude(game.id, excludeReason, excludeBy)
    setShowExcludeMenu(false)
  }

  return (
    <>
    <div
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2 border rounded-lg transition-all cursor-pointer",
        isExcluded
          ? "bg-bg-card/50 border-error/20 opacity-60"
          : "bg-bg-card border-border hover:bg-bg-card-hover hover:border-border-hover"
      )}
    >
      {/* Shortlist Star */}
      <div className="flex-shrink-0 w-7">
        <ShortlistStar
          gameId={game.id}
          isShortlisted={isShortlisted}
          entry={shortlistEntry}
          players={players}
          onToggle={onShortlistToggle}
          onTogglePlayer={onShortlistTogglePlayer}
          onSetReason={onShortlistSetReason}
        />
      </div>

      {/* Thumbnail */}
      <div className="relative w-[120px] h-[56px] flex-shrink-0 rounded-md overflow-hidden">
        <img
          src={game.header_image_url || getSteamHeaderImage(game.steam_app_id)}
          alt={game.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Name + Genre */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-text-primary truncate">{game.name}</h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          {game.steam_tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Owners */}
      <div className="flex-shrink-0 w-[100px] flex justify-center">
        <OwnershipBadges
          players={players}
          owners={game.owners}
          selectedIds={selectedPlayerIds}
          compact
          isFree={game.is_free}
        />
      </div>

      {/* Multiplayer Modes */}
      <div className="flex-shrink-0 w-[70px] flex justify-center">
        {modes.length > 0 ? (
          <div className="flex flex-wrap gap-0.5 justify-center">
            {modes.map(mode => (
              <span key={mode} className="text-[9px] text-text-muted bg-white/5 px-1 py-0.5 rounded">
                {mode}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-text-muted">--</span>
        )}
      </div>

      {/* Max Players */}
      <div className="flex-shrink-0 w-[35px] text-center">
        {game.max_players !== null ? (
          <span className={cn(
            'text-[10px] font-medium',
            game.max_players >= 999 ? 'text-text-muted' : 'text-text-secondary'
          )}>
            {game.max_players >= 999 ? 'MMO' : game.max_players}
          </span>
        ) : (
          <span className="text-[10px] text-text-muted">--</span>
        )}
      </div>

      {/* Steam Rating - linked to reviews */}
      <div className="flex-shrink-0 w-[130px]">
        {game.steam_review_score !== null ? (
          <a
            href={`${getSteamStoreUrl(game.steam_app_id)}#app_reviews_hash`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="block hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getReviewColor(game.steam_review_score) }}
              />
              <span className="text-[10px] text-text-secondary truncate">
                {game.steam_review_desc || `${game.steam_review_score}%`}
              </span>
            </div>
            <span className="text-[9px] text-text-muted ml-3.5">
              {game.steam_review_score}%
              {game.steam_review_count != null && ` (${formatReviewCount(game.steam_review_count)})`}
            </span>
          </a>
        ) : (
          <span className="text-[10px] text-text-muted">--</span>
        )}
      </div>

      {/* OpenCritic */}
      <div className="flex-shrink-0 w-[60px] text-center">
        {game.opencritic_score !== null ? (
          <div>
            <span className="text-xs font-semibold" style={{ color: getReviewColor(game.opencritic_score) }}>
              {game.opencritic_score}
            </span>
            {game.opencritic_tier && (
              <div className="text-[9px] text-text-muted">{game.opencritic_tier}</div>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-text-muted">--</span>
        )}
      </div>

      {/* Proton/Linux */}
      <div className="flex-shrink-0 w-[70px] flex justify-center">
        {game.protondb_rating ? (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
            style={{
              color: getProtonDBColor(game.protondb_rating),
              borderColor: `${getProtonDBColor(game.protondb_rating)}40`,
              backgroundColor: `${getProtonDBColor(game.protondb_rating)}15`,
            }}
          >
            {game.protondb_rating === 'native' ? 'Native' : game.protondb_rating.charAt(0).toUpperCase() + game.protondb_rating.slice(1)}
          </span>
        ) : (
          <span className="text-[10px] text-text-muted">--</span>
        )}
      </div>

      {/* Hours Played */}
      <div className="flex-shrink-0 w-[50px] text-center">
        {totalPlaytime > 0 ? (
          <div className="flex items-center justify-center gap-1 text-[10px] text-text-muted">
            <Clock size={10} />
            {formatPlaytime(totalPlaytime)}
          </div>
        ) : (
          <span className="text-[10px] text-text-muted">--</span>
        )}
      </div>

      {/* Steam Price */}
      <div className="flex-shrink-0 w-[60px] text-center">
        {game.is_free ? (
          <span className="text-[10px] font-semibold text-success">Free</span>
        ) : (
          <span className={cn(
            'text-[11px] font-medium',
            game.is_on_sale ? 'text-warning' : 'text-text-secondary'
          )}>
            {formatPriceGBP(game.steam_price_cents)}
          </span>
        )}
      </div>

      {/* Key Price */}
      <div className="flex-shrink-0 w-[60px] text-center">
        {game.is_free ? (
          <span className="text-[10px] text-text-muted">--</span>
        ) : game.best_price_cents !== null ? (
          <span className={cn(
            'text-[11px] font-semibold',
            game.best_price_cents < (game.steam_price_cents ?? Infinity) ? 'text-success' : 'text-text-secondary'
          )}>
            {formatPriceGBP(game.best_price_cents)}
          </span>
        ) : (
          <span className="text-[10px] text-text-muted">--</span>
        )}
      </div>

      {/* Release Date */}
      <div className="flex-shrink-0 w-[65px] text-center">
        {game.release_date ? (
          <span className="text-[10px] text-text-muted">
            {new Date(game.release_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
          </span>
        ) : (
          <span className="text-[10px] text-text-muted">--</span>
        )}
      </div>

      {/* Steam link / Restore button */}
      {isExcluded ? (
        <button
          onClick={e => { e.stopPropagation(); onRestore(game.id) }}
          className="flex-shrink-0 w-6 h-6 rounded-md bg-success/20 flex items-center justify-center hover:bg-success/30 transition-colors cursor-pointer"
          title="Restore game"
        >
          <Undo2 size={10} className="text-success" />
        </button>
      ) : (
        <a
          href={getSteamStoreUrl(game.steam_app_id)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex-shrink-0 w-6 h-6 rounded-md bg-steam/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-steam"
        >
          <ExternalLink size={10} className="text-steam-blue" />
        </a>
      )}

      {/* Excluded reason badge */}
      {isExcluded && excludedEntry && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[9px] text-error/70 max-w-[200px] truncate">
          {excludedEntry.excludedBy && <span className="font-semibold">{excludedEntry.excludedBy}: </span>}
          {excludedEntry.reason || 'Excluded'}
        </div>
      )}
    </div>

    {/* Right-click exclude menu */}
    {showExcludeMenu && (
      <div
        ref={menuRef}
        className="fixed z-50 bg-bg-secondary border border-border rounded-lg shadow-xl p-3 w-60"
        style={{ left: menuPos.x, top: menuPos.y }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-xs font-semibold text-text-primary mb-2">Exclude "{game.name}"</div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => setExcludeBy(excludeBy === p.name ? '' : p.name)}
              className={`px-2 py-0.5 rounded-md text-[11px] border transition-all cursor-pointer ${
                excludeBy === p.name
                  ? 'bg-accent-dim text-accent-hover border-border-accent'
                  : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Reason for excluding..."
          value={excludeReason}
          onChange={e => setExcludeReason(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleExcludeSubmit() }}
          className="w-full bg-bg-input border border-border rounded-md px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-accent transition-colors mb-2"
          maxLength={100}
          autoFocus
        />

        <div className="flex gap-2">
          <button
            onClick={handleExcludeSubmit}
            className="flex-1 px-2 py-1 bg-error/20 text-error text-[11px] rounded-md border border-error/30 hover:bg-error/30 transition-colors cursor-pointer"
          >
            Exclude
          </button>
          <button
            onClick={() => setShowExcludeMenu(false)}
            className="px-2 py-1 text-text-muted text-[11px] rounded-md border border-border hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    )}
    </>
  )
}
