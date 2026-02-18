import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const CRON_SECRET = process.env.CRON_SECRET

interface SteamSpyGame {
  appid: number
  name: string
  average_2weeks: number
  ccu: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  let gamesUpdated = 0

  try {
    // Fetch SteamSpy top 100 by current players over last 2 weeks
    const spyRes = await fetch('https://steamspy.com/api.php?request=top100in2weeks')
    if (!spyRes.ok) {
      return res.status(500).json({ error: `SteamSpy returned ${spyRes.status}` })
    }
    const spyData: Record<string, SteamSpyGame> = await spyRes.json()
    const topGames = Object.values(spyData)
      .sort((a, b) => b.average_2weeks - a.average_2weeks)

    // Reset all trending scores
    await supabase
      .from('games')
      .update({ trending_score: null })
      .not('trending_score', 'is', null)

    // Assign trending scores based on rank (top game = 100, second = 99, etc.)
    for (let i = 0; i < topGames.length; i++) {
      const game = topGames[i]
      const trendingScore = Math.max(1, 100 - i)

      const { data: existing } = await supabase
        .from('games')
        .select('id')
        .eq('steam_app_id', game.appid)
        .single()

      if (existing) {
        await supabase.from('games').update({
          trending_score: trendingScore,
        }).eq('id', existing.id)
        gamesUpdated++
      }
    }

    // Also boost games with high current player counts not in top 100
    const { data: highPlayerGames } = await supabase
      .from('games')
      .select('id, current_players')
      .is('trending_score', null)
      .not('current_players', 'is', null)
      .gt('current_players', 1000)
      .order('current_players', { ascending: false })
      .limit(100)

    if (highPlayerGames) {
      for (let i = 0; i < highPlayerGames.length; i++) {
        const game = highPlayerGames[i]
        // Give a smaller score (1-50 range) based on player count rank
        const score = Math.max(1, 50 - Math.floor(i / 2))
        await supabase.from('games').update({
          trending_score: score,
        }).eq('id', game.id)
        gamesUpdated++
      }
    }

    return res.status(200).json({ success: true, gamesUpdated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
