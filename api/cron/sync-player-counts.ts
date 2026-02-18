import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const CRON_SECRET = process.env.CRON_SECRET

// Steam's GetNumberOfCurrentPlayers is fast and keyless
// Process 50 games per run (~100ms each = ~5s total, fits in 10s timeout)
const BATCH_SIZE = 50

async function getCurrentPlayers(appId: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.response?.result !== 1) return null
    return data.response.player_count ?? null
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get games ordered by least recently updated player count
    const { data: games } = await supabase
      .from('games')
      .select('id, steam_app_id, name')
      .order('player_count_updated_at', { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE)

    if (!games || games.length === 0) {
      return res.status(200).json({ success: true, updated: 0 })
    }

    let updated = 0

    // Fetch player counts in parallel (batches of 10 to avoid overwhelming)
    for (let i = 0; i < games.length; i += 10) {
      const batch = games.slice(i, i + 10)
      const results = await Promise.all(
        batch.map(async (game) => {
          const count = await getCurrentPlayers(game.steam_app_id)
          return { id: game.id, count }
        })
      )

      for (const { id, count } of results) {
        if (count !== null) {
          const { error } = await supabase
            .from('games')
            .update({
              current_players: count,
              player_count_updated_at: new Date().toISOString(),
            })
            .eq('id', id)

          if (!error) updated++
        } else {
          // Still mark as checked so we rotate through all games
          await supabase
            .from('games')
            .update({
              player_count_updated_at: new Date().toISOString(),
            })
            .eq('id', id)
        }
      }
    }

    return res.status(200).json({
      success: true,
      processed: games.length,
      updated,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
