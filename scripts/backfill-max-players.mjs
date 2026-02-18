import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xxahrimxetvmgsnwhgml.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Try to extract max player count from Steam store page HTML
async function getMaxPlayersFromStorePage(appId) {
  try {
    const res = await fetch(`https://store.steampowered.com/app/${appId}`, {
      headers: {
        'Cookie': 'birthtime=0; wants_mature_content=1; lastagecheckage=1-0-1990; Steam_Language=english',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      }
    })
    if (!res.ok) return null
    const html = await res.text()

    // Look for patterns like "Online Multi-Player (2-10)" or "Online Co-op (1-4)"
    // Steam sometimes shows player counts in category tooltips or feature sections
    const patterns = [
      // Pattern: "up to X players" in description
      /up\s+to\s+(\d+)\s+player/i,
      // Pattern: "1-X players" or "2-X players"
      /(\d+)\s*[-–]\s*(\d+)\s+player/i,
      // Pattern: "X player" (e.g. "2 player co-op")
      /\b(\d+)\s+player\b/i,
      // Pattern: "for two" (like It Takes Two)
      /\bfor\s+two\b/i,
      // Pattern: "duo"
      /\bduo\b/i,
      // Steam feature block with player counts: "Online Co-op (2)"
      /Online\s+(?:Multi-Player|Co-op)\s*\((\d+)(?:\s*-\s*(\d+))?\)/i,
      // "supports up to X"
      /supports?\s+up\s+to\s+(\d+)/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        if (pattern.source.includes('for\\s+two') || pattern.source.includes('duo')) {
          return 2
        }
        if (match[2]) {
          // Range pattern (e.g. "1-4 players") - take the higher number
          return parseInt(match[2])
        }
        if (match[1]) {
          return parseInt(match[1])
        }
      }
    }

    return null
  } catch {
    return null
  }
}

// Category-based heuristic fallback
function inferMaxPlayers(categories, steamTags) {
  const cats = categories || []
  const tags = steamTags || []
  const allLabels = [...cats, ...tags].map(s => s.toLowerCase())

  // MMO games
  if (allLabels.some(t => t.includes('massively multiplayer') || t.includes('mmo'))) {
    return 999
  }

  // Battle Royale
  if (allLabels.some(t => t.includes('battle royale'))) {
    return 100
  }

  const hasMultiplayer = cats.some(c => ['Multi-player', 'Online Multi-Player'].includes(c))
  const hasCoop = cats.some(c => ['Co-op', 'Online Co-op'].includes(c))
  const hasSinglePlayer = cats.some(c => c === 'Single-player')
  const hasLocal = cats.some(c => ['Shared/Split Screen', 'Shared/Split Screen Co-op', 'Shared/Split Screen PvP'].includes(c))

  // Only single-player
  if (hasSinglePlayer && !hasMultiplayer && !hasCoop && !hasLocal) {
    return 1
  }

  // Local-only (no online MP) typically 2-4
  if (hasLocal && !hasMultiplayer && !hasCoop) {
    return 4
  }

  // Co-op without competitive multiplayer - typically 2-4
  if (hasCoop && !hasMultiplayer) {
    return 4
  }

  // Has online multiplayer
  if (hasMultiplayer) {
    // If also has co-op, might be smaller (4-8 range)
    if (hasCoop) return 8
    // Pure multiplayer without co-op label - could be larger
    return 16
  }

  return null
}

async function main() {
  const { data: games, error } = await supabase
    .from('games')
    .select('id, steam_app_id, name, categories, steam_tags')
    .order('steam_app_id')

  if (error) { console.error(error); return }
  console.log(`Games to check max players: ${games.length}`)

  let fromStore = 0
  let fromHeuristic = 0
  let noData = 0

  for (let i = 0; i < games.length; i++) {
    const game = games[i]

    // Rate limit: 300ms between requests
    await new Promise(r => setTimeout(r, 300))

    // Try store page first
    let maxPlayers = await getMaxPlayersFromStorePage(game.steam_app_id)
    let source = 'store'

    if (maxPlayers === null) {
      // Fall back to heuristic
      maxPlayers = inferMaxPlayers(game.categories, game.steam_tags)
      source = 'heuristic'
    }

    if (maxPlayers !== null) {
      await supabase.from('games').update({
        max_players: maxPlayers,
      }).eq('id', game.id)

      if (source === 'store') fromStore++
      else fromHeuristic++
    } else {
      noData++
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${games.length} (store: ${fromStore}, heuristic: ${fromHeuristic}, no data: ${noData})`)
    }
  }

  console.log(`\nDone. Store: ${fromStore}, Heuristic: ${fromHeuristic}, No data: ${noData}`)
}

main()
