import { TrendingUp, ChevronRight } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { OwnershipBadges } from '../players/OwnershipBadges'
import { getSteamHeaderImage } from '../../lib/utils'
import type { GameWithOwnership, Player } from '../../types'

interface TrendingSectionProps {
  games: GameWithOwnership[]
  players: Player[]
  selectedPlayerIds: string[]
  onGameClick: (game: GameWithOwnership) => void
}

export function TrendingSection({ games, players, selectedPlayerIds, onGameClick }: TrendingSectionProps) {
  const trendingGames = games
    .filter(g => g.trending_score && g.trending_score > 0)
    .sort((a, b) => (b.trending_score ?? 0) - (a.trending_score ?? 0))
    .slice(0, 10)

  if (trendingGames.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-orange-400" />
        <h2 className="text-sm font-semibold text-text-primary">Trending Now</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {trendingGames.map((game, index) => (
          <Card
            key={game.id}
            className="shrink-0 w-48 overflow-hidden"
            onClick={() => onGameClick(game)}
          >
            <div className="relative aspect-[460/215]">
              <img
                src={game.header_image_url || getSteamHeaderImage(game.steam_app_id)}
                alt={game.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute top-1.5 left-1.5">
                <Badge variant="accent">#{index + 1}</Badge>
              </div>
              {game.all_selected_own && (
                <div className="absolute top-1.5 right-1.5">
                  <Badge variant="success">All Own</Badge>
                </div>
              )}
            </div>
            <div className="p-2.5 space-y-1.5">
              <h3 className="text-xs font-semibold text-text-primary leading-tight line-clamp-1">
                {game.name}
              </h3>
              <div className="flex items-center justify-between">
                <OwnershipBadges
                  players={players}
                  owners={game.owners}
                  selectedIds={selectedPlayerIds}
                  compact
                />
                <ChevronRight size={10} className="text-text-muted" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
