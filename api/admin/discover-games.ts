import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STORE_API_DELAY = 200
const BATCH_SIZE = 5 // Process 5 games per call to stay within 10s timeout

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// --- Steam Discovery Sources ---

async function fetchSearchResults(filter: string, count = 100): Promise<number[]> {
  const url = `https://store.steampowered.com/search/results/?sort_by=_ASC&ignore_preferences=1&filter=${filter}&infinite=1&count=${count}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const html = (data.results_html ?? '') as string
    return [...html.matchAll(/data-ds-appid="(\d+)"/g)].map(m => parseInt(m[1]))
  } catch { return [] }
}

async function fetchFeaturedCategories(): Promise<number[]> {
  try {
    const res = await fetch('https://store.steampowered.com/api/featuredcategories/')
    if (!res.ok) return []
    const data = await res.json()
    const ids: number[] = []
    for (const key of Object.keys(data)) {
      if (data[key]?.items) {
        for (const item of data[key].items) {
          if (item.id) ids.push(item.id)
        }
      }
    }
    return ids
  } catch { return [] }
}

async function fetchSteamSpyTop(): Promise<number[]> {
  try {
    const res = await fetch('https://steamspy.com/api.php?request=top100in2weeks')
    if (!res.ok) return []
    const data = await res.json()
    return Object.entries(data)
      .filter(([, v]: [string, any]) => (v.average_2weeks ?? 0) >= 3000)
      .map(([k]) => parseInt(k))
  } catch { return [] }
}

async function fetchSteamSpyOwned(): Promise<number[]> {
  try {
    const res = await fetch('https://steamspy.com/api.php?request=top100forever')
    if (!res.ok) return []
    const data = await res.json()
    return Object.keys(data).map(k => parseInt(k))
  } catch { return [] }
}

// --- Game Detail Fetchers ---

interface SteamStoreData {
  type: string
  name: string
  steam_appid: number
  header_image: string
  short_description: string
  is_free: boolean
  price_overview?: { currency: string; initial: number; final: number; discount_percent: number }
  platforms: { windows: boolean; mac: boolean; linux: boolean }
  categories?: Array<{ id: number; description: string }>
  genres?: Array<{ id: string; description: string }>
  release_date?: { coming_soon: boolean; date: string }
}

async function getAppDetails(appId: number): Promise<SteamStoreData | null> {
  try {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data[appId]?.success) return null
    return data[appId].data
  } catch { return null }
}

async function getProtonDBRating(appId: number): Promise<string | null> {
  try {
    const res = await fetch(`https://www.protondb.com/api/v1/reports/summaries/${appId}.json`)
    if (!res.ok) return null
    const data = await res.json()
    return data.tier ?? null
  } catch { return null }
}

