import { supabase } from './supabase'
import type { Game, Player, PlayerGame, GameWithOwnership, SyncLog } from '../types'

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function fetchGames(): Promise<Game[]> {
  // Supabase defaults to 1000 rows; paginate to get all games
  const all: Game[] = []
  const PAGE_SIZE = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('name')
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return all
}

export async function fetchPlayerGames(): Promise<PlayerGame[]> {
  // Supabase defaults to 1000 rows; paginate to get all
  const all: PlayerGame[] = []
  const PAGE_SIZE = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('player_games')
      .select('*')
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return all
}

export async function fetchLatestSync(): Promise<SyncLog | null> {
  const { data, error } = await supabase
    .from('sync_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export function buildGamesWithOwnership(
  games: Game[],
  playerGames: PlayerGame[],
  players: Player[],
  selectedPlayerIds: string[]
): GameWithOwnership[] {
  return games.map(game => {
    const owners = playerGames.filter(pg => pg.game_id === game.id)
    const selectedOwnerIds = owners
      .filter(pg => selectedPlayerIds.includes(pg.player_id))
      .map(pg => pg.player_id)

    const missingPlayers = players.filter(
      p => selectedPlayerIds.includes(p.id) && !selectedOwnerIds.includes(p.id)
    )

    return {
      ...game,
      owners,
      owner_count: selectedOwnerIds.length,
      all_selected_own: missingPlayers.length === 0,
      missing_players: missingPlayers,
    }
  })
}

export function calculateRecommendationScore(game: GameWithOwnership, selectedCount: number): number {
  let score = 0

  // Ownership overlap (0-40 points) - highest weight
  if (selectedCount > 0) {
    score += (game.owner_count / selectedCount) * 40
  }

  // Review score (0-25 points)
  if (game.steam_review_score) {
    score += (game.steam_review_score / 100) * 25
  }

  // Price factor (0-15 points) - free/cheap games get bonus
  if (game.is_free) {
    score += 15
  } else if (game.best_price_cents !== null) {
    score += Math.max(0, 15 - (game.best_price_cents / 1000))
  } else if (game.steam_price_cents !== null) {
    score += Math.max(0, 15 - (game.steam_price_cents / 1000))
  }

  // Trending bonus (0-10 points)
  if (game.trending_score) {
    score += Math.min(10, game.trending_score / 10)
  }

  // On sale bonus (5 points)
  if (game.is_on_sale) {
    score += 5

  }

  // Linux native bonus (5 points)
  if (game.protondb_rating === 'native') {
    score += 5
  }

  return Math.round(score)
}
