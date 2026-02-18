import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const STEAM_API_KEY = process.env.STEAM_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET

// Rate limit: 200ms between Steam Store API calls
const STORE_API_DELAY = 200

interface SteamOwnedGame {
  appid: number
  name: string
  playtime_forever: number
  rtime_last_played: number
  img_icon_url: string
  playtime_linux_forever?: number
}

interface SteamStoreData {
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
  platforms: { windows: boolean; mac: boolean; linux: boolean }
  categories?: Array<{ id: number; description: string }>
  genres?: Array<{ id: string; description: string }>
  release_date?: { coming_soon: boolean; date: string }
}

const MULTIPLAYER_CATEGORIES = [
  'Multi-player',
  'Online Multi-Player',
  'Co-op',
  'Online Co-op',
  'LAN Co-op',
  'Shared/Split Screen Co-op',
  'Shared/Split Screen',
]

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getOwnedGames(steamId: string): Promise<SteamOwnedGame[]> {
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Steam API error for ${steamId}: ${res.status}`)
  const data = await res.json()
  return data.response?.games ?? []
}

async function getAppDetails(appId: number): Promise<SteamStoreData | null> {
  try {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data[appId]?.success) return null
    return data[appId].data
  } catch {
    return null
  }
}

async function getProtonDBRating(appId: number): Promise<string | null> {
  try {
    const res = await fetch(`https://www.protondb.com/api/v1/reports/summaries/${appId}.json`)
    if (!res.ok) return null
    const data = await res.json()
    return data.tier ?? null
  } catch {
    return null
  }
}

