import { ExternalLink, TrendingUp, Clock } from 'lucide-react'
import { OwnershipBadges } from '../players/OwnershipBadges'
import { PriceTag } from '../prices/PriceTag'
import {
  formatPlaytime,
  getSteamHeaderImage,
  getSteamStoreUrl,
  getReviewColor,
  getProtonDBColor,
  cn,
} from '../../lib/utils'
import { calculateRecommendationScore } from '../../lib/api'
import type { GameWithOwnership, Player } from '../../types'

interface GameRowProps {
  game: GameWithOwnership
  players: Player[]
  selectedPlayerIds: string[]
  onClick: () => void
}

export function GameRow({ game, players, selectedPlayerIds, onClick }: GameRowProps) {
  const score = calculateRecommendationScore(game, selectedPlayerIds.length)
  const totalPlaytime = game.owners.reduce((sum, o) => sum + o.playtime_hours, 0)

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 px-3 py-2 bg-bg-card border border-border rounded-lg hover:bg-bg-card-hover hover:border-border-hover transition-all cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative w-[120px] h-[56px] flex-shrink-0 rounded-md overflow-hidden">
        <img
          src={game.header_image_url || getSteamHeaderImage(game.steam_app_id)}
          alt={game.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {game.trending_score && game.trending_score > 50 && (
          <div className="absolute top-0.5 left-0.5">
            <TrendingUp size={10} className="text-accent-hover drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Name + Tags */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-text-primary truncate">{game.name}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          {game.steam_tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Ownership badges */}
      <div className="flex-shrink-0 w-[90px] flex justify-center">
        <OwnershipBadges
          players={players}
          owners={game.owners}
          selectedIds={selectedPlayerIds}
          compact
        />
      </div>

      {/* Review score */}
      <div className="flex-shrink-0 w-[60px] text-center">
        {game.steam_review_score !== null ? (
          <div className="flex items-center justify-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getReviewColor(game.steam_review_score) }}
            />
            <span className="text-xs text-text-secondary">{game.steam_review_score}%</span>
          </div>
        ) : (
          <span className="text-[10px] text-text-muted">--</span>
        )}
      </div>

      {/* Proton/Linux badge */}
      <div className="flex-shrink-0 w-[80px] flex justify-center">
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

      {/* Playtime */}
      <div className="flex-shrink-0 w-[55px] text-center">
        {totalPlaytime > 0 ? (
          <div className="flex items-center justify-center gap-1 text-[10px] text-text-muted">
            <Clock size={10} />
            {formatPlaytime(totalPlaytime)}
          </div>
        ) : (
          <span className="text-[10px] text-text-muted">--</span>
        )}
      </div>

      {/* Price */}
      <div className="flex-shrink-0 w-[80px] flex justify-center">
        <PriceTag game={game} />
      </div>

      {/* Score */}
      <div className="flex-shrink-0 w-[40px] flex justify-center">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border',
          score >= 70 ? 'bg-success/20 text-success border-success/30' :
          score >= 40 ? 'bg-warning/20 text-warning border-warning/30' :
          'bg-white/10 text-text-secondary border-border'
        )}>
          {score}
        </div>
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
