import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const STEAM_API_KEY = process.env.STEAM_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface SteamTopGame {
  appid: number
  name: string
  current_players: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({ sync_type: 'trending', status: 'running' })
    .select()
    .single()

  let gamesUpdated = 0

  try {
    // Fetch Steam's most played games (top 100)
    const topGamesRes = await fetch(
      'https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/',
      { headers: { 'Accept': 'application/json' } }
    )

    let topGames: SteamTopGame[] = []
    if (topGamesRes.ok) {
      const data = await topGamesRes.json()
      topGames = (data.response?.ranks ?? []).map((r: { appid: number; concurrent_in_game: number }) => ({
        appid: r.appid,
        current_players: r.concurrent_in_game,
      }))
    }

    // Reset trending scores for all games
    await supabase.from('games').update({ trending_score: null }).neq('id', '00000000-0000-0000-0000-000000000000')

    // Process top games
    for (let i = 0; i < Math.min(topGames.length, 100); i++) {
      const topGame = topGames[i]
      const rank = i + 1
      const trendingScore = Math.max(0, 100 - rank)

      // Check if game exists in our DB
      const { data: existing } = await supabase
        .from('games')
        .select('id, is_multiplayer, supports_linux')
        .eq('steam_app_id', topGame.appid)
        .single()

      if (existing) {
        // Update trending score
        await supabase.from('games').update({
          trending_score: trendingScore,
          last_updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
        gamesUpdated++
      } else {
        // New trending game - fetch details and add if it qualifies
        await sleep(200)
        try {
          const storeRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${topGame.appid}`)
          if (!storeRes.ok) continue
          const storeData = await storeRes.json()
          if (!storeData[topGame.appid]?.success) continue
          const app = storeData[topGame.appid].data
          if (app.type !== 'game') continue

          const categories = (app.categories ?? []).map((c: { description: string }) => c.description)
          const genres = (app.genres ?? []).map((g: { description: string }) => g.description)
          const isMultiplayer = categories.some((c: string) =>
            ['Multi-player', 'Online Multi-Player', 'Co-op', 'Online Co-op'].includes(c)
          )

          const protonRating = app.platforms?.linux ? 'native' : null
          const linuxOk = app.platforms?.linux || false
          // We could check ProtonDB here too, but skip for trending to save API calls

          const reviews = await getSteamReviewScore(topGame.appid)

          const priceCents = app.is_free ? 0 : (app.price_overview?.final ?? null)

          await supabase.from('games').upsert({
            steam_app_id: topGame.appid,
            name: app.name,
            header_image_url: app.header_image,
            description: app.short_description,
            is_multiplayer: isMultiplayer,
            supports_linux: linuxOk,
            protondb_rating: protonRating,
            steam_review_score: reviews?.score ?? null,
            steam_review_desc: reviews?.desc ?? null,
            steam_price_cents: priceCents,
            is_free: app.is_free ?? false,
            is_on_sale: (app.price_overview?.discount_percent ?? 0) > 0,
            sale_percent: app.price_overview?.discount_percent ?? null,
            steam_tags: genres,
            categories: categories,
            trending_score: trendingScore,
            last_updated_at: new Date().toISOString(),
          }, { onConflict: 'steam_app_id' })

          gamesUpdated++
        } catch {
          // Skip failures for individual games
        }
      }
    }

    await supabase.from('sync_log').update({
      status: 'success',
      games_updated: gamesUpdated,
      finished_at: new Date().toISOString(),
    }).eq('id', syncLog?.id)

    return res.status(200).json({ success: true, gamesUpdated })
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

async function getSteamReviewScore(appId: number): Promise<{ score: number; desc: string } | null> {
  try {
    const res = await fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all`)
    if (!res.ok) return null
    const data = await res.json()
    const summary = data.query_summary
    if (!summary || summary.total_reviews === 0) return null
    const score = Math.round((summary.total_positive / summary.total_reviews) * 100)
    const desc = score >= 95 ? 'Overwhelmingly Positive'
      : score >= 80 ? 'Very Positive'
      : score >= 70 ? 'Mostly Positive'
      : score >= 40 ? 'Mixed'
      : score >= 20 ? 'Mostly Negative'
      : 'Overwhelmingly Negative'
    return { score, desc }
  } catch {
    return null
  }
}
