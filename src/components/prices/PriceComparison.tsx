import { DollarSign, ExternalLink } from 'lucide-react'
import { Card } from '../ui/Card'
import { formatPrice } from '../../lib/utils'
import type { Game } from '../../types'

interface PriceComparisonProps {
  game: Game
}

export function PriceComparison({ game }: PriceComparisonProps) {
  if (game.is_free) {
    return (
      <Card hover={false} className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign size={14} className="text-success" />
          <span className="text-sm font-semibold text-success">Free to Play</span>
        </div>
      </Card>
    )
  }

  const prices = [
    {
      store: 'Steam',
      price: game.steam_price_cents,
      url: `https://store.steampowered.com/app/${game.steam_app_id}`,
      isBest: !game.best_price_cents || (game.steam_price_cents ?? Infinity) <= game.best_price_cents,
    },
  ]

  if (game.best_price_cents !== null && game.best_price_store) {
    prices.push({
      store: game.best_price_store,
      price: game.best_price_cents,
      url: game.best_price_url || '#',
      isBest: game.best_price_cents < (game.steam_price_cents ?? Infinity),
    })
  }

  // Sort cheapest first
  prices.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))

  return (
    <Card hover={false} className="p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign size={14} className="text-accent" />
        <span className="text-sm font-semibold text-text-primary">Price Comparison</span>
      </div>

      {prices.map(p => (
        <a
          key={p.store}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-primary">{p.store}</span>
            {p.isBest && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success font-medium">
                Best
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-text-primary">
              {formatPrice(p.price)}
            </span>
            <ExternalLink size={10} className="text-text-muted" />
          </div>
        </a>
      ))}

      {game.is_on_sale && game.sale_percent && (
        <div className="text-xs text-warning pt-1">
          Currently {game.sale_percent}% off on Steam
        </div>
      )}
    </Card>
  )
}
