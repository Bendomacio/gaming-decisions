import { Calendar, ExternalLink } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { getSteamHeaderImage, getSteamStoreUrl } from '../../lib/utils'
import type { GameWithOwnership } from '../../types'

interface ComingSoonProps {
  games: GameWithOwnership[]
  onGameClick: (game: GameWithOwnership) => void
}

export function ComingSoon({ games, onGameClick }: ComingSoonProps) {
  const comingSoonGames = games
    .filter(g => g.is_coming_soon)
    .sort((a, b) => {
      if (!a.release_date) return 1
      if (!b.release_date) return -1
      return new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
    })
    .slice(0, 6)

  if (comingSoonGames.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-info" />
        <h2 className="text-sm font-semibold text-text-primary">Coming Soon</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {comingSoonGames.map(game => (
          <Card key={game.id} className="overflow-hidden" onClick={() => onGameClick(game)}>
            <div className="flex gap-3 p-3">
              <img
                src={game.header_image_url || getSteamHeaderImage(game.steam_app_id)}
                alt={game.name}
                className="w-24 h-14 rounded-lg object-cover shrink-0"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-semibold text-text-primary leading-tight line-clamp-1">
                  {game.name}
                </h3>
                {game.release_date && (
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {new Date(game.release_date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge variant="info">Upcoming</Badge>
                  <a
                    href={getSteamStoreUrl(game.steam_app_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-text-muted hover:text-steam-blue"
                  >
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
