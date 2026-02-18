import { ExternalLink, Clock } from 'lucide-react'
import { OwnershipBadges } from '../players/OwnershipBadges'
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

interface GameRowProps {
  game: GameWithOwnership
  players: Player[]
  selectedPlayerIds: string[]
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

export function GameRow({ game, players, selectedPlayerIds, onClick }: GameRowProps) {
  const totalPlaytime = game.owners.reduce((sum, o) => sum + o.playtime_hours, 0)
  const modes = getMultiplayerModes(game.categories)

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 px-3 py-2 bg-bg-card border border-border rounded-lg hover:bg-bg-card-hover hover:border-border-hover transition-all cursor-pointer"
    >
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
      <div className="flex-shrink-0 w-[80px] flex justify-center">
        <OwnershipBadges
          players={players}
          owners={game.owners}
          selectedIds={selectedPlayerIds}
          compact
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

      {/* Price (Steam + Key in £) */}
      <div className="flex-shrink-0 w-[90px]">
        {game.is_free ? (
          <span className="text-xs font-semibold text-success">Free</span>
        ) : (
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-muted">Steam:</span>
              <span className={cn(
                'font-medium',
                game.is_on_sale ? 'text-warning' : 'text-text-secondary'
              )}>
                {formatPriceGBP(game.steam_price_cents)}
              </span>
            </div>
            {game.best_price_cents !== null && game.best_price_cents < (game.steam_price_cents ?? Infinity) ? (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-text-muted">Key:</span>
                <span className="font-semibold text-success">
                  {formatPriceGBP(game.best_price_cents)}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Steam link */}
      <a
        href={getSteamStoreUrl(game.steam_app_id)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="flex-shrink-0 w-6 h-6 rounded-md bg-steam/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-steam"
      >
        <ExternalLink size={10} className="text-steam-blue" />
      </a>
    </div>
  )
}
