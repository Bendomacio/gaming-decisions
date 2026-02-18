import { X, ExternalLink, Clock, Monitor, ShoppingCart, Star } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { OwnershipBadges } from '../players/OwnershipBadges'
import { formatPlaytime, formatPrice, getSteamHeaderImage, getSteamStoreUrl, getProtonDBColor, getReviewColor, cn } from '../../lib/utils'
import type { GameWithOwnership, Player } from '../../types'

interface GameDetailPanelProps {
  game: GameWithOwnership
  players: Player[]
  selectedPlayerIds: string[]
  onClose: () => void
}

export function GameDetailPanel({ game, players, selectedPlayerIds, onClose }: GameDetailPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-bg-secondary border-l border-border z-50 overflow-y-auto">
        {/* Header image */}
        <div className="relative">
          <img
            src={game.header_image_url || getSteamHeaderImage(game.steam_app_id)}
            alt={game.name}
            className="w-full aspect-[460/215] object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="p-3 sm:p-5 space-y-4 sm:space-y-5">
          {/* Title + Store link */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">{game.name}</h2>
            <a
              href={getSteamStoreUrl(game.steam_app_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant="secondary" size="sm">
                <ExternalLink size={12} />
                Steam
              </Button>
            </a>
          </div>

          {/* Description */}
          {game.description && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {game.description}
            </p>
          )}

          {/* Ownership section */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Ownership</h3>
            <div className="space-y-2">
              {players
                .filter(p => selectedPlayerIds.includes(p.id))
                .map(player => {
                  const ownership = game.owners.find(o => o.player_id === player.id)
                  return (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                          ownership ? 'bg-success/20 text-success' : 'bg-error/10 text-error/60'
                        )}>
                          {player.name[0]}
                        </div>
                        <span className="text-sm text-text-primary">{player.name}</span>
                      </div>

                      {ownership ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-text-muted">
                            <Clock size={10} />
                            {formatPlaytime(ownership.playtime_hours)}
                          </div>
                          <Badge variant="success">Owns</Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <a
                            href={getSteamStoreUrl(game.steam_app_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Badge variant="error">
                              <ShoppingCart size={10} />
                              Buy
                            </Badge>
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
            <div className="pt-2 border-t border-border">
              <OwnershipBadges
                players={players}
                owners={game.owners}
                selectedIds={selectedPlayerIds}
              />
            </div>
          </div>

          {/* Price section */}
          <div className="glass-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">Pricing</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Steam</span>
              <span className="text-sm text-text-primary">{formatPrice(game.steam_price_cents)}</span>
            </div>
            {game.best_price_cents !== null && game.best_price_store && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Best: {game.best_price_store}</span>
                <a
                  href={game.best_price_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-success hover:underline"
                >
                  {formatPrice(game.best_price_cents)}
                </a>
              </div>
            )}
            {game.is_on_sale && game.sale_percent && (
              <Badge variant="warning">-{game.sale_percent}% Sale</Badge>
            )}
          </div>

          {/* Reviews section */}
          <div className="glass-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">Reviews</h3>
            {game.steam_review_score !== null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Steam</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getReviewColor(game.steam_review_score) }}
                  />
                  <span className="text-sm text-text-primary">
                    {game.steam_review_desc || `${game.steam_review_score}%`}
                  </span>
                </div>
              </div>
            )}
            {game.opencritic_score !== null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">OpenCritic</span>
                <div className="flex items-center gap-2">
                  <Star size={12} style={{ color: getReviewColor(game.opencritic_score) }} />
                  <span className="text-sm text-text-primary">
                    {game.opencritic_score}/100
                    {game.opencritic_tier && ` (${game.opencritic_tier})`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Linux compatibility */}
          <div className="glass-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Monitor size={14} />
              Linux Compatibility
            </h3>
            {game.protondb_rating && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getProtonDBColor(game.protondb_rating) }}
                />
                <span className="text-sm text-text-primary capitalize">
                  {game.protondb_rating === 'native' ? 'Native Linux' : `ProtonDB: ${game.protondb_rating}`}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {game.steam_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {game.steam_tags.map(tag => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
