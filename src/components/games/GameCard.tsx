import { ExternalLink, TrendingUp, Clock } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { OwnershipBadges } from '../players/OwnershipBadges'
import { PriceTag } from '../prices/PriceTag'
import { formatPlaytime, getSteamHeaderImage, getSteamStoreUrl, getReviewColor, cn } from '../../lib/utils'
import { calculateRecommendationScore } from '../../lib/api'
import type { GameWithOwnership, Player } from '../../types'

interface GameCardProps {
  game: GameWithOwnership
  players: Player[]
  selectedPlayerIds: string[]
  onClick: () => void
}

export function GameCard({ game, players, selectedPlayerIds, onClick }: GameCardProps) {
  const score = calculateRecommendationScore(game, selectedPlayerIds.length)
  const totalPlaytime = game.owners.reduce((sum, o) => sum + o.playtime_hours, 0)

  return (
    <Card className="overflow-hidden group" onClick={onClick}>
      {/* Header Image */}
      <div className="relative aspect-[460/215] overflow-hidden">
        <img
          src={game.header_image_url || getSteamHeaderImage(game.steam_app_id)}
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {game.all_selected_own && (
            <Badge variant="success">All Own</Badge>
          )}
          {game.is_on_sale && game.sale_percent && (
            <Badge variant="warning">-{game.sale_percent}%</Badge>
          )}
          {game.trending_score && game.trending_score > 50 && (
            <Badge variant="accent">
              <TrendingUp size={10} />
              Trending
            </Badge>
          )}
        </div>

        {/* Score badge */}
        <div className="absolute top-2 right-2">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border',
            score >= 70 ? 'bg-success/20 text-success border-success/30' :
            score >= 40 ? 'bg-warning/20 text-warning border-warning/30' :
            'bg-white/10 text-text-secondary border-border'
          )}>
            {score}
          </div>
        </div>

        {/* Store link */}
        <a
          href={getSteamStoreUrl(game.steam_app_id)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-steam/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-steam"
        >
          <ExternalLink size={12} className="text-steam-blue" />
        </a>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2.5">
        <h3 className="text-sm font-semibold text-text-primary leading-tight line-clamp-1">
          {game.name}
        </h3>

        {/* Ownership + Playtime row */}
        <div className="flex items-center justify-between">
          <OwnershipBadges
            players={players}
            owners={game.owners}
            selectedIds={selectedPlayerIds}
            compact
          />
          {totalPlaytime > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <Clock size={10} />
              {formatPlaytime(totalPlaytime)}
            </div>
          )}
        </div>

        {/* Price + Review row */}
        <div className="flex items-center justify-between">
          <PriceTag game={game} />

          {game.steam_review_score !== null && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getReviewColor(game.steam_review_score) }}
              />
              <span className="text-[10px] text-text-secondary">
                {game.steam_review_desc || `${game.steam_review_score}%`}
              </span>
            </div>
          )}
        </div>

        {/* Linux + Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {game.protondb_rating && (
            <Badge
              variant={game.protondb_rating === 'native' ? 'success' :
                       game.protondb_rating === 'platinum' ? 'info' :
                       game.protondb_rating === 'gold' ? 'warning' : 'default'}
            >
              {game.protondb_rating === 'native' ? 'Native' : `Proton ${game.protondb_rating}`}
            </Badge>
          )}
          {game.steam_tags.slice(0, 2).map(tag => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}
