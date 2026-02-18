import { Zap, ChevronRight } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { OwnershipBadges } from '../players/OwnershipBadges'
import { PriceTag } from '../prices/PriceTag'
import { getSteamHeaderImage, cn } from '../../lib/utils'
import { calculateRecommendationScore } from '../../lib/api'
import type { GameWithOwnership, Player } from '../../types'

interface QuickPickProps {
  games: GameWithOwnership[]
  players: Player[]
  selectedPlayerIds: string[]
  onGameClick: (game: GameWithOwnership) => void
}

export function QuickPick({ games, players, selectedPlayerIds, onGameClick }: QuickPickProps) {
  // Get top 5 recommended games
  const topGames = [...games]
    .sort((a, b) =>
      calculateRecommendationScore(b, selectedPlayerIds.length) -
      calculateRecommendationScore(a, selectedPlayerIds.length)
    )
    .slice(0, 5)

  if (topGames.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-warning" />
        <h2 className="text-sm font-semibold text-text-primary">Tonight's Best Options</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {topGames.map((game, index) => {
          const score = calculateRecommendationScore(game, selectedPlayerIds.length)

          return (
            <Card
              key={game.id}
              className={cn(
                'overflow-hidden',
                index === 0 && 'sm:col-span-2 lg:col-span-2 lg:row-span-2'
              )}
              onClick={() => onGameClick(game)}
            >
              <div className={cn(
                'relative overflow-hidden',
                index === 0 ? 'aspect-[16/9]' : 'aspect-[460/215]'
              )}>
                <img
                  src={game.header_image_url || getSteamHeaderImage(game.steam_app_id)}
                  alt={game.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {index === 0 && (
                      <Badge variant="accent">Top Pick</Badge>
                    )}
                    {game.all_selected_own && (
                      <Badge variant="success">All Own</Badge>
                    )}
                  </div>
                  <h3 className={cn(
                    'font-semibold text-white leading-tight',
                    index === 0 ? 'text-lg' : 'text-xs'
                  )}>
                    {game.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1.5">
                    <OwnershipBadges
                      players={players}
                      owners={game.owners}
                      selectedIds={selectedPlayerIds}
                      compact
                    />
                    <div className="flex items-center gap-2">
                      <PriceTag game={game} />
                      <ChevronRight size={12} className="text-text-muted" />
                    </div>
                  </div>
                </div>

                <div className="absolute top-2 right-2">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                    score >= 70 ? 'bg-success/90 text-white' :
                    score >= 40 ? 'bg-warning/90 text-black' :
                    'bg-white/20 text-white'
                  )}>
                    {score}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
