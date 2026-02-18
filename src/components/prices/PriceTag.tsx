import { Tag } from 'lucide-react'
import { formatPrice, cn } from '../../lib/utils'
import type { Game } from '../../types'

interface PriceTagProps {
  game: Game
  showStore?: boolean
}

export function PriceTag({ game, showStore = false }: PriceTagProps) {
  if (game.is_free) {
    return (
      <span className="text-xs font-semibold text-success">Free to Play</span>
    )
  }

  const bestPrice = game.best_price_cents
  const steamPrice = game.steam_price_cents
  const hasBetterDeal = bestPrice !== null && steamPrice !== null && bestPrice < steamPrice

  return (
    <div className="flex items-center gap-1.5">
      {game.is_on_sale && <Tag size={10} className="text-warning" />}

      {hasBetterDeal ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted line-through">
            {formatPrice(steamPrice)}
          </span>
          <span className={cn('text-xs font-semibold', game.is_on_sale ? 'text-warning' : 'text-success')}>
            {formatPrice(bestPrice)}
          </span>
          {showStore && game.best_price_store && (
            <span className="text-[10px] text-text-muted">
              via {game.best_price_store}
            </span>
          )}
        </div>
      ) : (
        <span className="text-xs font-medium text-text-secondary">
          {formatPrice(steamPrice ?? bestPrice)}
        </span>
      )}
    </div>
  )
}
