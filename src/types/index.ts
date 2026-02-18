export interface Player {
  id: string
  name: string
  steam_id: string
  steam_profile_url: string
  avatar_url: string | null
  is_primary: boolean
  last_synced_at: string | null
  created_at: string
}

export interface Game {
  id: string
  steam_app_id: number
  name: string
  header_image_url: string | null
  description: string | null
  is_multiplayer: boolean
  max_players: number | null
  min_players: number | null
  supports_linux: boolean
  protondb_rating: ProtonDBRating | null
  has_active_servers: boolean
  servers_deprecated: boolean
  steam_review_score: number | null
  steam_review_desc: string | null
  steam_review_count: number | null
  opencritic_score: number | null
  opencritic_tier: string | null
  steam_price_cents: number | null
  best_price_cents: number | null
  best_price_store: string | null
  best_price_url: string | null
  is_free: boolean
  is_on_sale: boolean
  sale_percent: number | null
  release_date: string | null
  is_coming_soon: boolean
  steam_tags: string[]
  categories: string[]
  trending_score: number | null
  current_players: number | null
  player_count_updated_at: string | null
  last_updated_at: string | null
  created_at: string
}

export interface PlayerGame {
  id: string
  player_id: string
  game_id: string
  playtime_hours: number
  last_played_at: string | null
}

export interface GameSession {
  id: string
  game_id: string
  played_at: string
  notes: string | null
  players: string[]
}

export interface SyncLog {
  id: string
  sync_type: string
  status: 'running' | 'success' | 'error'
  error: string | null
  games_updated: number
  started_at: string
  finished_at: string | null
}

export type ProtonDBRating = 'native' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'borked' | 'pending'

export interface GameWithOwnership extends Game {
  owners: PlayerGame[]
  owner_count: number
  all_selected_own: boolean
  missing_players: Player[]
}

export interface GameModeFilters {
  multiplayer: boolean
  coop: boolean
  singlePlayer: boolean
  localMultiplayer: boolean
}

export type ProtonFilter = 'all' | 'native' | 'platinum' | 'gold'
export type ReleaseDateFilter = 'week' | 'month' | '3months' | '6months' | 'year' | '2years' | '3years' | '5years' | '10years' | 'all'
export type AppTab = 'all' | 'trending' | 'new' | 'shortlisted' | 'excluded'

export interface FilterState {
  selectedPlayers: string[]
  ownedByAll: boolean
  freeOnly: boolean
  onSaleOnly: boolean
  shortlistedOnly: boolean
  linuxOnly: boolean
  genreTags: string[]
  excludeGenreTags: string[]
  sortBy: SortOption[]
  searchQuery: string
  gameModes: GameModeFilters
  protonFilter: ProtonFilter
  releaseDateFilter: ReleaseDateFilter
}

export type SortOption =
  | 'recommendation'
  | 'price_asc'
  | 'price_desc'
  | 'review_score'
  | 'playtime'
  | 'name'
  | 'recently_added'
  | 'trending'
  | 'release_date'
  | 'current_players'

export interface SteamOwnedGame {
  appid: number
  name: string
  playtime_forever: number
  img_icon_url: string
  playtime_linux_forever?: number
  rtime_last_played?: number
}

export interface SteamAppDetails {
  type: string
  name: string
  steam_appid: number
  header_image: string
  short_description: string
  is_free: boolean
  price_overview?: {
    currency: string
    initial: number
    final: number
    discount_percent: number
  }
  platforms: {
    windows: boolean
    mac: boolean
    linux: boolean
  }
  categories?: Array<{ id: number; description: string }>
  genres?: Array<{ id: string; description: string }>
  release_date?: {
    coming_soon: boolean
    date: string
  }
}