async function getSteamReviews(appId: number): Promise<{ score: number; desc: string; count: number } | null> {
  try {
    const res = await fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all`)
    if (!res.ok) return null
    const data = await res.json()
    const s = data.query_summary
    if (!s || s.total_reviews === 0) return null
    const score = Math.round((s.total_positive / s.total_reviews) * 100)
    const desc = score >= 95 ? 'Overwhelmingly Positive'
      : score >= 80 ? 'Very Positive'
      : score >= 70 ? 'Mostly Positive'
      : score >= 40 ? 'Mixed'
      : score >= 20 ? 'Mostly Negative'
      : 'Overwhelmingly Negative'
    return { score, desc, count: s.total_reviews }
  } catch { return null }
}

async function getSteamSpyTags(appId: number): Promise<string[] | null> {
  try {
    const res = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${appId}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.tags || Object.keys(data.tags).length === 0) return null
    return Object.keys(data.tags).slice(0, 10)
  } catch { return null }
}

const MULTIPLAYER_CATEGORIES = [
  'Multi-player', 'Online Multi-Player', 'Co-op', 'Online Co-op',
  'LAN Co-op', 'Shared/Split Screen Co-op', 'Shared/Split Screen',
]

function inferMaxPlayers(categories: string[], tags: string[]): number | null {
  const allLabels = [...categories, ...tags].map(s => s.toLowerCase())
  if (allLabels.some(t => t.includes('massively multiplayer') || t.includes('mmo'))) return 999
  if (allLabels.some(t => t.includes('battle royale'))) return 100
  const hasMP = categories.some(c => ['Multi-player', 'Online Multi-Player'].includes(c))
  const hasCoop = categories.some(c => ['Co-op', 'Online Co-op'].includes(c))
  const hasSP = categories.some(c => c === 'Single-player')
  const hasLocal = categories.some(c => ['Shared/Split Screen', 'Shared/Split Screen Co-op', 'Shared/Split Screen PvP'].includes(c))
  if (hasSP && !hasMP && !hasCoop && !hasLocal) return 1
  if (hasLocal && !hasMP && !hasCoop) return 4
  if (hasCoop && !hasMP) return 4
  if (hasMP && hasCoop) return 8
  if (hasMP) return 16
  return null
}

function parseReleaseDate(dateStr: string): string | null {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0]
  } catch { return null }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
    let pendingAppIds: number[] = body.pendingAppIds ?? []

    // Phase 1: If no pending list, discover from all sources
    if (pendingAppIds.length === 0) {
      const [globalTop, topSellers, popularNew, popularComingSoon, featuredCats, steamSpyTop, steamSpyOwned] = await Promise.all([
        fetchSearchResults('globaltopsellers'),
        fetchSearchResults('topsellers'),
        fetchSearchResults('popularnew'),
        fetchSearchResults('popularcomingsoon'),
        fetchFeaturedCategories(),
        fetchSteamSpyTop(),
        fetchSteamSpyOwned(),
      ])

      const allDiscovered = new Set([
        ...globalTop, ...topSellers, ...popularNew,
        ...popularComingSoon, ...featuredCats,
        ...steamSpyTop, ...steamSpyOwned,
      ])

      const { data: existing } = await supabase.from('games').select('steam_app_id')
      const existingIds = new Set((existing ?? []).map(g => g.steam_app_id))

      pendingAppIds = [...allDiscovered].filter(id => !existingIds.has(id))

      return res.status(200).json({
        phase: 'discovered',
        totalDiscovered: allDiscovered.size,
        alreadyInDB: allDiscovered.size - pendingAppIds.length,
        pendingAppIds,
        totalInDB: existingIds.size,
      })
    }

    // Phase 2: Process a batch of pending games
    const batch = pendingAppIds.slice(0, BATCH_SIZE)
    const remaining = pendingAppIds.slice(BATCH_SIZE)
    const results: Array<{ appId: number; name: string; status: 'added' | 'skipped'; reason?: string }> = []

    for (const appId of batch) {
      await sleep(STORE_API_DELAY)

      const storeData = await getAppDetails(appId)
      if (!storeData || storeData.type !== 'game') {
        results.push({ appId, name: storeData?.name ?? 'Unknown', status: 'skipped', reason: storeData?.type ?? 'no data' })
        continue
      }

      const categories = (storeData.categories ?? []).map(c => c.description)
      const genres = (storeData.genres ?? []).map(g => g.description)
      const protonRating = storeData.platforms.linux ? 'native' : await getProtonDBRating(appId)
      const reviews = await getSteamReviews(appId)
      const steamSpyTags = await getSteamSpyTags(appId)
      const tags = steamSpyTags ?? genres
      const priceCents = storeData.is_free ? 0 : (storeData.price_overview?.final ?? null)

      const { error } = await supabase.from('games').upsert({
        steam_app_id: appId,
        name: storeData.name,
        header_image_url: storeData.header_image,
        description: storeData.short_description,
        is_multiplayer: categories.some(c => MULTIPLAYER_CATEGORIES.includes(c)),
        supports_linux: storeData.platforms.linux || ['native', 'platinum', 'gold', 'silver'].includes(protonRating ?? ''),
        protondb_rating: protonRating,
        steam_review_score: reviews?.score ?? null,
        steam_review_desc: reviews?.desc ?? null,
        steam_review_count: reviews?.count ?? null,
        steam_price_cents: priceCents,
        is_free: storeData.is_free,
        is_on_sale: (storeData.price_overview?.discount_percent ?? 0) > 0,
        sale_percent: storeData.price_overview?.discount_percent ?? null,
        release_date: storeData.release_date?.date ? parseReleaseDate(storeData.release_date.date) : null,
        is_coming_soon: storeData.release_date?.coming_soon ?? false,
        steam_tags: tags,
        categories,
        max_players: inferMaxPlayers(categories, tags),
        last_updated_at: new Date().toISOString(),
      }, { onConflict: 'steam_app_id' })

      if (error) {
        results.push({ appId, name: storeData.name, status: 'skipped', reason: error.message })
      } else {
        results.push({ appId, name: storeData.name, status: 'added' })
      }
    }

    return res.status(200).json({
      phase: 'processing',
      results,
      pendingAppIds: remaining,
      remaining: remaining.length,
      added: results.filter(r => r.status === 'added').length,
      skipped: results.filter(r => r.status === 'skipped').length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
