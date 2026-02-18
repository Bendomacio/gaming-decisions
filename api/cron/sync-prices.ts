import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const ITAD_API_KEY = process.env.ITAD_API_KEY
const CRON_SECRET = process.env.CRON_SECRET

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
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
    // Get games that are multiplayer + linux compatible (the ones we care about)
    const { data: games } = await supabase
      .from('games')
      .select('id, steam_app_id, name')
      .eq('is_multiplayer', true)
      .eq('supports_linux', true)
      .eq('servers_deprecated', false)
      .eq('is_free', false)

    if (!games || games.length === 0) {
      await supabase.from('sync_log').update({
        status: 'success',
        games_updated: 0,
        finished_at: new Date().toISOString(),
      }).eq('id', syncLog?.id)
      return res.status(200).json({ success: true, gamesUpdated: 0 })
    }

    // Process in batches of 5 (ITAD rate limits)
    for (let i = 0; i < games.length; i += 5) {
      const batch = games.slice(i, i + 5)

      for (const game of batch) {
        try {
          // ITAD uses Steam app IDs with a "app/" prefix
          const itadRes = await fetch(
            `https://api.isthereanydeal.com/games/prices/v2?key=${ITAD_API_KEY}&country=AU&capacity=1`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([`app/${game.steam_app_id}`]),
            }
          )

          if (itadRes.ok) {
            const itadData = await itadRes.json()
            const gameKey = `app/${game.steam_app_id}`
            const prices = itadData[gameKey]

            if (prices && prices.length > 0) {
              // Find the cheapest current deal
              const cheapest = prices.reduce((min: { price: { amount: number } }, deal: { price: { amount: number } }) =>
                deal.price.amount < min.price.amount ? deal : min
              , prices[0])

              await supabase.from('games').update({
                best_price_cents: Math.round(cheapest.price.amount * 100),
                best_price_store: cheapest.shop?.name ?? null,
                best_price_url: cheapest.url ?? null,
                last_updated_at: new Date().toISOString(),
              }).eq('id', game.id)

              gamesUpdated++
            }
          }
        } catch {
          // Skip individual failures
        }
      }

      // Rate limit between batches
      if (i + 5 < games.length) {
        await sleep(1000)
      }
    }

    // Also update Steam prices (sales change)
    for (const game of games) {
      try {
        const storeRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.steam_app_id}&filters=price_overview`)
        if (storeRes.ok) {
          const storeData = await storeRes.json()
          const appData = storeData[game.steam_app_id]
          if (appData?.success && appData.data?.price_overview) {
            const price = appData.data.price_overview
            await supabase.from('games').update({
              steam_price_cents: price.final,
              is_on_sale: price.discount_percent > 0,
              sale_percent: price.discount_percent > 0 ? price.discount_percent : null,
            }).eq('id', game.id)
          }
        }
        await sleep(200)
      } catch {
        // Skip
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
