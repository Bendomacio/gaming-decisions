import type { ProtonDBRating } from '../types'

export function formatPrice(cents: number | null): string {
  if (cents === null) return 'N/A'
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(2)}`
}

export function formatPlaytime(hours: number): string {
  if (hours < 1) return '<1h'
  if (hours < 100) return `${Math.round(hours)}h`
  return `${Math.round(hours)}h`
}

export function getProtonDBColor(rating: ProtonDBRating | null): string {
  switch (rating) {
    case 'native': return '#22c55e'
    case 'platinum': return '#b4c7dc'
    case 'gold': return '#cfb53b'
    case 'silver': return '#a0a0a0'
    case 'bronze': return '#cd7f32'
    case 'borked': return '#ef4444'
    default: return '#6b7280'
  }
}

export function getReviewColor(score: number | null): string {
  if (score === null) return '#6b7280'
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#eab308'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

export function getSteamHeaderImage(appId: number): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`
}

export function getSteamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}`
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