async function getSteamReviews(appId: number): Promise<{ score: number; desc: string; count: number } | null> {
  try {
    const res = await fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all`)
    if (!res.ok) return null
    const data = await res.json()
    const summary = data.query_summary
    if (!summary || summary.total_reviews === 0) return null
    const score = Math.round((summary.total_positive / summary.total_reviews) * 100)
    const desc = getReviewDescription(score)
    return { score, desc, count: summary.total_reviews }
  } catch {
    return null
  }
}

function getReviewDescription(score: number): string {
  if (score >= 95) return 'Overwhelmingly Positive'
  if (score >= 80) return 'Very Positive'
  if (score >= 70) return 'Mostly Positive'
  if (score >= 40) return 'Mixed'
  if (score >= 20) return 'Mostly Negative'
  return 'Overwhelmingly Negative'
}

function isMultiplayer(categories: string[]): boolean {
  return categories.some(cat => MULTIPLAYER_CATEGORIES.includes(cat))
}

function isLinuxCompatible(platforms: { linux: boolean }, protonRating: string | null): boolean {
  if (platforms.linux) return true
  if (protonRating && ['platinum', 'gold', 'silver', 'native'].includes(protonRating)) return true
  return false
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Create sync log entry
  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({ sync_type: 'libraries', status: 'running' })
    .select()
    .single()

  let gamesUpdated = 0

  try {
    // Fetch all players
    const { data: players } = await supabase.from('players').select('*')
    if (!players || players.length === 0) throw new Error('No players found')

    // Fetch all owned games for each player
    const allOwnedGames = new Map<number, { appId: number; name: string; owners: Map<string, { playtime: number; lastPlayed: number }> }>()

    for (const player of players) {
      const games = await getOwnedGames(player.steam_id)

      for (const game of games) {
        if (!allOwnedGames.has(game.appid)) {
          allOwnedGames.set(game.appid, {
            appId: game.appid,
            name: game.name,
            owners: new Map(),
          })
        }
        allOwnedGames.get(game.appid)!.owners.set(player.id, {
          playtime: Math.round((game.playtime_forever / 60) * 100) / 100,
          lastPlayed: game.rtime_last_played || 0,
        })
      }
    }

    // Get existing games from DB
    const { data: existingGames } = await supabase.from('games').select('steam_app_id, id')
    const existingAppIds = new Set((existingGames ?? []).map(g => g.steam_app_id))

    // Process new games (not yet in DB)
    const newAppIds = Array.from(allOwnedGames.keys()).filter(id => !existingAppIds.has(id))

    for (const appId of newAppIds) {
      await sleep(STORE_API_DELAY)

      const storeData = await getAppDetails(appId)
      if (!storeData || storeData.type !== 'game') continue

      const categories = (storeData.categories ?? []).map(c => c.description)
      const genres = (storeData.genres ?? []).map(g => g.description)
      const multiplayer = isMultiplayer(categories)

      // Get ProtonDB rating
      const protonRating = storeData.platforms.linux ? 'native' : await getProtonDBRating(appId)
      const linuxOk = isLinuxCompatible(storeData.platforms, protonRating)

      // Get review score
      const reviews = await getSteamReviews(appId)

      // Calculate price
      const priceCents = storeData.is_free ? 0 : (storeData.price_overview?.final ?? null)
      const isOnSale = (storeData.price_overview?.discount_percent ?? 0) > 0
      const salePercent = storeData.price_overview?.discount_percent ?? null

      const { error: insertError } = await supabase.from('games').upsert({
        steam_app_id: appId,
        name: storeData.name,
        header_image_url: storeData.header_image,
        description: storeData.short_description,
        is_multiplayer: multiplayer,
        supports_linux: linuxOk,
        protondb_rating: protonRating,
        steam_review_score: reviews?.score ?? null,
        steam_review_desc: reviews?.desc ?? null,
        steam_review_count: reviews?.count ?? null,
        steam_price_cents: priceCents,
        is_free: storeData.is_free,
        is_on_sale: isOnSale,
        sale_percent: salePercent,
        release_date: storeData.release_date?.date ? parseReleaseDate(storeData.release_date.date) : null,
        is_coming_soon: storeData.release_date?.coming_soon ?? false,
        steam_tags: genres,
        categories: categories,
        last_updated_at: new Date().toISOString(),
      }, { onConflict: 'steam_app_id' })

      if (!insertError) gamesUpdated++
    }

    // Update player_games ownership
    const { data: allGamesInDB } = await supabase.from('games').select('id, steam_app_id')
    const gameIdMap = new Map((allGamesInDB ?? []).map(g => [g.steam_app_id, g.id]))

    for (const [appId, gameData] of allOwnedGames) {
      const gameId = gameIdMap.get(appId)
      if (!gameId) continue

      for (const [playerId, ownership] of gameData.owners) {
        await supabase.from('player_games').upsert({
          player_id: playerId,
          game_id: gameId,
          playtime_hours: ownership.playtime,
          last_played_at: ownership.lastPlayed > 0
            ? new Date(ownership.lastPlayed * 1000).toISOString()
            : null,
        }, { onConflict: 'player_id,game_id' })
      }
    }

    // Update player avatars
    for (const player of players) {
      try {
        const profileRes = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${player.steam_id}`
        )
        const profileData = await profileRes.json()
        const profile = profileData.response?.players?.[0]
        if (profile?.avatarmedium) {
          await supabase.from('players').update({
            avatar_url: profile.avatarmedium,
            last_synced_at: new Date().toISOString(),
          }).eq('id', player.id)
        }
      } catch {
        // Non-critical, skip
      }
    }

    // Update sync log
    await supabase.from('sync_log').update({
      status: 'success',
      games_updated: gamesUpdated,
      finished_at: new Date().toISOString(),
    }).eq('id', syncLog?.id)

    return res.status(200).json({
      success: true,
      gamesUpdated,
      totalGames: allOwnedGames.size,
      newGames: newAppIds.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await supabase.from('sync_log').update({
      status: 'error',
      error: message,
      games_updated: gamesUpdated,
      finished_at: new Date().toISOString(),
    }).eq('id', syncLog?.id)

    return res.status(500).json({ error: message })
  }
}

function parseReleaseDate(dateStr: string): string | null {
  try {
    // Steam dates come as "Dec 21, 2020" or similar
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0]
  } catch {
    return null
  }
}
