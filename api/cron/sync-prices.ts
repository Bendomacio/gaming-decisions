import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const ITAD_API_KEY = process.env.ITAD_API_KEY
const CRON_SECRET = process.env.CRON_SECRET

// Process this many games per cron run (fits within 10s Vercel timeout)
const BATCH_SIZE = 20

async function lookupItadId(steamAppId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.isthereanydeal.com/games/lookup/v1?key=${ITAD_API_KEY}&appid=${steamAppId}`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.found ? data.game.id : null
  } catch {
    return null
  }
}

async function getOverview(itadIds: string[]): Promise<{ prices: Array<{ id: string; current: { price: { amountInt: number }; shop?: { name: string }; url?: string } | null }> } | null> {
  try {
    const res = await fetch(
      `https://api.isthereanydeal.com/games/overview/v2?key=${ITAD_API_KEY}&country=GB`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itadIds),
      }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!ITAD_API_KEY) {
    return res.status(200).json({ skipped: true, reason: 'No ITAD_API_KEY configured' })
  }

  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({ sync_type: 'prices', status: 'running' })
    .select()
    .single()

  let gamesUpdated = 0

  try {
    // Get games ordered by least recently updated prices (rotate through all games)
    const { data: games } = await supabase
      .from('games')
      .select('id, steam_app_id, name')
      .eq('supports_linux', true)
      .eq('servers_deprecated', false)
      .eq('is_free', false)
      .order('last_updated_at', { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE)

    if (!games || games.length === 0) {
      await supabase.from('sync_log').update({
        status: 'success',
        games_updated: 0,
        finished_at: new Date().toISOString(),
      }).eq('id', syncLog?.id)
      return res.status(200).json({ success: true, gamesUpdated: 0 })
    }

    // Step 1: Look up ITAD IDs for all games in parallel
    const lookups = await Promise.all(
      games.map(async g => ({ game: g, itadId: await lookupItadId(g.steam_app_id) }))
    )

    const withIds = lookups.filter(l => l.itadId)

    if (withIds.length > 0) {
      // Step 2: Get overview with prices in a single batch call
      const itadIds = withIds.map(l => l.itadId!)
      const overview = await getOverview(itadIds)

      if (overview?.prices) {
        for (const priceData of overview.prices) {
          const lookup = withIds.find(l => l.itadId === priceData.id)
          if (!lookup) continue

          const current = priceData.current
          if (current) {
            await supabase.from('games').update({
              best_price_cents: current.price.amountInt,
              best_price_store: current.shop?.name ?? null,
              best_price_url: current.url ?? null,
              last_updated_at: new Date().toISOString(),
            }).eq('id', lookup.game.id)
            gamesUpdated++
          }
        }
      }
    }

    await supabase.from('sync_log').update({
      status: 'success',
      games_updated: gamesUpdated,
      finished_at: new Date().toISOString(),
    }).eq('id', syncLog?.id)

    return res.status(200).json({ success: true, gamesUpdated, batch: games.length })
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
